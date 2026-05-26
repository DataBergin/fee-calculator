# Fee Calculator → Independent Fee Advisor — Project Status

_Last updated: 2026-05-26 · Branch: `claude/funny-sagan-By9uT`_

## Snapshot

- **Tests:** 124 passing (67 frontend Vitest + 57 API pytest)
- **Quality:** ESLint, Prettier, ruff all clean; production build succeeds
- **CI:** GitHub Actions runs lint + both test suites on every push/PR
- **Deployed:** Not yet — live Vercel deploy is the only remaining definition-of-done item and is your owned step (domain + Vercel account)

---

## Done

### Original build — MVP → production-ready (Phases 1–6)

- **Phase 1 — Lock correctness:** pytest for the fee math; Vitest + React Testing Library for components; ESLint/Prettier/ruff; GitHub Actions CI.
- **Phase 2 — Harden API:** `validate_input` with type/sign/range checks returning `400 {error, field, message}`; `/api/health`; structured JSON logs; env-gated CORS (`ALLOWED_ORIGIN` in prod, `*` in dev). Fixed the non-numeric-input → 500 gap.
- **Phase 3 — Finish features:** settings persisted to `localStorage` (versioned schema); business name flows from settings (removed hardcoded "Jack's Cafe"); real system/light/dark theme; Insights tab built on history; topbar search filters History.
- **Phase 4 — Productionize:** white-label logo (base64) + primary color; CSV export; first-run onboarding modal; mobile nav (hamburger + slide-in sidebar); designed empty/error states.
- **Phase 5 — Maine polish:** Square & Clover added with rates verified against 2026 sources; Maine tax presets (5.5% / 8% / 9%); tip handling with pass-through toggle; all documented in `PROCESSORS.md`.
- **Phase 6 — Ship prep:** landing hero, README rewritten for evaluators, Vercel deploy notes.
- **Deploy automation:** `.github/workflows/deploy.yml` deploys to Vercel on merge to `main` once secrets are set (skips gracefully until then).

### Strategic pivot (this session)

- **Repositioned** from "fee calculator" to **independent profit & fee advisor** — the angle a POS can't offer because it profits from the fees and doesn't know the merchant's costs.
- **Monetization decided: audit-led** (see below).
- **Advisor Phase A shipped — CSV import + effective rate:**
  - New **Import** tab: upload a Square/Toast/Clover sales CSV → auto-guessed column mapping → effective blended rate, card volume, average ticket, **small-ticket fee drag**, ticket-size histogram.
  - Fully **client-side** — the file is parsed and analyzed in the browser, never uploaded (privacy = trust).
  - New tested modules: `csvParse.js`, `analyze.js`, `processors.js` (now the single source of processor rates; `processorFee` parity-tested against the Python suite).
  - Consolidated the previously-duplicated processor lists onto `src/processors.js`.

---

## Key decisions

- **Positioning:** independent, unbiased advisor; **privacy** (analysis runs in the browser).
- **Monetization — audit-led:**
  - **Primary:** one-time "Fee Health Check" audit, priced against found savings. Suggested tiers: food truck ~$200, café/retail ~$350, full-service restaurant ~$500.
  - **Lead magnet:** the free effective-rate tool funnels to the paid audit.
  - **Upsell:** light quarterly monitoring retainer.
  - **Scale path (later):** white-label to bookkeepers/accountants.
  - **Guardrail:** never take processor referral commissions — it destroys the independence that is the whole moat.

---

## Next steps

### Product roadmap

- **Phase B — Savings / switch analysis** (the "$X/yr saved" number that sells the audit). Requires extending the rate model with **monthly software fees + contract length** per processor, or the comparison misleads.
- **Phase C — Pricing levers:** card minimum, surcharge, cash discount, plan-tier upgrade, with margin impact. Verify current Maine + Visa/Mastercard surcharge rules; advisory only, with disclaimer.
- **Phase D — Fee Health Report:** one-page exportable/printable summary = the merchant's deliverable and your prospecting artifact.

### Enabling refactors (from the design review)

- **Persist history (and imports) to `localStorage`** — today history is in-memory and lost on reload, yet Insights depends on it.
- **Decompose `App.jsx`** (~650 lines) into a `useSettings` hook + view components.
- Optionally move the fee math into a shared client-side module so the Python endpoint becomes optional.

### Deployment (your owned step)

1. Buy a domain (options floated: `truemargin.app`, `profitpersale.com`, `mainemargin.com`).
2. Add repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (from `vercel link`).
3. Merge to `main` (auto-deploys) or run `vercel --prod`.
4. In Vercel: attach the domain and set `ALLOWED_ORIGIN=https://yourdomain.com`.

### Validate with real owners (before building more)

- Will they actually export and upload a sales CSV?
- Does contract/hardware lock-in kill the "switch & save" pitch?
- Is the effective-rate number believable / surprising?
- Price sensitivity for the audit.

---

## Commit log (this branch)

- `8942518` Add CSV import + effective-rate analysis (advisor Phase A)
- `ac00c7d` Add Vercel auto-deploy workflow
- `f06ebe0` Ship prep: landing hero, evaluator README, deploy notes (Phase 6)
- `8cddc00` Maine polish: Square/Clover, tax presets, tip handling (Phase 5)
- `f44e209` Productionize for clients: white-label, CSV export, onboarding, mobile (Phase 4)
- `431d2ae` Finish unfinished features: settings, dark mode, insights, search (Phase 3)
- `4502da3` Harden API: input validation, structured errors, health check (Phase 2)
- `83e424e` Add component tests, linting, and CI (Phase 1)
- `3bf9b52` Add pytest suite for fee/profit calculations
