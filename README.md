# DomainFlip AI

DomainFlip AI is a domain research workspace for people who want more than a quick appraisal number.

It combines deterministic scoring, a local machine-learning model, comparable sales from a historical dataset, live RDAP ownership data, and an AI advisory layer into one analysis flow. The goal is not to promise profit. The goal is to help someone make a more disciplined buy, watch, or avoid decision, and to always show the evidence behind a number.

> Looking for the deep dive? See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how every layer works, and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what is intentionally incomplete and where the project is headed.

---

## What the product does

### Analyze a domain (`/analyze`)
- Normalizes and validates the input.
- Scores it across 10 signals: TLD strength, length, brandability, memorability, pronounceability, brand prestige, trend relevance, commercial intent, registration history, and risk penalties.
- Pulls live RDAP metadata: registrar, creation date, expiry, and status flags.
- Detects resale posture and marketplace hints.
- Blends the ML prediction, comparable sales, and TLD benchmarks into a value estimate, with risk-aware caps.
- Surfaces live AI signals (premium feel, end-user demand, aftermarket strength, negotiation risk) and a written advisory summary.
- Produces a deterministic investment report: reasons to buy, reasons to avoid, ideal buyer, acquisition strategy, and a final verdict.
- Projects a 3-year value scenario range.

### Compare and battle-test names
- Compare two domains side by side.
- Run a 3 to 5 domain battle and see the leaders for liquidity, brand strength, and acquisition fit.

### Track a watchlist (`/watchlist`)
- Save domains to a Clerk-authenticated, Convex-backed watchlist.
- Recheck a single name or the full list.
- Store a target buy price, max budget, and negotiation stance per domain.

### Explore the market dataset (`/market`)
- Browse historical sales from the local dataset.
- Filter by TLD, category, search term, and price range.
- Compare TLD performance and review category breakdowns.
- See anomaly flags and dataset-backed trend snapshots.

### Use the assistant (`/assistant`)
- Ask grounded domain questions.
- Generate domain ideas from a budget, keywords, naming style, and TLD preferences.
- Get an AI perspective alongside the scoring and ML layers.

---

## Product surfaces

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/analyze` | Primary analysis workflow |
| `/market` | Market intelligence workspace |
| `/assistant` | AI idea generation and chat |
| `/watchlist` | Protected watchlist and portfolio monitor |

---

## How pricing works

Pricing is intentionally not based on a single signal. The valuation stack blends:

1. A local ML prediction trained on historical sales.
2. The nearest comparable sales from the dataset (deduped, similarity-scored).
3. Curated TLD benchmark anchors.
4. Rule-based quality signals.
5. AI advisory signals for premium feel, end-user demand, and aftermarket strength.

The blend then passes through risk-aware caps so weak-evidence names do not inherit unrealistic values just because a strong TLD has expensive historical outliers. The full chain (raw signal to final estimate) is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#valuation-pipeline).

Investment-facing UI shows values in INR for readability. The dataset stays USD-backed because the source sales records are in USD (conversion lives in `src/lib/currency.ts`).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Auth | Clerk |
| Database | Convex |
| AI advisory | Google Gemini (`@google/genai`) with deterministic fallbacks |
| ML | Python, scikit-learn, pandas, numpy, joblib |

---

## Project structure

```text
src/
  app/
    api/
      analyze/route.ts      # main analysis orchestration
      assistant/route.ts    # assistant chat + idea generation
    analyze/page.tsx
    assistant/page.tsx
    market/page.tsx
    watchlist/page.tsx
    page.tsx                # landing
    layout.tsx
  components/
    market/                 # market page widgets and charts
    ui/                     # auth-page background components
    Navbar.tsx, Footer.tsx, *Chart.tsx
  lib/
    domainAnalyzer.ts       # rule-based scoring engine
    marketData.ts           # dataset loading + comparable sales
    mlPredictor.ts          # bridge to the Python model
    openaiDomainAdvisor.ts  # Gemini advisory layer (+ fallback)
    domainAssistant.ts      # assistant grounding
    valueProjection.ts      # 3-year scenario range
    investmentReport.ts     # deterministic recommendation
    rdap.ts                 # RDAP lookup + availability
    domainMarketplace.ts    # resale / listing detection
    mockMarketData.ts       # synthetic market signals
    currency.ts, convex.ts, watchlist.ts, utils.ts

