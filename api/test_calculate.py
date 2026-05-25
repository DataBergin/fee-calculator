"""
Tests for the Fee Calculator core math (api/calculate.py).

These tests pin down CURRENT behavior of the calculation functions. A few cases
document known gaps (marked "FINDING") that are intentionally left for the API
hardening phase rather than fixed here, so the math itself is not refactored.

Run with:  pytest api/
"""

import json
from decimal import Decimal

import pytest
from calculate import (
    ValidationError,
    calculate_processor_fee,
    calculate_profit,
    calculate_sales_tax,
    validate_input,
)

# ---------------------------------------------------------------------------
# A. calculate_sales_tax
# ---------------------------------------------------------------------------

def test_sales_tax_standard():
    assert calculate_sales_tax(Decimal("10.00"), Decimal("5.5")) == Decimal("0.55")


def test_sales_tax_zero_rate():
    assert calculate_sales_tax(Decimal("42.00"), Decimal("0")) == Decimal("0.00")


def test_sales_tax_rounds_half_up():
    # 1.00 * 0.5% = 0.005 -> rounds up to 0.01
    assert calculate_sales_tax(Decimal("1.00"), Decimal("0.5")) == Decimal("0.01")


def test_sales_tax_large_amount_keeps_cents():
    assert calculate_sales_tax(Decimal("1000000.00"), Decimal("5.5")) == Decimal("55000.00")


# ---------------------------------------------------------------------------
# B. calculate_processor_fee
# ---------------------------------------------------------------------------

def test_processor_fee_stripe_online():
    fee = calculate_processor_fee(Decimal("10.55"), "stripe", "online")
    assert fee["percent_rate"] == 2.9
    assert fee["fixed_rate"] == 0.30
    assert fee["percent_fee"] == pytest.approx(0.31)  # 0.30595 -> 0.31
    assert fee["fixed_fee"] == pytest.approx(0.30)
    assert fee["total_fee"] == pytest.approx(0.61)


def test_processor_fee_stripe_in_person():
    fee = calculate_processor_fee(Decimal("100.00"), "stripe", "in_person")
    assert fee["percent_rate"] == 2.7
    assert fee["fixed_rate"] == 0.05
    assert fee["percent_fee"] == pytest.approx(2.70)
    assert fee["total_fee"] == pytest.approx(2.75)


def test_processor_fee_toast_online():
    fee = calculate_processor_fee(Decimal("100.00"), "toast", "online")
    assert fee["percent_rate"] == 2.99
    assert fee["fixed_rate"] == 0.15
    assert fee["percent_fee"] == pytest.approx(2.99)
    assert fee["total_fee"] == pytest.approx(3.14)


def test_processor_fee_toast_in_person():
    fee = calculate_processor_fee(Decimal("100.00"), "toast", "in_person")
    assert fee["percent_rate"] == 2.49
    assert fee["fixed_rate"] == 0.15
    assert fee["percent_fee"] == pytest.approx(2.49)
    assert fee["total_fee"] == pytest.approx(2.64)


def test_processor_fee_square_rates():
    online = calculate_processor_fee(Decimal("100.00"), "square", "online")
    assert online["percent_rate"] == 3.3
    assert online["fixed_rate"] == 0.30
    in_person = calculate_processor_fee(Decimal("100.00"), "square", "in_person")
    assert in_person["percent_rate"] == 2.6
    assert in_person["fixed_rate"] == 0.15


def test_processor_fee_clover_rates():
    online = calculate_processor_fee(Decimal("100.00"), "clover", "online")
    assert online["percent_rate"] == 3.5
    assert online["fixed_rate"] == 0.10
    in_person = calculate_processor_fee(Decimal("100.00"), "clover", "in_person")
    assert in_person["percent_rate"] == 2.6
    assert in_person["fixed_rate"] == 0.10


def test_processor_fee_percent_rounds_half_up():
    # 5.00 * 2.9% = 0.1450 -> HALF_UP -> 0.15
    fee = calculate_processor_fee(Decimal("5.00"), "stripe", "online")
    assert fee["percent_fee"] == pytest.approx(0.15)
    assert fee["total_fee"] == pytest.approx(0.45)


def test_processor_fee_unknown_processor_raises_value_error():
    with pytest.raises(ValueError):
        calculate_processor_fee(Decimal("10.00"), "venmo", "online")


def test_processor_fee_invalid_transaction_type_raises_key_error():
    # FINDING: invalid transaction_type surfaces as KeyError, not ValueError.
    with pytest.raises(KeyError):
        calculate_processor_fee(Decimal("10.00"), "stripe", "phone")


