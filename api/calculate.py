"""
Fee Calculator API - Serverless Python function for Vercel
Calculates payment processor fees, taxes, and profit margins
"""

import json
import os
import sys
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from http.server import BaseHTTPRequestHandler

# Payment processor fee structures
PROCESSORS = {
    "stripe": {
        "name": "Stripe",
        "online": {"percent": Decimal("2.9"), "fixed": Decimal("0.30")},
        "in_person": {"percent": Decimal("2.7"), "fixed": Decimal("0.05")},
    },
    "toast": {
        "name": "Toast",
        # Toast Pay-as-you-go rates
        "online": {"percent": Decimal("2.99"), "fixed": Decimal("0.15")},
        "in_person": {"percent": Decimal("2.49"), "fixed": Decimal("0.15")},
    },
}

VALID_TRANSACTION_TYPES = ("online", "in_person")

# Sanity bounds to reject fat-finger / abusive input at the boundary.
MAX_AMOUNT = Decimal("1000000")
MAX_UNITS = 1_000_000


class ValidationError(ValueError):
    """Raised when request input fails validation. Carries the offending field."""

    def __init__(self, field, message):
        self.field = field
        self.message = message
        super().__init__(message)


def log_event(level, event, **fields):
    """Emit a single-line JSON log record to stdout for Vercel log capture."""
    record = {"level": level, "event": event}
    record.update(fields)
    print(json.dumps(record), file=sys.stdout, flush=True)


def cors_origin():
    """Allowed CORS origin: the deployed domain in prod, '*' for local dev.

    Set ALLOWED_ORIGIN to the production domain in the Vercel environment.
    """
    return os.environ.get("ALLOWED_ORIGIN", "*")


def _require_amount(data, field, *, required, allow_zero):
    """Validate a currency field and return it as a Decimal."""
    if field not in data or data[field] is None or data[field] == "":
        if required:
            raise ValidationError(field, f"{field} is required")
        return Decimal("0")

    try:
        value = Decimal(str(data[field]))
    except (InvalidOperation, ValueError, TypeError):
        raise ValidationError(field, f"{field} must be a number")
    if not value.is_finite():
        raise ValidationError(field, f"{field} must be a finite number")
    if value < 0 or (value == 0 and not allow_zero):
        floor = "0 or greater" if allow_zero else "greater than 0"
        raise ValidationError(field, f"{field} must be {floor}")
    if value > MAX_AMOUNT:
        raise ValidationError(field, f"{field} must not exceed {MAX_AMOUNT}")
    return value


def validate_input(data):
    """Validate request input. Raises ValidationError (with a field) on bad input.

    Runs before calculate_profit so the math layer only ever sees clean values.
    """
    if not isinstance(data, dict):
        raise ValidationError("body", "Request body must be a JSON object")

    _require_amount(data, "item_price", required=True, allow_zero=False)
    _require_amount(data, "cost_of_goods", required=True, allow_zero=True)
    _require_amount(data, "shipping_cost", required=False, allow_zero=True)

    if data.get("tax_rate") not in (None, ""):
        try:
            tax_rate = Decimal(str(data["tax_rate"]))
        except (InvalidOperation, ValueError, TypeError):
            raise ValidationError("tax_rate", "tax_rate must be a number")
        if not tax_rate.is_finite() or tax_rate < 0 or tax_rate > 100:
            raise ValidationError("tax_rate", "tax_rate must be between 0 and 100")

    processor = data.get("processor", "stripe")
    if processor not in PROCESSORS:
        allowed = ", ".join(sorted(PROCESSORS))
        raise ValidationError("processor", f"processor must be one of: {allowed}")

    transaction_type = data.get("transaction_type", "online")
    if transaction_type not in VALID_TRANSACTION_TYPES:
        allowed = ", ".join(VALID_TRANSACTION_TYPES)
        raise ValidationError("transaction_type", f"transaction_type must be one of: {allowed}")

    if data.get("monthly_units") not in (None, ""):
        try:
            monthly_units = int(data["monthly_units"])
        except (ValueError, TypeError):
            raise ValidationError("monthly_units", "monthly_units must be a whole number")
        if monthly_units < 0:
            raise ValidationError("monthly_units", "monthly_units must be 0 or greater")
        if monthly_units > MAX_UNITS:
            raise ValidationError("monthly_units", f"monthly_units must not exceed {MAX_UNITS}")


