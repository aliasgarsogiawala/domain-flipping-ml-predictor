# DomainFlip AI - Roadmap & Known Gaps

This document is honest about what is incomplete today and where the project is going. DomainFlip AI is a working MVP with a real research workflow, but several layers are deliberately pragmatic (heuristics, synthetic anchors, a baseline model). Nothing here is hidden from users in the product; the UI labels fallbacks and illustrative data.

The themes below are roughly in priority order: **accuracy first, then real transactions, then automation.**

---

## 1. Valuation accuracy

The current estimate is a blend (ML + comparables + TLD anchors + rules + AI), capped to believable references. It is grounded, but it is not yet precise. Planned work:

- **TLD-aware comparable matching.** Today comparable matching does not penalize TLD mismatch strongly, so a `.in` name can borrow `.com` premium sales. Fix: require or heavily weight same-TLD comps, and segment the dataset by extension before matching.
- **Stronger comparable weighting.** Move from a similarity-weighted median to a learned weighting (recency decay, venue trust, sale-size normalization, outlier trimming).
- **Replace the synthetic raw signal.** `mockMarketData.ts` hardcodes anchors for marquee names. Replace it with real per-name signals so there is no optimistic placeholder in the chain at all.
- **Calibrated confidence intervals.** Replace the heuristic pricing-confidence label with quantile regression (or conformal prediction) so the UI can show a true P10-P90 price band instead of a Low/Medium/High tag.
- **Per-segment calibration.** Calibrate separately for short brandables, dictionary words, numeric/hyphenated names, and ccTLDs, which have very different price distributions.

---

## 2. A better, more ML-focused engine

The current model is a single `RandomForestRegressor` baseline. The plan is to make ML the primary driver rather than one blended input.

- **Gradient-boosted models** (XGBoost / LightGBM / CatBoost) with proper hyperparameter search and cross-validation, benchmarked against the current forest.
- **Learned text/semantic features.** Character- and subword-level embeddings, plus an LLM-derived "meaning/brandability" embedding, so the model understands *what a name means*, not just its shape.
- **A learned ensemble.** Train a meta-model (stacking) over the ML prediction, comparable signal, and TLD anchor so the blend weights are learned from outcomes rather than hand-tuned in `adjustEstimatedValue`.
- **Continuous evaluation.** A held-out, time-split backtest with tracked MAE/MAPE/spearman over releases, plus per-segment error reporting, so accuracy improvements are measurable.
- **Scheduled retraining** as new sales data lands, with model versioning and the ability to roll back a regression.

---

## 3. Custom AI models (beyond the Gemini helper)

Today the AI advisory layer is a Gemini call with a deterministic fallback. Future direction:

- **Fine-tuned advisory model.** Fine-tune (or instruction-tune) a smaller model on curated domain-investing rationales so the summaries, buyer angles, and risk flags are consistently grounded and cheaper to run.
- **Self-hosted / offline option.** Run a local open-weights model so the product has no hard dependency on an external API, upgrading the "Heuristic engine" fallback into a real local model.
- **Retrieval-augmented advisory.** Ground the AI summary in the actual retrieved comparable sales and RDAP facts (RAG) so it can cite specific evidence instead of reasoning from the score alone.
- **Structured-output guarantees + evals.** An automated eval suite that scores AI output for grounding, calibration, and refusal behavior on a fixed test set before any model swap.

---

## 4. Real availability and domain booking

Availability is currently inferred from RDAP, and the "Register" button is a placeholder. The biggest functional gap is turning research into an actual purchase.

- **Registrar API integration** (GoDaddy, Namecheap, Dynadot, etc.) for authoritative real-time availability and live registration pricing. (`.env` already reserves `GODADDY_API_KEY` / `GODADDY_SECRET` for this.)
- **In-app booking / checkout.** Register an available domain end to end: cart, payment, and confirmation, with the result written back to the watchlist.
- **Aftermarket purchase flow.** For taken-but-listed names, integrate marketplace APIs (Afternic, Sedo, Dan) to surface real asking prices and start an offer/buy flow.
- **Drop-catch and backorder.** Let users queue an expiring domain for automated acquisition attempts.

---

## 5. Assistant: from chat to a sourcing agent

Today `/assistant` is a Gemini-backed chat that answers grounded questions and generates name ideas from a budget, keywords, style, and TLD preferences. The plan is to grow it from a helper into the product's primary sourcing surface.

