# Payment Processor & Tax Rates

This file documents the rates baked into the calculator so they are easy to
audit and update. **Rates change and vary by plan/contract — verify against the
official source before relying on a number for a real client.**

Rates last reviewed: **2026-05-25**.

The processor rates live in `api/calculate.py` (`PROCESSORS`). Update them there
and keep this file in sync. The frontend mirrors them in `src/processors.js`
(`PROCESSORS` + `PROCESSOR_LIST`, used for display and client-side fee
estimation) — update both when a rate changes.

## Payment processors

| Processor | Online (card-not-present) | In-person (card-present) | Plan assumed                                   |
| --------- | ------------------------- | ------------------------ | ---------------------------------------------- |
| Stripe    | 2.9% + $0.30              | 2.7% + $0.05             | Standard pay-as-you-go                         |
| Toast     | 2.99% + $0.15             | 2.49% + $0.15            | Pay-as-you-go                                  |
| Square    | 3.3% + $0.30              | 2.6% + $0.15             | Free plan (raised online rate Jan 2026)        |
| Clover    | 3.5% + $0.10              | 2.6% + $0.10             | Basic tier (higher tiers reach 2.3% in person) |

Notes:

- **Square** raised the free-plan online rate from 2.9% + $0.30 to 3.3% + $0.30
  on 2026-01-13. Paid Square plans ($49+/mo) are 2.9% + $0.30 online and lower
  in person. Manual/keyed entry is 3.5% + $0.15.
- **Clover** in-person rates fall to ~2.3% + $0.10 on higher-cost plans;
  card-not-present/keyed is 3.5% + $0.10 across plans. Clover also typically
  involves a 36-month contract.

### Sources

- Square pricing: https://squareup.com/us/en/pricing and https://squareup.com/us/en/payments/our-fees
- Clover pricing: https://www.clover.com/pricing
- Stripe/Toast: standard published pay-as-you-go rates (verify at stripe.com/pricing and pos.toasttab.com).

## Maine sales tax (default region)

| Category                            | Rate |
| ----------------------------------- | ---- |
| General sales tax                   | 5.5% |
| Prepared food & on-premises alcohol | 8%   |
| Short-term lodging                  | 9%   |
| Short-term auto rental              | 10%  |

The calculator's quick-select dropdown offers the general (5.5%), prepared-food
(8%), lodging (9%), and no-tax (0%) presets; any custom rate can be typed in.

### Source

- Maine Revenue Services — Sales/Use Tax rates: https://www.maine.gov/revenue/taxes/sales-use-service-provider-tax/rates-due-dates
