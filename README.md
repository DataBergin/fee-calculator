# Fee & Profit Calculator

**See your real profit per sale after card fees, sales tax, and costs.** Built
for Maine small businesses — cafes, restaurants, retail, food trucks, and salons.

Most owners price off gut feel and don't realize how much each sale actually
keeps once the payment processor, sales tax, and cost of goods come out. This
tool shows the true number in seconds, plus your break-even price and monthly
projections.

<!-- Add a screenshot of the calculator here, e.g. docs/screenshot.png -->

_Screenshot: run `npm run dev` and capture the calculator view._

## Who it's for

Small business owners who take card payments and want to price with confidence —
and the operator (you) offering this as a white-labeled service per client.

## 60-second demo

1. Open the app — a one-question onboarding asks your business name, default
   processor, and tax rate.
2. On the **Calculator**, enter a selling price and cost of goods (e.g. $29.99
   and $10).
3. Pick a Maine tax preset (5.5% general, 8% prepared food, 9% lodging) and your
   processor (Stripe, Toast, Square, or Clover), online or in-person.
4. Hit **Calculate Profit** — see net profit per sale, margin %, the processor
   fee, and your break-even price, with a breakdown chart.
5. Add monthly units for a projection, or a tip to see pass-through handling.
6. Every calculation is saved to **History** (exportable as CSV) and rolled up
   in **Insights** (average margin, total fees, best/worst items, trends).

## Features

- **Processors**: Stripe, Toast, Square, Clover — online vs in-person rates
  (see [PROCESSORS.md](./PROCESSORS.md) for sources and how to update).
- **Maine tax presets** plus any custom rate.
- **Tip handling**: pass-through tips don't count against your margin.
- **Trustworthy math**: all calculations use exact decimal arithmetic and are
  covered by automated tests.
- **History + CSV export**, **Insights** charts, **break-even** and **monthly
  projections**.
- **White-label**: set business name, logo, primary color, currency, and theme
  (light/dark) — settings persist in the browser.

## Customizing per client

Everything a client sees is configurable in **Settings** (persisted to the
browser via `localStorage`): business name, logo, primary color, default
processor, default tax rate, currency, and theme. To change the built-in
processor rates, edit `PROCESSORS` in `api/calculate.py` and keep
[PROCESSORS.md](./PROCESSORS.md) in sync.

## Tech stack

- **Frontend**: React + Vite, Recharts
- **Backend**: Python standard library (Vercel serverless functions) — no
  runtime dependencies
- **Tooling**: Vitest + React Testing Library, pytest, ESLint, Prettier, ruff,
  GitHub Actions CI

## Local development

Prerequisites: Node.js 18+, Python 3.9+.

```bash
npm install
npm run dev          # frontend at http://localhost:5173
vercel dev           # API at http://localhost:3001 (npm i -g vercel)
```

### Tests & checks

```bash
npm test                          # frontend (Vitest)
npm run lint && npm run format:check
pip install -r api/requirements-dev.txt
pytest api/                       # API (pytest)
ruff check api/
```

CI runs all of the above on every push and pull request.

## Deploy to Vercel

1. `npm i -g vercel`
2. `vercel` (first run links/creates the project), then `vercel --prod`.
3. Add your custom domain in the Vercel dashboard (HTTPS is automatic).
4. **Set `ALLOWED_ORIGIN`** in the project's Environment Variables to your
   production domain (e.g. `https://yourdomain.com`). The API restricts CORS to
   this origin in production and falls back to `*` only for local dev.
5. (Optional) Enable **Vercel Web Analytics** from the dashboard.

## API

### `POST /api/calculate`

```json
{
  "item_price": 29.99,
  "cost_of_goods": 10.0,
  "shipping_cost": 5.0,
  "tax_rate": 5.5,
  "processor": "stripe",
  "transaction_type": "online",
  "monthly_units": 100,
  "tip_amount": 0,
  "tip_passthrough": true
}
```

Returns `input`, `calculations` (sales tax, total charged, processor fees, net
profit, margin, break-even), `monthly`, and `fee_breakdown`. Invalid input
returns a `400` with `{ error, field, message }`.

### `GET /api/calculate`

Returns supported processors and their fee structures.

### `GET /api/health`

Returns `{ "status": "ok" }` for uptime checks.

## Pricing model (placeholder)

- One-off: setup a customized/white-labeled calculator for a local business.
- Subscription: hosted, branded instance with saved settings and exports.
- _Finalize tiers with the first few pilot customers._

## License

MIT
