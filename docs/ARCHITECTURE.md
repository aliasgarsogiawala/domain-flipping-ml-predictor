# DomainFlip AI - Architecture

How the product works end to end: the layers, how an analysis request flows, and how the valuation is built. For setup, see the [README](../README.md). For what's still incomplete, see [ROADMAP](ROADMAP.md).

## The big picture

Everything that produces a number or a verdict runs server-side. The browser sends a domain, renders the structured response, and saves watchlist entries through Convex. There are two API routes: one for analysis, one for the assistant.

```text
   Browser (React)            Next.js API
   /analyze /market   ──────► analyze route ──┬─► rule-based scoring
   /assistant /watchlist                      ├─► comparable sales (dataset)
        │                                      ├─► RDAP lookup
        │  Clerk auth                          ├─► ML model (Python)
        ▼                                      ├─► AI advisory (Gemini)
      Convex (watchlist)                       └─► report + projection
```

## How an analysis runs

When you analyze a domain, the route gathers four things in parallel: comparable sales from the dataset, RDAP ownership data, an ML price prediction, and resale/marketplace posture. It scores the name across ten signals, blends those inputs into a value estimate, asks the AI layer for a written read, and assembles one JSON object with everything the page shows. Repeat lookups are served from a short in-memory cache.

The key idea is that no single input is trusted on its own. A strong TLD with expensive historical outliers won't drag a weak name up, and the AI layer can shade a price but never set it. Every figure on the page traces back to evidence the page also shows.

## Scoring

A deterministic engine scores each domain across ten weighted signals and renders them as bars. It also emits plain-language reasons and weaknesses that feed both the UI and the AI prompt.

| Signal | Max | Measures |
| --- | --- | --- |
| TLD strength | 20 | Extension desirability (.com highest) |
| Length | 20 | Shorter is better; long names penalized |
| Brandability | 20 | How brand-like and inventable it reads |
| Memorability | 15 | Ease of recall |
| Pronounceability | 15 | Vowel/consonant balance and flow |
| Brand prestige | 20 | Clean, single-word, premium shape |
| Trend relevance | 15 | Fit to in-demand categories |
| Commercial intent | 15 | Commercial keyword presence |
| Registration history | 10 | Age and lifecycle from RDAP |
| Risk penalties | 20 | Deductions for hyphens, digits, length, flags |

The score then passes through reality caps: names with no comparable sales, weak TLDs, or thin evidence are held down so the engine stays conservative, while marquee brands (google, stripe, and similar) get a floor so they aren't under-rated.

## Comparable sales

Two market inputs feed the value. The first is a synthetic signal that gives a coarse starting anchor (deliberately optimistic, never the final number). The second is real: a dataset of historical domain sales. For a target name, the engine infers TLD, length, category, and word count, scores every record for similarity, keeps the closest matches, dedupes them by domain, and reduces them to a similarity-weighted median. That median is the comparable reference used in pricing.

A current limitation is that matching doesn't penalize TLD mismatch strongly, so a ccTLD name can borrow `.com` comps. The final value is still capped, but this is the first thing to fix for accuracy (see ROADMAP).

## RDAP and availability

RDAP provides registrar, creation/expiry dates, and status flags, and yields an availability status of Available, Taken, or Unknown. That status gates several score caps and the call-to-action on the analyze page. It's inferred from RDAP, not verified against a registrar's cart, so real booking is future work.

## Machine learning

The model lives in `ml/` and is called from Node by shelling out to Python. It extracts 18 features per domain (length, word count, brandability, pronounceability, TLD tier, a category hint, and more), and a `RandomForestRegressor` trained on a log-transformed price predicts a value.

Confidence is the interesting part: it comes from how much the forest's individual trees disagree. Tight agreement reads as High, wide spread reads as Low. So an invented ccTLD name the model has little signal for honestly reports Low confidence rather than faking certainty. If Python is unavailable, the prediction is simply skipped and the rest of the pipeline carries on.

The current model is a baseline (~350k training rows, ~$3,800 MAE). Domain pricing is noisy and heavy-tailed, which is exactly why the app blends ML with comps, anchors, and rules instead of trusting it alone.

## AI advisory

The advisory layer (file named `openaiDomainAdvisor.ts` for historical reasons, but it uses Google Gemini) takes the full scoring context and returns a written summary, valuation rationale, decision guidance, similar-name ideas, risk flags, buyer angles, a suggested recommendation, and four numeric signals: premium feel, end-user demand, aftermarket strength, and negotiation risk.

If the API key is missing or the call fails, a deterministic fallback produces an equivalent from the scoring inputs, and the page shows a "Heuristic engine" badge instead of "Live AI". The advisory can only adjust the price by a small bounded amount, so it shades the result without driving it.

## The valuation chain

The estimate is built in passes, each one pulling the number toward more defensible evidence. The clearest way to see it is a marquee example (`stripe.com`):

| Stage | Value | Comes from |
| --- | --- | --- |
| Raw appraisal signal | ~$1,200,000 | Synthetic anchor |
| AI initial estimate | ~$108,000 | Optimistic blended starting point |
| Model-adjusted value | ~$45,000 | Re-blended with ML, comps, anchor |
| Final estimate | ~$5,880 | Capped to real evidence |

The final cap is the decisive step: it clamps the value to the highest *believable* reference, computed from the ML prediction, the comparable median, and the TLD anchor. That's why a six-figure intermediate collapses to a believable final value, because the ceiling tracks real sales and the model rather than the synthetic signal. A pricing-confidence label (Low/Medium/High) sits next to the estimate, based on ML confidence, comparable count, similarity, and score.

## The rest

- **Value projection** turns the signals into a three-year scenario range (low / expected / high) with a trajectory and drivers. It's a scenario tool, not a promised return.
- **Investment report** is fully deterministic: a Buy / Watch / Avoid call with reasons, ideal buyer, acquisition strategy, and a verdict. Being rule-based, it's stable and explainable independent of the AI layer.
- **Resale detection** flags whether a taken name looks listed for sale, with the marketplace and asking price where detectable (heuristic for now).
- **Watchlist** persists per-user domains in Convex (score, value, registrar, expiry, plus target price, budget, and stance), gated by Clerk auth.
- **Cross-cutting:** source data and math are in USD and converted to INR for display only; every external dependency can fail independently without breaking the response; the analyze cache is per-process and resets on redeploy.