def test_processor_fee_return_shape():
    fee = calculate_processor_fee(Decimal("10.00"), "stripe", "online")
    assert set(fee.keys()) == {
        "percent_rate",
        "fixed_rate",
        "percent_fee",
        "fixed_fee",
        "total_fee",
    }
    assert all(isinstance(v, float) for v in fee.values())


# ---------------------------------------------------------------------------
# C. calculate_profit - happy paths
# ---------------------------------------------------------------------------

def test_profit_anchor_stripe_online():
    result = calculate_profit({
        "item_price": 10.00,
        "cost_of_goods": 3.00,
        "shipping_cost": 0,
        "tax_rate": 5.5,
        "processor": "stripe",
        "transaction_type": "online",
        "monthly_units": 100,
    })
    calc = result["calculations"]
    assert calc["sales_tax"] == pytest.approx(0.55)
    assert calc["total_charged"] == pytest.approx(10.55)
    assert calc["processor_fees"]["total_fee"] == pytest.approx(0.61)
    assert calc["total_costs"] == pytest.approx(3.61)
    assert calc["net_profit"] == pytest.approx(6.39)
    assert calc["profit_margin"] == pytest.approx(63.90)
    assert calc["break_even_price"] == pytest.approx(3.40)

    monthly = result["monthly"]
    assert monthly["units"] == 100
    assert monthly["revenue"] == pytest.approx(1000.0)
    assert monthly["costs"] == pytest.approx(361.0)
    assert monthly["profit"] == pytest.approx(639.0)

    assert result["input"]["processor"] == "Stripe"


def test_profit_anchor_toast_in_person():
    result = calculate_profit({
        "item_price": 25.00,
        "cost_of_goods": 8.00,
        "shipping_cost": 2.00,
        "tax_rate": 0,
        "processor": "toast",
        "transaction_type": "in_person",
        "monthly_units": 0,
    })
    calc = result["calculations"]
    assert calc["sales_tax"] == pytest.approx(0.0)
    assert calc["total_charged"] == pytest.approx(25.00)
    assert calc["processor_fees"]["total_fee"] == pytest.approx(0.77)
    assert calc["total_costs"] == pytest.approx(10.77)
    assert calc["net_profit"] == pytest.approx(14.23)
    assert calc["profit_margin"] == pytest.approx(56.92)
    assert calc["break_even_price"] == pytest.approx(10.41)

    monthly = result["monthly"]
    assert monthly["revenue"] == 0
    assert monthly["costs"] == 0
    assert monthly["profit"] == 0

    assert result["input"]["processor"] == "Toast"


def test_profit_applies_defaults_when_fields_omitted():
    result = calculate_profit({"item_price": 10.00, "cost_of_goods": 5.00})
    assert result["input"]["processor"] == "Stripe"
    assert result["input"]["transaction_type"] == "online"
    assert result["input"]["shipping_cost"] == 0
    assert result["input"]["tax_rate"] == 0
    # stripe online on 10.00 (no tax): 0.29 + 0.30 = 0.59 fee
    assert result["calculations"]["processor_fees"]["total_fee"] == pytest.approx(0.59)
    assert result["calculations"]["net_profit"] == pytest.approx(4.41)
    assert result["monthly"]["units"] == 0


def test_tax_increases_processor_fee():
    base = {
        "item_price": 100.00,
        "cost_of_goods": 0,
        "processor": "stripe",
        "transaction_type": "online",
    }
    no_tax = calculate_profit({**base, "tax_rate": 0})
    with_tax = calculate_profit({**base, "tax_rate": 10})
    fee_no_tax = no_tax["calculations"]["processor_fees"]["total_fee"]
    fee_with_tax = with_tax["calculations"]["processor_fees"]["total_fee"]
    assert fee_with_tax > fee_no_tax


# ---------------------------------------------------------------------------
# D. break-even
# ---------------------------------------------------------------------------

def test_break_even_formula():
    # stripe online, cogs 5, no shipping: (5 + 0.30) / (1 - 0.029) = 5.46
    result = calculate_profit({
        "item_price": 50.00,
        "cost_of_goods": 5.00,
        "processor": "stripe",
        "transaction_type": "online",
    })
    assert result["calculations"]["break_even_price"] == pytest.approx(5.46)


