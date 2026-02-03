"""
Fee Calculator API - Serverless Python function for Vercel
Calculates payment processor fees, taxes, and profit margins
"""

from http.server import BaseHTTPRequestHandler
from decimal import Decimal, ROUND_HALF_UP
import json

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

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body)
            result = calculate_profit(data)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
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
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(info).encode())