- **Tool-using agent.** Let the assistant call the real pipeline mid-conversation: run `/analyze`, check availability, pull comparable sales, and read the watchlist, instead of reasoning from text alone. Every claim it makes should be backed by an actual tool call.
- **End-to-end acquisition planning.** From a single prompt ("find me 5 brandable AI names under $500 that are registerable now"), generate candidates, score and value each, filter to available ones, and return a ranked shortlist with a draft acquisition plan.
- **One-click handoff.** Turn any suggested name into a real action: open it in the analyzer, add it to the watchlist (with target price and stance), or start a registration/offer flow.
- **Memory and context.** Remember a user's budget, niche, naming taste, and prior decisions across sessions so suggestions get sharper over time.
- **Grounded, cited answers.** Back every recommendation with the specific evidence (comps, RDAP facts, score breakdown) via retrieval, so the assistant explains *why* a name is worth buying rather than just asserting it.
- **Portfolio-aware advice.** Once portfolio tracking exists, let the assistant reason over what a user already owns ("this overlaps your existing fintech names; here is a complementary pick").

---

## 6. Live investment opportunities with a real marketplace

The long-term vision: instead of users bringing a domain to analyze, **the product tells them which domains are the best to invest in right now**, live, and lets them act on it without leaving the app.

- **Opportunity feed.** A continuously refreshed, ranked list of domains that look underpriced relative to their modeled value: registerable names worth grabbing, and aftermarket listings priced below the estimate. Each entry shows the estimate, the asking/registration price, the implied margin, and the confidence.
- **Live marketplace integration.** Pull real, live inventory and prices from registrars (available names) and aftermarket venues (Afternic, Sedo, Dan, GoDaddy Auctions) so every opportunity is real and immediately actable, not a static suggestion.
- **Edge / mispricing detection.** Rank opportunities by the gap between the live asking price and the calibrated valuation band, surfacing only high-confidence mispricings rather than noise.
- **Buy from the feed.** Register or make an offer on an opportunity directly in-app (depends on item 4, real booking), with the result written to the watchlist.
- **Personalized deal flow.** Filter the feed to a user's budget, niche, and risk appetite, and alert them (email / push) when a name matching their thesis appears below a target price.
- **Why this needs the rest.** This feature is the payoff of items 1-5 combined: it requires calibrated valuations, live market data, registrar/aftermarket APIs, and the assistant/automation layer working together.

---

## 7. Live market data instead of a static dataset

- **Scheduled ingestion** of fresh reported sales (NameBio-style sources) so comparables and TLD medians stay current.
- **Live aftermarket pricing** so resale detection shows real listings rather than heuristic hints.
- **A proper data store.** Move the sales dataset out of CSV-in-repo into a queryable database (or Convex tables) with incremental updates, replacing the in-memory load.

---

## 8. Watchlist automation and alerts

The watchlist persists state but does not yet act on it.

- **Automated rechecks** on a schedule instead of manual recheck.
- **Alerts** (email / push) on availability change, price drop, expiry windows, or value drift past a threshold.
- **Portfolio view** with aggregate value, cost basis, and realized/unrealized tracking.
- **Negotiation assist** that uses the stored target price, budget, and stance to draft outreach.

---

## 9. Platform, quality, and trust

- **Automated tests + CI.** Unit tests for the scoring and valuation math, snapshot tests for the analyze response, and a CI pipeline (none today).
- **Observability.** Structured logging, error tracking, and latency metrics for the API routes and the Python bridge.
- **Shared cache.** Replace the per-process in-memory cache with a shared store (Redis / Convex) so caching survives redeploys and scales horizontally.
- **Rate limiting and abuse protection** on the public analyze and assistant routes.
- **Billing / plans** if the product is offered as a service.
- **Internationalized currency.** Make the display currency a user setting rather than hardcoded INR.
- **Accessibility and mobile passes** across the analysis-heavy screens.

---

## Known incomplete items (quick reference)

| Area | Current state | Target |
| --- | --- | --- |
| Raw market signal | Hardcoded anchors in `mockMarketData.ts` | Real per-name signals |
| Comparable matching | TLD-agnostic penalties | TLD-segmented, learned weights |
| Pricing confidence | Heuristic Low/Med/High | Calibrated P10-P90 band |
| ML model | Single RandomForest baseline | Boosted + embeddings + stacked ensemble |
| AI advisory | Gemini call + heuristic fallback | Fine-tuned / self-hosted + RAG |
| Assistant | Chat + idea generation | Tool-using sourcing agent with one-click handoff |
| Investment picks | User brings a domain to analyze | Live ranked opportunity feed from a real marketplace |
| Availability | RDAP-inferred | Registrar-API verified |
| Booking | Placeholder button | Full registration + aftermarket checkout |
| Market data | Static CSV in repo | Scheduled ingestion + DB |
| Watchlist | Manual recheck | Automated alerts + portfolio |
| Caching | Per-process in-memory | Shared, persistent |
| Tests / CI | None | Unit + snapshot + CI |

---

If you are contributing, the highest-leverage starting points are **TLD-aware comparable matching** (item 1) and **automated tests around the valuation math** (item 9), because both make every other accuracy change safer to ship. The live opportunity feed (item 6) is the headline destination, but it depends on the accuracy, data, and booking work landing first.