def calculate_processor_fee(amount: Decimal, processor: str, transaction_type: str) -> dict:
    """Calculate payment processor fee for a given amount."""
    if processor not in PROCESSORS:
        raise ValueError(f"Unknown processor: {processor}")

    rates = PROCESSORS[processor][transaction_type]
    percent_fee = (amount * rates["percent"] / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    fixed_fee = rates["fixed"]
    total_fee = percent_fee + fixed_fee

    return {
        "percent_rate": float(rates["percent"]),
        "fixed_rate": float(rates["fixed"]),
        "percent_fee": float(percent_fee),
        "fixed_fee": float(fixed_fee),
        "total_fee": float(total_fee),
    }


def calculate_sales_tax(amount: Decimal, tax_rate: Decimal) -> Decimal:
    """Calculate sales tax on an amount."""
    return (amount * tax_rate / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def calculate_profit(data: dict) -> dict:
    """
    Calculate complete profit breakdown for a sale.

    Expected input:
    - item_price: Selling price of the item
    - cost_of_goods: Cost to acquire/make the item
    - shipping_cost: Shipping expense (0 if not applicable)
    - tax_rate: Sales tax percentage (0 if not applicable)
    - processor: Payment processor (stripe, toast)
    - transaction_type: online or in_person
    - monthly_units: Optional - units sold per month for projections
    """
    # Convert to Decimal for precise currency math
    item_price = Decimal(str(data["item_price"]))
    cost_of_goods = Decimal(str(data["cost_of_goods"]))
    shipping_cost = Decimal(str(data.get("shipping_cost", 0)))
    tax_rate = Decimal(str(data.get("tax_rate", 0)))
    processor = data.get("processor", "stripe")
    transaction_type = data.get("transaction_type", "online")
    monthly_units = int(data.get("monthly_units", 0))

    # Calculate components
    sales_tax = calculate_sales_tax(item_price, tax_rate)
    total_with_tax = item_price + sales_tax

    # Processor fee is calculated on total charged (including tax)
    processor_fees = calculate_processor_fee(total_with_tax, processor, transaction_type)
    processor_fee = Decimal(str(processor_fees["total_fee"]))

    # Calculate net and profit
    gross_revenue = item_price  # What you "earn" before costs
    total_costs = cost_of_goods + shipping_cost + processor_fee
    net_profit = gross_revenue - total_costs

    # Profit margin percentage
    profit_margin = (net_profit / item_price * Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if item_price > 0 else Decimal("0")

    # Break-even price calculation
    # Price where net_profit = 0
    # price - cogs - shipping - (price * fee_percent / 100 + fixed_fee) = 0
    # price * (1 - fee_percent/100) = cogs + shipping + fixed_fee
    fee_percent = Decimal(str(processor_fees["percent_rate"])) / Decimal("100")
    fixed_fee = Decimal(str(processor_fees["fixed_rate"]))

    if (Decimal("1") - fee_percent) > 0:
        break_even = ((cost_of_goods + shipping_cost + fixed_fee) /
                      (Decimal("1") - fee_percent)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
    else:
        break_even = Decimal("0")

    # Monthly projections
    monthly_revenue = float(gross_revenue * monthly_units) if monthly_units > 0 else 0
    monthly_costs = float(total_costs * monthly_units) if monthly_units > 0 else 0
    monthly_profit = float(net_profit * monthly_units) if monthly_units > 0 else 0

    # Fee breakdown for charts (as percentages of item price)
    fee_breakdown = {
        "cost_of_goods": float(cost_of_goods),
        "shipping": float(shipping_cost),
        "processor_fee": float(processor_fee),
        "profit": float(net_profit),
    }

    return {
        "input": {
            "item_price": float(item_price),
            "cost_of_goods": float(cost_of_goods),
            "shipping_cost": float(shipping_cost),
            "tax_rate": float(tax_rate),
            "processor": PROCESSORS[processor]["name"],
            "transaction_type": transaction_type,
        },
        "calculations": {
            "sales_tax": float(sales_tax),
            "total_charged": float(total_with_tax),
            "processor_fees": processor_fees,
            "total_costs": float(total_costs),
            "net_profit": float(net_profit),
            "profit_margin": float(profit_margin),
            "break_even_price": float(break_even),
        },
        "monthly": {
            "units": monthly_units,
            "revenue": monthly_revenue,
            "costs": monthly_costs,
            "profit": monthly_profit,
        },
        "fee_breakdown": fee_breakdown,
    }


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler."""

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", cors_origin())
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode())

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            log_event("warning", "invalid_json")
            self._send_json(
                400,
                {
                    "error": "invalid_json",
                    "field": "body",
                    "message": "Request body must be valid JSON",
                },
            )
            return

        try:
            validate_input(data)
        except ValidationError as e:
            log_event("warning", "validation_error", field=e.field, message=e.message)
            self._send_json(
                400, {"error": "validation_error", "field": e.field, "message": e.message}
            )
            return

        try:
            result = calculate_profit(data)
        except Exception as e:  # noqa: BLE001 - last-resort guard, must never leak a 500 stacktrace
            log_event("error", "calculation_failed", message=str(e))
            self._send_json(
                500,
                {"error": "internal_error", "message": "Could not complete the calculation"},
            )
            return

        self._send_json(200, result)

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", cors_origin())
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Return processor info."""
        info = {
            "processors": {
                key: {
                    "name": val["name"],
                    "online": {k: float(v) for k, v in val["online"].items()},
                    "in_person": {k: float(v) for k, v in val["in_person"].items()},
                }
                for key, val in PROCESSORS.items()
            }
        }
        self._send_json(200, info)
