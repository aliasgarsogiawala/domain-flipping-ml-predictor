# DomainFlip AI

DomainFlip AI is a domain research workspace for people who want more than a quick appraisal number.

The app combines deterministic scoring, a local ML model, comparable sales from CSV datasets, RDAP ownership data, and AI-assisted summaries into one analysis flow. The goal is not to promise profit. The goal is to help someone make a more disciplined buy, watch, or avoid decision.

## What the product does

### Analyze domains
- Normalizes and validates a domain input
- Scores it across brandability, TLD strength, memorability, commercial intent, and risk
- Pulls RDAP metadata such as registrar, creation date, expiry, and status flags
- Detects resale posture and marketplace hints
- Blends ML output, comparable sales, and TLD benchmarks into a value estimate
- Generates an investment report with reasons to buy, reasons to avoid, and acquisition guidance

### Compare and battle-test names
- Compare two domains side by side
- Run a 3-5 domain battle mode for liquidity, brand strength, and acquisition posture

### Track watchlist candidates
- Save domains to a Clerk-authenticated Convex-backed watchlist
- Recheck individual names or recheck the full watchlist
- Store target buy price, budget, and negotiation stance per domain

### Explore the market dataset
- Browse historical sales from local CSV data
- Filter by TLD, category, search term, and price range
- Compare TLD performance
- Review anomaly flags and dataset-backed trend snapshots
- Save market screens for quick revisit

### Use the assistant
- Ask grounded domain questions
- Generate domain ideas from budget, keywords, style, and TLD preferences
- Pull an AI perspective alongside the platform’s scoring and ML layers

## Product surfaces

- `/` — landing page
- `/analyze` — primary analysis workflow
- `/market` — market intelligence workspace
- `/assistant` — AI idea generation and chat
- `/watchlist` — protected watchlist and portfolio monitor

## How pricing works

Pricing is intentionally not based on one signal.

The current valuation stack blends:
- local ML prediction from historical sales data
- nearest comparable sales from the merged dataset
- curated TLD benchmark anchors
- rule-based quality signals
- AI helper signals for premium feel, end-user demand, and aftermarket strength

In weak-evidence cases, the benchmark influence is reduced so available, low-conviction names do not inherit unrealistic values just because a strong TLD has expensive historical outliers.

Investment-facing UI currently shows values in INR for readability. The market dataset itself remains USD-backed because the source sales records are in USD.

## Tech stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Recharts
- Clerk
- Convex
- Python
- pandas
- scikit-learn
- joblib
- OpenAI API
- Gemini API

## Project structure

```text
src/
  app/
    api/
      analyze/route.ts
      assistant/route.ts
    analyze/page.tsx
    assistant/page.tsx
    market/page.tsx
    watchlist/page.tsx
  components/
    market/
  lib/
    domainAnalyzer.ts
    marketData.ts
    mlPredictor.ts
    openaiDomainAdvisor.ts
    rdap.ts
    valueProjection.ts

convex/
ml/
data/
  raw/
  processed/
```

## Local data and ML

Historical sales CSVs live in:

```text
data/raw/
```

Processed merged data lives in:

```text
data/processed/
```

The ML pipeline lives in:

```text
ml/features.py
ml/train.py
ml/model.py
ml/predict.py
```

### ML flow

1. Raw CSVs are merged and normalized
2. Domain features are extracted
3. A `RandomForestRegressor` is trained on `price_usd`
4. The trained bundle is saved to `ml/domain_value_model.pkl`
5. The Next.js API route calls Python for inference through `src/lib/mlPredictor.ts`

## Environment variables

At minimum, you will usually need:

```env
NEXT_PUBLIC_CONVEX_URL=
CLERK_FRONTEND_API_URL=
OPENAI_API_KEY=
GEMINI_API_KEY=
DOMAIN_ML_PYTHON=
```

Depending on your Clerk setup, you may also need the usual Clerk public and secret keys for the Next.js app.

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run Convex in another terminal:

```bash
npx convex dev
```

Open:

```text
http://localhost:3000
```

## Demo flow

If you are showing the project live, this is the cleanest path:

1. Start on `/market` to show the dataset-backed side of the product
2. Move to `/analyze` and break down one good domain and one bad domain
3. Use comparable sales and the valuation layer to explain why the price is not a blind appraisal
4. Save a domain to `/watchlist`
5. Finish on `/assistant` to show AI-guided sourcing and questioning

## Training the model

Create a virtual environment if you do not already have one:

```bash
python3 -m venv .venv
```

Install Python dependencies:

```bash
./.venv/bin/pip install pandas scikit-learn joblib
```

Train the model:

```bash
./.venv/bin/python ml/train.py
```

Quick prediction check:

```bash
./.venv/bin/python ml/predict.py primeagent.ai
```

If your Python binary is not at `.venv/bin/python`, set:

```env
DOMAIN_ML_PYTHON=/absolute/path/to/python
```

## Notes on AI integrations

OpenAI and Gemini are both optional enhancement layers.

If API keys are missing or rejected:
- the app still works
- deterministic fallbacks are used
- the UI should still remain usable

That fallback behavior is intentional so the product can still demo even when external AI providers are unavailable.

## Current product posture

This repository is an MVP with a serious research workflow, not a claim of perfect appraisal accuracy.

What is already strong:
- multi-signal scoring
- RDAP lookup
- watchlist persistence
- market dataset browsing
- comparable sales on analysis
- ML-assisted valuation
- AI-assisted summaries and idea generation

What still needs iteration:
- pricing calibration for edge cases
- stronger comparable-sales weighting
- more grounded aftermarket signals
- better handling of true elite one-word domains

## Why the repo looks the way it does

This project was built under deadline pressure, so some parts are intentionally pragmatic:
- the product uses heuristics where live commercial data is not available
- the ML model is a practical baseline, not the final model
- AI APIs are used as helpers, not as the single source of truth

The direction is clear though: more evidence, better comps, cleaner ranking, and tighter confidence reporting.

## License

Add the license you want before publishing the repo publicly.
