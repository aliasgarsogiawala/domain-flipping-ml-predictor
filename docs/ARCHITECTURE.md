# DomainFlip AI - Architecture & Internals

This document explains how DomainFlip AI works end to end: every layer, how a single `/analyze` request flows through the system, how the valuation is built, and how the supporting subsystems (ML, AI advisory, RDAP, market data, watchlist) fit together.

If you only want to run the app, the [README](../README.md) is enough. This document is for contributors who want to understand or change the internals.

---

## Table of contents

1. [High-level system](#high-level-system)
2. [The `/analyze` request lifecycle](#the-analyze-request-lifecycle)
3. [Rule-based scoring](#rule-based-scoring)
4. [Market signals and comparable sales](#market-signals-and-comparable-sales)
5. [RDAP and availability](#rdap-and-availability)
6. [Machine learning](#machine-learning)
7. [AI advisory layer](#ai-advisory-layer)
8. [Valuation pipeline](#valuation-pipeline)
9. [Value projection](#value-projection)
10. [Investment report](#investment-report)
11. [Resale / marketplace detection](#resale--marketplace-detection)
12. [Data layer (Convex + watchlist)](#data-layer-convex--watchlist)
13. [Frontend surfaces](#frontend-surfaces)
14. [Caching, currency, and cross-cutting concerns](#caching-currency-and-cross-cutting-concerns)

---

## High-level system

```text
                        ┌──────────────────────────────────────────────┐
   Browser (React 19)   │  Next.js App Router (server + client)         │
   /analyze /market     │                                              │
   /assistant /watchlist│   app/api/analyze/route.ts  (orchestrator)   │
        │               │        │                                     │
        │  fetch JSON   │        ├── lib/domainAnalyzer.ts  (rules)    │
        ├──────────────▶│        ├── lib/marketData.ts      (comps)    │
        │               │        ├── lib/rdap.ts            (RDAP)     │
        │               │        ├── lib/mlPredictor.ts ──► Python     │
        │               │        ├── lib/openaiDomainAdvisor ─► Gemini │
        │               │        ├── lib/domainMarketplace  (resale)   │
        │               │        ├── lib/valueProjection    (forecast) │
        │               │        └── lib/investmentReport   (verdict)  │
        │               └──────────────────────────────────────────────┘
        │
        │  Clerk auth + Convex (watchlist persistence)
        └──────────────────────────────────────────────────────────────
```

Everything that produces a number or a verdict runs **server-side** inside the API routes. The client is presentational: it sends a domain, renders the structured response, and persists watchlist entries through Convex.

There are two API routes:

- `app/api/analyze/route.ts` - the analysis orchestrator (the heart of the product).
- `app/api/assistant/route.ts` - assistant chat and idea generation (`lib/domainAssistant.ts`, Gemini-backed).

---

## The `/analyze` request lifecycle

A `POST /api/analyze` with `{ "domain": "example.com" }` runs the following ordered pipeline. The order matters because later stages depend on earlier ones.

1. **Validate + cache check.** Empty input is rejected. A 30-minute in-memory cache (`analysisCache`) short-circuits repeat lookups.
2. **Rule analysis.** `analyzeRuleDomain(domain)` returns the normalized name/TLD, a `ruleScore`, a per-signal `breakdown`, and `reasons` / `weaknesses` arrays.
3. **Exceptional-brand check.** `hasExceptionalBrandSignal(name)` flags marquee names (google, stripe, openai, ...) so they bypass the conservative caps that would otherwise apply.
4. **Parallel data fetch** (`Promise.all`):
   - `findComparableSales(domain, 5)` - nearest historical sales.
   - `lookupRDAP(domain)` - registrar, dates, status, availability.
   - `predictDomainValueWithMl(domain)` - Python model prediction + features.
   - `getMarketplaceStatus(domain)` - resale / listing posture.
5. **Comparable summary.** `summarizeComparableSales` computes count, average similarity, median, and a similarity-weighted median.
6. **Registration-history score.** Derived from RDAP and merged into the rule breakdown.
7. **Base score.** `final = round(ruleScore * 0.6 + marketScore * 0.4) + registrationHistory`, where `marketScore = computeMarketScore(marketData)`.
8. **Reality caps on the score.** A series of `Math.min` guards prevent inflated scores: no comparables and not premium → cap 64; weak TLD → cap 65; hyphen/number with weak market → cap 60; `Available` names are capped (especially with ≤1 comp); `Unknown` availability is capped; `.in` with thin comps is capped. Small bonuses apply for premium + taken names and for many comparables.
9. **Expiry pressure.** A near-expiry registration adds a small penalty and a weakness note.
10. **ML quality nudge.** `scoreMlQualityAdjustment` adds or subtracts a few points based on ML-extracted features (clamped to ±8), then `final` is clamped to 0-100.
11. **Brand prestige + exceptional floors.** `computeBrandPrestigeScore` then `applyExceptionalBrandAdjustment` (marquee names get score/prestige floors).
12. **First valuation pass.** `adjustEstimatedValue(...)` produces an initial blended estimate using the **ML prediction** as the model baseline.
13. **AI advisory.** `generateOpenAIDomainInsights(...)` calls Gemini (or falls back) for the summary, signals, and suggestions.
14. **AI initial estimate.** `deriveAiInitialEstimate(...)` blends the current estimate, the raw appraisal signal, the TLD anchor, and comparable references, weighted by AI strength.
15. **Premium reality caps (AI-aware).** `applyPremiumRealityCaps` can lower the score using AI signals (premium feel, end-user demand, aftermarket strength). Brand prestige and exceptional floors are recomputed.
16. **Second valuation pass.** `adjustEstimatedValue(...)` runs again, this time using the **AI initial estimate** as the baseline with the advisor's confidence. Its output is `modelAdjustedEstimatedValueUsd`.
17. **Advisory adjustment.** `applyAdvisoryValueAdjustment` nudges the value by at most ±8% based on AI confidence.
18. **Verdict.** `getRealityCheckedVerdict` maps score + AI signals + comps + TLD to `Low / Moderate / High / Premium Potential`.
19. **Final cap.** `capAdvisoryAdjustedValue` clamps the value to the highest *believable* reference (ML × 1.15, comparable median × verdict cap, TLD anchor × cap). This is the decisive step that keeps estimates grounded. The result is `adjustedEstimatedValueUsd`.
20. **Pricing confidence, investment report, value projection** are computed.
21. **Response assembled and cached.**

The result is one JSON object containing scores, the valuation chain, RDAP, comparable sales, marketplace posture, AI insights, the investment report, and the value projection. Every number the UI shows comes from this single object.

---

## Rule-based scoring

File: `src/lib/domainAnalyzer.ts`

The deterministic engine scores a domain across 10 weighted signals. Each contributes to `ruleScore` and to a `breakdown` map the UI renders as bars.

| Signal | Max | What it measures |
| --- | --- | --- |
| `tldStrength` | 20 | TLD desirability tier (.com highest) |
| `length` | 20 | Shorter is better, with penalties for very long names |
| `brandability` | 20 | How brand-like and inventable the name reads |
| `memorability` | 15 | Ease of recall |
| `pronounceability` | 15 | Vowel/consonant balance, syllable flow |
| `premiumBrandSignal` | 20 | Single-word, clean, premium shape |
| `trendRelevance` | 15 | Match to in-demand categories (AI, fintech, etc.) |
| `commercialIntent` | 15 | Commercial keyword presence |
| `registrationHistory` | 10 | Age / lifecycle signal from RDAP |
| `riskPenalties` | 20 | Deductions for hyphens, digits, length, risk flags |

The engine also emits human-readable `reasons` (positives) and `weaknesses` (negatives) that feed both the UI and the AI prompt.

---

## Market signals and comparable sales

File: `src/lib/marketData.ts` and `src/lib/mockMarketData.ts`

There are two market inputs:

**1. Synthetic market signal (`mockMarketData.ts`).** Produces a coarse `estimatedValueUsd`, `comparableSalesCount`, `marketDemand`, and `premiumSignal` for a domain. Marquee/premium names get hardcoded high anchors (this is a deliberate placeholder; see [ROADMAP](ROADMAP.md)). The `estimatedValueUsd` here is the "raw appraisal signal" and is intentionally treated as an optimistic upper anchor, never the final number.

**2. Real comparable sales (`marketData.ts`).** Loads the historical sales dataset (prefers `data/processed/domain_sales_master.csv`, falls back to `data/raw/`), then for a target domain:

- infers TLD, length, category, and word count,
- scores every record with `scoreComparableMatch` (TLD match +30, same length +20, same category +36, related category +14, word-count signals, with penalties for category mismatch),
- filters to `similarityScore >= 34`, sorts best-first,
- **dedupes by domain** so the same sale never appears twice,
- returns the top `limit` matches.

`summarizeComparableSales` (in the analyze route) reduces these to a count, average similarity, plain median, and a **similarity-weighted median**, which the valuation pipeline uses as the comparable reference.

> Known limitation: matching is currently TLD-agnostic in its penalty structure, so a `.in` name can borrow `.com` premium comps. This inflates intermediate numbers (the final value is still capped). Addressed in the [roadmap](ROADMAP.md#1-valuation-accuracy).

---

## RDAP and availability

File: `src/lib/rdap.ts`

RDAP (the structured successor to WHOIS) provides registrar, creation/updated/expiry dates, and status flags. The lookup also yields an `availabilityStatus` of `Available`, `Taken`, or `Unknown`, which gates several scoring caps and the call-to-action on `/analyze` (Register vs Notify-when-available vs Check-again). Availability here is RDAP-derived, not registrar-cart-verified; real booking is on the roadmap.

---

## Machine learning

Directory: `ml/` - bridged from Node by `src/lib/mlPredictor.ts`.

### Feature extraction (`ml/features.py`)

18 features are extracted per domain, including: `domain_length`, `word_count`, `contains_number`, `contains_hyphen`, `premium_keyword_count`, `estimated_brandability_score`, `tld_tier_score`, `vowel_ratio`, `unique_char_ratio`, `starts_with_premium_keyword`, `ends_with_premium_keyword`, `exact_match_bias`, `pronounceability_score`, `short_premium_signal`, `token_balance_score`, `repeated_char_penalty`, and a categorical `category_hint`.

### Training (`ml/train.py`)

- Merges and normalizes the raw sales CSVs.
- Builds a feature frame, one-hot encodes the categorical column, imputes numerics.
- Trains a `RandomForestRegressor` inside a scikit-learn `Pipeline` on a **log1p-transformed** `price_usd` target (so the heavy right tail does not dominate).
- Evaluates MAE on a holdout split and serializes the bundle (pipeline + target transform) to `ml/domain_value_model.pkl` with joblib.

### Inference (`ml/model.py`, `ml/predict.py`)

`predict.py <domain>` prints JSON: `{ predictedValueUsd, confidence, extractedFeatures }`.

- The prediction is the pipeline output, inverse-transformed and clipped to a sane ceiling.
- **Confidence is derived from tree dispersion**: the standard deviation of the individual trees' predictions relative to the mean. `<= 0.20` → High, `<= 0.45` → Medium, else → Low. So an invented `.in` word the forest is unsure about honestly reports "Low".

### Node bridge (`src/lib/mlPredictor.ts`)

Spawns the Python binary (`DOMAIN_ML_PYTHON` or `./.venv/bin/python`) via `execFile`, parses stdout, sanitizes the result (rejects non-finite or out-of-range values), and returns `null` on any failure so the rest of the pipeline degrades gracefully.

---

## AI advisory layer

File: `src/lib/openaiDomainAdvisor.ts` (named for historical reasons; it uses **Google Gemini**).

Given the full scoring context, it asks Gemini (with a strict JSON schema) for:

- `summary`, `valuationRationale`, `decisionGuidance`,
- `similarDomains`, `acquisitionSuggestions`, `riskFlags`, `buyerAngles`,
- `confidence` and a `suggestedRecommendation`,
- a bounded `valueAdjustmentPercent` (clamped to small ranges by confidence),
- and numeric signals: `premiumFeelScore`, `endUserDemandScore`, `aftermarketStrengthScore`, `negotiationRiskScore`, plus an `eliteWordSignal` flag.

If `GEMINI_API_KEY` is missing or the call fails, `buildFallbackInsights` produces a deterministic equivalent from the scoring inputs. The response carries `provider: "gemini" | "fallback"`, which the `/analyze` UI renders as a "Live AI" or "Heuristic engine" badge. The advisory value adjustment is intentionally capped (≤8% at high confidence) so the model can shade, but never dominate, the price.

---

## Valuation pipeline

This is the most involved part of the system. The final estimate is the product of several passes, each grounding the number in more evidence. Worked example (`stripe.com`):

| Stage | Value | Produced by |
| --- | --- | --- |
| Raw appraisal signal | ~$1,200,000 | `mockMarketData` (hardcoded anchor) |
| AI initial estimate | ~$108,000 | `deriveAiInitialEstimate` |
| Model-adjusted value | ~$45,000 | second `adjustEstimatedValue` pass |
| **Final estimate** | **~$5,880** | `capAdvisoryAdjustedValue` |

### `adjustEstimatedValue`

Computes a weighted blend of four components and clamps it between a floor and a soft cap:

- **ML / baseline** component (weighted by ML/advisor confidence),
- **comparable-driven** component (weighted by comparable evidence strength),
- **TLD-anchor-driven** component (anchor median × resale multiplier × exposure),
- **raw heuristic** component (fixed small weight).

It then applies availability- and TLD-specific multipliers (e.g. `Available` names with ≤1 comp are discounted; `.in` non-premium names are discounted; high risk is discounted), a confidence-aware floor, and a soft cap tied to the TLD median. Non-`.com` names without strong support are capped relative to the `.com` anchor. Exceptional brands get an uplift and a higher cap.

### `deriveAiInitialEstimate`

Blends the current estimate, the raw signal (small weight), the TLD anchor, and comparable references, scaled by an "AI strength" composite (premium feel, end-user demand, aftermarket strength). This is deliberately the most optimistic figure in the chain; it exists as an upper anchor that downstream caps pull back toward reality.

### `capAdvisoryAdjustedValue` (the decisive cap)

Computes a `referenceCeiling = max(ML × 1.15, comparableMedian × verdictCap, TLDAnchor × cap)` and clamps the value to it, with additional reductions for weak availability, thin comps, low AI strength, and lower verdicts. This is why a marquee name's six-figure intermediate estimate collapses to a believable low-four-figure final value: the ceiling tracks the ML prediction and real comparable sales, not the synthetic raw signal.

### Pricing confidence

`getPricingConfidence` combines ML confidence, comparable count, average similarity, and score into a Low/Medium/High label shown next to the estimate.

---

## Value projection

File: `src/lib/valueProjection.ts`

Produces a 3-year scenario range (`low / expected / high` points) plus a `trajectory` (Momentum / Gradual / Flat / Downside), an `expectedChangePercent`, a `domainOutlookScore`, and `trendDrivers` / `riskDrivers`. It is derived from the score mix, comparable support, ML features, and AI demand signals. It is explicitly a scenario tool, not a promised return.

---

## Investment report

File: `src/lib/investmentReport.ts`

A fully deterministic layer that turns the numbers into a recommendation (`Buy / Watch / Avoid`) with a summary, reasons to buy, reasons to avoid, ideal buyer profile, best use cases, acquisition strategy, risk explanation, resale potential, and a final verdict. Being deterministic, it is stable and explainable independent of the AI layer.

---

## Resale / marketplace detection

File: `src/lib/domainMarketplace.ts`

Detects whether a taken domain looks listed for sale (resale status, detected marketplace, asking price, landing-page hints, marketplace links). Surfaced in the "Market Posture" section of `/analyze`. Detection is heuristic today; live aftermarket APIs are on the roadmap.

---

## Data layer (Convex + watchlist)

Files: `convex/schema.ts`, `convex/watchedDomains.ts`, `src/lib/watchlist.ts`, `src/lib/convex.ts`

The `watchedDomains` table stores, per user: `domain`, `score`, `availabilityStatus`, `resaleStatus`, `estimatedValueUsd`, `registrar`, `expiresAt`, `lastCheckedAt`, `targetBuyPriceUsd`, `maxBudgetUsd`, `negotiationStance`, and timestamps. It is indexed `by_userId` and `by_userId_domain`. Convex exposes `listWatchedDomains`, `addWatchedDomain`, `removeWatchedDomain`, and `updateWatchedDomain`. Access is gated by Clerk auth (`middleware.ts`, `convex/auth.config.ts`). The acquisition-workflow inputs on `/analyze` (target price, budget, stance) are persisted here when a name is watched.

---

## Frontend surfaces

- `src/app/page.tsx` - landing page (static, illustrative sample data clearly labeled).
- `src/app/analyze/page.tsx` - the analysis workspace: score ring, AI advisory with signal meters, valuation layer, comparable sales, investment report, value/trend/radar charts, acquisition workflow, and the RDAP/market panels.
- `src/app/market/page.tsx` - dataset analytics (TLD performance, category breakdown, anomalies, comparison).
- `src/app/assistant/page.tsx` - Gemini-backed chat and idea generation.
- `src/app/watchlist/page.tsx` - protected portfolio monitor.

Charts are Recharts wrappers in `src/components/`. The fixed navbar is in `src/components/Navbar.tsx`; global tokens and the grid background live in `src/app/globals.css`.

---

## Caching, currency, and cross-cutting concerns

- **Caching.** The analyze route keeps a 30-minute in-memory `Map` cache keyed by domain (bounded at 500 entries). This is per-process and resets on redeploy; a shared cache is a future improvement.
- **Currency.** Source data and all internal math are in USD. `src/lib/currency.ts` converts to INR for display only.
- **Graceful degradation.** Every external dependency (Gemini, Python ML, RDAP, marketplace) can fail independently and the route still returns a complete, sensible response.
- **Failure isolation.** The whole route is wrapped so any unhandled error returns a clean `500` with a generic message rather than leaking internals.