def test_break_even_round_trip_at_zero_tax():
    # FINDING: break_even ignores sales tax, so the round-trip only nets ~0 at tax=0.
    first = calculate_profit({
        "item_price": 50.00,
        "cost_of_goods": 5.00,
        "tax_rate": 0,
        "processor": "stripe",
        "transaction_type": "online",
    })
    break_even = first["calculations"]["break_even_price"]
    at_break_even = calculate_profit({
        "item_price": break_even,
        "cost_of_goods": 5.00,
        "tax_rate": 0,
        "processor": "stripe",
        "transaction_type": "online",
    })
    assert abs(at_break_even["calculations"]["net_profit"]) <= 0.01


# ---------------------------------------------------------------------------
# E. monthly projections
# ---------------------------------------------------------------------------

def test_monthly_profit_equals_revenue_minus_costs():
    result = calculate_profit({
        "item_price": 12.50,
        "cost_of_goods": 4.00,
        "tax_rate": 5.5,
        "monthly_units": 30,
    })
    monthly = result["monthly"]
    assert monthly["profit"] == pytest.approx(monthly["revenue"] - monthly["costs"])


def test_monthly_zero_units_yields_zero_projection():
    result = calculate_profit({
        "item_price": 12.50,
        "cost_of_goods": 4.00,
        "monthly_units": 0,
    })
    assert result["monthly"]["revenue"] == 0
    assert result["monthly"]["costs"] == 0
    assert result["monthly"]["profit"] == 0


def test_monthly_negative_units_treated_as_zero():
    result = calculate_profit({
        "item_price": 12.50,
        "cost_of_goods": 4.00,
        "monthly_units": -5,
    })
    assert result["monthly"]["revenue"] == 0
    assert result["monthly"]["costs"] == 0
    assert result["monthly"]["profit"] == 0


# ---------------------------------------------------------------------------
# E2. tip handling
# ---------------------------------------------------------------------------

def test_no_tip_leaves_total_charged_unchanged():
    result = calculate_profit({"item_price": 10.00, "cost_of_goods": 3.00, "tax_rate": 0})
    assert result["calculations"]["total_charged"] == pytest.approx(10.00)


def test_passthrough_tip_only_costs_its_processor_fee():
    base = {
        "item_price": 10.00,
        "cost_of_goods": 3.00,
        "tax_rate": 0,
        "processor": "stripe",
        "transaction_type": "online",
    }
    no_tip = calculate_profit(base)
    tipped = calculate_profit({**base, "tip_amount": 5.00, "tip_passthrough": True})

    # Customer is charged the tip, but it is not kept as revenue.
    assert tipped["calculations"]["total_charged"] == pytest.approx(15.00)
    assert tipped["calculations"]["net_profit"] == pytest.approx(6.26)
    # Margin drops only by the extra processor fee on the tip.
    assert tipped["calculations"]["net_profit"] < no_tip["calculations"]["net_profit"]


def test_non_passthrough_tip_counts_as_revenue():
    result = calculate_profit({
        "item_price": 10.00,
        "cost_of_goods": 3.00,
        "tax_rate": 0,
        "processor": "stripe",
        "transaction_type": "online",
        "tip_amount": 5.00,
        "tip_passthrough": False,
    })
    assert result["calculations"]["total_charged"] == pytest.approx(15.00)
    assert result["calculations"]["net_profit"] == pytest.approx(11.26)


def test_tip_defaults_to_passthrough():
    result = calculate_profit({"item_price": 10.00, "cost_of_goods": 3.00, "tip_amount": 5.00})
    assert result["input"]["tip_passthrough"] is True


# ---------------------------------------------------------------------------
# F. calculate_profit edge cases (it assumes pre-validated input; validate_input
#    is the boundary guard tested in section H)
# ---------------------------------------------------------------------------

def test_missing_item_price_raises_key_error():
    # Reaching calculate_profit without item_price is a programmer error;
    # the HTTP path is guarded by validate_input (section H).
    with pytest.raises(KeyError):
        calculate_profit({"cost_of_goods": 5.00})


def test_missing_cost_of_goods_raises_key_error():
    with pytest.raises(KeyError):
        calculate_profit({"item_price": 10.00})


def test_zero_item_price_no_division_error():
    # The math layer is robust to a zero price (no ZeroDivisionError), even though
    # validate_input rejects it at the boundary.
    result = calculate_profit({"item_price": 0, "cost_of_goods": 5.00})
    assert result["calculations"]["profit_margin"] == 0
    # only the fixed processor fee applies on a zero charge
    assert result["calculations"]["processor_fees"]["total_fee"] == pytest.approx(0.30)