convex/                     # schema + watchlist queries/mutations
ml/                         # Python feature extraction, training, inference
data/
  raw/                      # source sales CSVs
  processed/                # merged master dataset
docs/                       # in-depth architecture + roadmap
```

---

## Local data and ML

Historical sales CSVs live in `data/raw/`. The merged master dataset lives in `data/processed/`. The market data loader (`src/lib/marketData.ts`) prefers the processed master and falls back to raw.

The ML pipeline lives in `ml/`:

```text
ml/features.py   # domain feature extraction (18 features)
ml/train.py      # trains the RandomForestRegressor
ml/model.py      # loads the bundle, runs inference, derives confidence
ml/predict.py    # CLI entry point called from Node
```

### ML flow

1. Raw CSVs are merged and normalized.
2. Domain features are extracted (length, word count, brandability, pronounceability, TLD tier, category hint, and more).
3. A `RandomForestRegressor` is trained on `price_usd` (log-transformed target).
4. The trained bundle is saved to `ml/domain_value_model.pkl`.
5. The Next.js API route shells out to Python for inference through `src/lib/mlPredictor.ts`.

### About the current model

- Model family: `RandomForestRegressor`
- Training rows: ~350,000
- Checked MAE: ~3,800 USD

That MAE is not "final accuracy". Domain-sale pricing is a noisy, heavy-tailed regression problem, so the app never relies on ML alone. ML confidence is derived from how much the individual forest trees disagree (relative dispersion), which is why low-signal names honestly report "Low". See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#machine-learning).

---

## Getting started

### 1. Install JavaScript dependencies

```bash
npm install
```

### 2. Set up the Python model environment

```bash
python3 -m venv .venv
./.venv/bin/pip install -r ml/requirements.txt
```

The trained model (`ml/domain_value_model.pkl`) is checked in, so you do not need to retrain to run the app. To retrain:

```bash
./.venv/bin/python ml/train.py
```

Quick prediction check:

```bash
./.venv/bin/python ml/predict.py primeagent.ai
```

### 3. Configure environment variables

Create `.env.local`:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_FRONTEND_API_URL=

# AI advisory (optional; app falls back to deterministic output without it)
GEMINI_API_KEY=
GEMINI_DOMAIN_MODEL=gemini-2.0-flash

# Python binary for ML inference (defaults to ./.venv/bin/python)
DOMAIN_ML_PYTHON=
```

### 4. Run the app

```bash
npm run dev          # Next.js on http://localhost:3000
npx convex dev       # Convex, in a second terminal
```

---

## AI integration behavior

The Gemini advisory layer is an optional enhancement. If the key is missing or the call fails:

- the app still works,
- a deterministic heuristic fallback is used,
- the `/analyze` UI shows a "Heuristic engine" badge instead of "Live AI".

This keeps the product fully usable and demoable without external AI providers.

---

## Current posture

This repository is a working MVP with a real research workflow, not a claim of perfect appraisal accuracy.

**Already strong:** multi-signal scoring, live RDAP, watchlist persistence, market dataset browsing, deduped comparable sales, ML-assisted valuation, live AI advisory with graceful fallback.

**Still iterating:** pricing calibration for edge cases, TLD-aware comparable weighting, grounded aftermarket signals, and real registrar-backed availability and booking. The full list and direction are in [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## License

No license has been added yet. Add one (for example MIT) before publishing the repository publicly.
