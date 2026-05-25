# Fee & Profit Calculator

A web app that helps small business owners calculate their true profit per sale after payment processor fees, shipping, and taxes.

## Features

- **Payment Processor Support**: Stripe and Toast with accurate fee structures
- **Transaction Types**: Online vs in-person rates
- **Complete Breakdown**: See exactly where your money goes
- **Visual Charts**: Pie chart of cost breakdown, bar chart for monthly projections
- **Break-Even Analysis**: Know your minimum viable price
- **Monthly Projections**: Forecast your profits at scale

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Python (Vercel Serverless Functions)
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. For the API (in a separate terminal), you can use Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Or run the Python API directly for testing.

### Deploy to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

## API Endpoints

### POST /api/calculate

Calculate profit breakdown for a sale.

**Request Body:**

```json
{
  "item_price": 29.99,
  "cost_of_goods": 10.0,
  "shipping_cost": 5.0,
  "tax_rate": 5.5,
  "processor": "stripe",
  "transaction_type": "online",
  "monthly_units": 100
}
```

**Response:**

```json
{
  "input": { ... },
  "calculations": {
    "sales_tax": 1.65,
    "total_charged": 31.64,
    "processor_fees": {
      "percent_rate": 2.9,
      "fixed_rate": 0.30,
      "total_fee": 1.22
    },
    "net_profit": 13.77,
    "profit_margin": 45.91,
    "break_even_price": 15.77
  },
  "monthly": {
    "units": 100,
    "revenue": 2999.00,
    "costs": 1622.00,
    "profit": 1377.00
  },
  "fee_breakdown": { ... }
}
```

### GET /api/calculate

Returns supported processors and their fee structures.

## Monetization Ideas

1. **One-off sales**: $10-30 for customized calculators for local businesses
2. **Monthly subscriptions**: $5/month for saved scenarios and exports
3. **Freelance embedding**: $50+ to embed on client websites

## License

MIT