def test_large_values_do_not_overflow():
    result = calculate_profit({
        "item_price": 1_000_000_000,
        "cost_of_goods": 0,
        "processor": "stripe",
        "transaction_type": "online",
    })
    assert result["calculations"]["net_profit"] > 0
    assert isinstance(result["calculations"]["net_profit"], float)


def test_extra_unknown_fields_are_ignored():
    result = calculate_profit({
        "item_price": 10.00,
        "cost_of_goods": 5.00,
        "totally_unknown_field": "ignored",
    })
    assert result["calculations"]["net_profit"] == pytest.approx(4.41)


# ---------------------------------------------------------------------------
# G. output contract
# ---------------------------------------------------------------------------

def test_result_is_json_serializable():
    result = calculate_profit({"item_price": 10.00, "cost_of_goods": 5.00})
    # should not raise
    json.dumps(result)


def test_result_top_level_keys():
    result = calculate_profit({"item_price": 10.00, "cost_of_goods": 5.00})
    assert set(result.keys()) == {"input", "calculations", "monthly", "fee_breakdown"}


def test_input_echoes_processor_display_name():
    result = calculate_profit({
        "item_price": 10.00,
        "cost_of_goods": 5.00,
        "processor": "toast",
    })
    assert result["input"]["processor"] == "Toast"


# ---------------------------------------------------------------------------
# H. validate_input - boundary validation (returns structured 400s in handler)
# ---------------------------------------------------------------------------

def test_validate_accepts_minimal_valid_input():
    # should not raise
    validate_input({"item_price": 10.00, "cost_of_goods": 5.00})


def test_validate_accepts_full_valid_input():
    validate_input({
        "item_price": 29.99,
        "cost_of_goods": 10,
        "shipping_cost": 5,
        "tax_rate": 5.5,
        "processor": "toast",
        "transaction_type": "in_person",
        "monthly_units": 100,
    })


def test_validate_error_is_value_error_subclass():
    # The handler historically caught ValueError; keep that contract.
    assert issubclass(ValidationError, ValueError)


def test_validate_rejects_non_dict_body():
    with pytest.raises(ValidationError) as exc:
        validate_input([1, 2, 3])
    assert exc.value.field == "body"


def test_validate_missing_item_price():
    with pytest.raises(ValidationError) as exc:
        validate_input({"cost_of_goods": 5.00})
    assert exc.value.field == "item_price"


def test_validate_missing_cost_of_goods():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00})
    assert exc.value.field == "cost_of_goods"


def test_validate_rejects_non_numeric_item_price():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": "abc", "cost_of_goods": 5.00})
    assert exc.value.field == "item_price"


def test_validate_rejects_zero_item_price():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 0, "cost_of_goods": 5.00})
    assert exc.value.field == "item_price"


def test_validate_rejects_negative_item_price():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": -10.00, "cost_of_goods": 5.00})
    assert exc.value.field == "item_price"


def test_validate_rejects_negative_cost_of_goods():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": -5.00})
    assert exc.value.field == "cost_of_goods"


def test_validate_allows_zero_cost_of_goods():
    validate_input({"item_price": 10.00, "cost_of_goods": 0})


def test_validate_rejects_negative_shipping():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "shipping_cost": -1})
    assert exc.value.field == "shipping_cost"


def test_validate_rejects_negative_tip():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "tip_amount": -2})
    assert exc.value.field == "tip_amount"


def test_validate_accepts_square_and_clover():
    validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "processor": "square"})
    validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "processor": "clover"})


def test_validate_rejects_tax_rate_above_100():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "tax_rate": 150})
    assert exc.value.field == "tax_rate"


def test_validate_rejects_negative_tax_rate():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "tax_rate": -1})
    assert exc.value.field == "tax_rate"


def test_validate_rejects_unknown_processor():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "processor": "venmo"})
    assert exc.value.field == "processor"


def test_validate_rejects_invalid_transaction_type():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "transaction_type": "phone"})
    assert exc.value.field == "transaction_type"


def test_validate_rejects_negative_units():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "monthly_units": -5})
    assert exc.value.field == "monthly_units"


def test_validate_rejects_non_integer_units():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 10.00, "cost_of_goods": 5.00, "monthly_units": "lots"})
    assert exc.value.field == "monthly_units"


def test_validate_rejects_amount_over_max():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": 5_000_000, "cost_of_goods": 5.00})
    assert exc.value.field == "item_price"


def test_validation_error_carries_field_and_message():
    with pytest.raises(ValidationError) as exc:
        validate_input({"item_price": -1, "cost_of_goods": 5.00})
    assert exc.value.field == "item_price"
    assert isinstance(exc.value.message, str) and exc.value.message
