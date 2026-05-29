# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend (Node 18+):

```bash
npm install
npm run dev               # Vite dev server on :5173 (proxies /api to :3001)
npm run build             # production build
npm test                  # Vitest run-once
npm run test:watch        # Vitest watch
npx vitest run src/processors.test.js   # single test file
npm run lint              # ESLint on .js/.jsx
npm run format:check      # Prettier check (use `npm run format` to write)
```

API (Python 3.9+, stdlib only at runtime):

```bash
pip install -r api/requirements-dev.txt
pytest api/                               # full suite
pytest api/test_calculate.py::test_name   # single test
ruff check api/
vercel dev                                # serve /api locally on :3001 (npm i -g vercel)
```

CI (`.github/workflows/ci.yml`) runs lint + both test suites on every push/PR.
`deploy.yml` deploys to Vercel on push to `main` once `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets exist (skips silently otherwise).

## Architecture

Two-tier app with a deliberately duplicated fee model:

- **Frontend** — React + Vite SPA. Entry `src/main.jsx` → `src/App.jsx` (~650
  lines, holds most of the app state: settings, calculator inputs, history,
  active tab). View components live in `src/components/` (`Calculator`,
  `Results`, `Insights`, `ImportAnalysis`, `OnboardingModal`). Pure logic
  modules — `analyze.js`, `csvParse.js`, `csv.js`, `insights.js`,
  `processors.js`, `settings.js`, `color.js`, `format.js` — each have a
  colocated `*.test.js(x)` Vitest file.
- **API** — `api/calculate.py` is a single Vercel serverless function using
  `BaseHTTPRequestHandler` and the stdlib only (no `requirements.txt` deps at
  runtime). All currency math uses `Decimal` with `ROUND_HALF_UP` to the cent.
  `validate_input` enforces type/sign/range and raises `ValidationError(field,
  message)` → `400 {error, field, message}`. `api/health.py` returns
  `{"status": "ok"}` for uptime checks.

### Processor rates live in three places — keep all three in sync

A rate change must touch:

1. `api/calculate.py` — `PROCESSORS` dict (`Decimal` values)
2. `src/processors.js` — `PROCESSORS` + `PROCESSOR_LIST` (numbers)
3. `PROCESSORS.md` — human-facing table + sources + "last reviewed" date

`src/processors.js`'s `processorFee()` is parity-tested against the Python
suite (see `src/processors.test.js`); the two implementations must agree to the
cent. The frontend uses the JS version for client-side estimation (e.g. the
CSV-import effective-rate analysis runs entirely in the browser); the Python
endpoint is the canonical calculator for `POST /api/calculate`.

### Settings & history persistence

`src/settings.js` reads/writes a versioned schema in `localStorage`
(business name, logo, primary color, default processor/tax, currency, theme).
History is currently in-memory in `App.jsx` and lost on reload — Insights
depends on it, so persisting history is a known follow-up (see `STATUS.md`).

### CORS

`api/calculate.py:cors_origin()` reads `ALLOWED_ORIGIN` env var and falls back
to `*` for local dev. Set `ALLOWED_ORIGIN=https://yourdomain.com` in Vercel for
production.

## Conventions

- All money math goes through `Decimal` (Python) or integer-cent rounding (JS,
  see `processorFee`) — never raw floats. Match the rounding (`ROUND_HALF_UP`
  to `0.01`) when adding new calculations.
- Validate at the API boundary in `validate_input` so `calculate_profit` only
  ever sees clean values; raise `ValidationError(field, message)` rather than
  letting `Decimal`/`int` raise.
- Pass-through tips (`tip_passthrough=True`, default) are excluded from gross
  revenue but the processor fee on the tip is still a cost — preserve this when
  touching `calculate_profit`.
- Project context, roadmap, and recent decisions live in `STATUS.md`; rate
  sources live in `PROCESSORS.md`. Update them when the related code changes.
