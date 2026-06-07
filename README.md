# DomainFlip AI

A domain research workspace for people who want more than a quick appraisal number.

It combines deterministic scoring, a local ML model, comparable sales from a historical dataset, live RDAP ownership data, and an AI advisory layer into one analysis flow. The point isn't to promise profit. It's to help you make a disciplined buy, watch, or avoid call, and to always show the evidence behind a number.

For how it all works under the hood, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). For what's incomplete and where it's headed, see [`docs/ROADMAP.md`](docs/ROADMAP.md).

## What it does

- **Analyze** a domain across 10 scoring signals, with live RDAP data, comparable sales, a blended value estimate, AI signals, a deterministic investment report, and a 3-year value projection.
- **Compare** two names side by side, or run a 3-to-5 domain battle for liquidity, brand strength, and acquisition fit.
- **Watch** domains in a Clerk-authenticated, Convex-backed watchlist with a target price, budget, and stance per name.
- **Explore** the historical sales dataset by TLD, category, price range, and trend.
- **Ask** the assistant for grounded domain questions and name ideas from a budget, keywords, and style.

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/analyze` | Primary analysis workflow |
| `/market` | Market dataset workspace |
| `/assistant` | AI ideas and chat |
| `/watchlist` | Protected watchlist |

## How pricing works

The estimate is intentionally never one signal. It blends the local ML prediction, the nearest comparable sales, curated TLD benchmarks, rule-based quality, and AI demand signals, then passes through risk-aware caps so weak-evidence names don't inherit unrealistic values. The full chain is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#the-valuation-chain). Values display in INR; the dataset stays USD-backed because the source sales are in USD.

## Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Auth | Clerk |
| Database | Convex |
| AI advisory | Google Gemini, with a deterministic fallback |
| ML | Python, scikit-learn, pandas, numpy, joblib |

## Project layout

```text
src/
  app/            # routes + api/analyze and api/assistant
  components/     # UI and charts (market/ subfolder for market widgets)
  lib/            # scoring, valuation, ML bridge, AI, RDAP, market data
convex/           # schema + watchlist queries/mutations
ml/               # Python feature extraction, training, inference
data/             # raw/ source CSVs and processed/ master dataset
docs/             # architecture + roadmap
```

## Getting started

Install dependencies and set up the Python model environment:

```bash
pnpm install
python3 -m venv .venv
./.venv/bin/pip install -r ml/requirements.txt
```

The trained model (`ml/domain_value_model.pkl`) is checked in, so you don't need to retrain to run the app. To retrain or test inference:

```bash
./.venv/bin/python ml/train.py
./.venv/bin/python ml/predict.py primeagent.ai
```

Create `.env.local`:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_FRONTEND_API_URL=

# AI advisory (optional; falls back to deterministic output without it)
GEMINI_API_KEY=
GEMINI_DOMAIN_MODEL=gemini-2.0-flash

# ML inference. In dev, leave DOMAIN_ML_URL unset and the app shells out to
# local Python (DOMAIN_ML_PYTHON defaults to ./.venv/bin/python). In prod,
# set DOMAIN_ML_URL to the hosted FastAPI service (see Deployment).
DOMAIN_ML_PYTHON=
DOMAIN_ML_URL=
```

Run the app and Convex in two terminals:

```bash
pnpm dev             # http://localhost:3000
npx convex dev
```

To test the ML service locally instead of the shell-out path:

```bash
./.venv/bin/uvicorn ml.server:app --port 8000
# then set DOMAIN_ML_URL=http://localhost:8000 for the Next.js app
```

## Deployment

The ML model can't run inside Node serverless functions (it's a 67MB scikit-learn
pickle that needs Python), so in production it runs as its own small FastAPI
service and the app calls it over HTTP.

1. **Host the model service** (`ml/server.py`) on Render. A `render.yaml`
   blueprint is included: it installs `ml/requirements.txt` and runs
   `uvicorn ml.server:app`. The service exposes `POST /predict` and `GET /health`.
2. **Host the Next.js app** anywhere (Vercel works once ML is an HTTP call).
3. Set **`DOMAIN_ML_URL`** on the app to the Render service URL
   (e.g. `https://domainflip-ml.onrender.com`).

If `DOMAIN_ML_URL` is unset or the service is down, the app falls back gracefully
and simply runs without the ML signal. Convex and Clerk are managed, so they only
need their prod credentials.

## A note on the AI layer

The Gemini advisory is optional. If the key is missing or the call fails, the app still works, a deterministic fallback is used, and the analyze page shows a "Heuristic engine" badge instead of "Live AI". This keeps everything usable without external providers.

## Status

A working MVP, not a claim of perfect appraisal accuracy. Multi-signal scoring, live RDAP, the watchlist, dataset browsing, deduped comparables, ML-assisted valuation, and AI advisory with graceful fallback are all in place. Pricing calibration, TLD-aware comps, and real registrar-backed booking are the main things still in progress; the full list is in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## License

MIT
