# DomainFlip AI - Roadmap & Known Gaps

This is an honest list of what's incomplete and where the project is going. DomainFlip AI is a working MVP with a real workflow, but several layers are pragmatic for now (heuristics, synthetic anchors, a baseline model). The UI already labels fallbacks and illustrative data. Priorities run roughly: accuracy first, then real transactions, then automation.

## 1. Valuation accuracy

The estimate is grounded but not yet precise.

- **TLD-aware comparable matching.** Matching doesn't penalize TLD mismatch strongly today, so a ccTLD name can borrow `.com` premium sales. Weight same-TLD comps and segment the dataset by extension first.
- **Stronger comparable weighting** with recency decay, venue trust, and outlier trimming instead of a plain weighted median.
- **Replace the synthetic raw signal** with real per-name market data so there's no optimistic placeholder in the chain.
- **Calibrated confidence bands** (quantile or conformal) so the UI can show a real P10-P90 price range instead of a Low/Medium/High tag.
- **Per-segment calibration** for short brandables, dictionary words, numeric/hyphenated names, and ccTLDs, which price very differently.

## 2. A more ML-focused engine

The current model is a single random-forest baseline. The goal is to make ML the primary driver.

- Gradient-boosted models (XGBoost / LightGBM / CatBoost), tuned and benchmarked against the forest.
- Learned text and semantic features so the model understands what a name *means*, not just its shape.
- A learned ensemble over ML, comps, and anchors so the blend weights come from outcomes, not hand-tuning.
- Continuous, time-split backtesting with tracked error per segment, and scheduled retraining with versioning.

## 3. Custom AI models

Today the advisory layer is a Gemini call with a deterministic fallback.

- Fine-tune a smaller model on domain-investing rationales so summaries stay grounded and cheap.
- Offer a self-hosted, open-weights option so there's no hard dependency on an external API.
- Ground the AI read in retrieved comps and RDAP facts (RAG) so it cites real evidence.
- Add an eval suite that scores grounding and calibration before any model swap.

## 4. Real availability and domain booking

Availability is RDAP-inferred and the Register button is a placeholder. Turning research into a purchase is the biggest functional gap.

- Registrar API integration (GoDaddy, Namecheap, Dynadot) for authoritative availability and live pricing. The `.env` already reserves GoDaddy keys.
- In-app registration and checkout, with the result written to the watchlist.
- An aftermarket offer/buy flow for taken-but-listed names (Afternic, Sedo, Dan).
- Drop-catch and backorder for expiring names.

## 5. Assistant: from chat to a sourcing agent

Today `/assistant` is a Gemini chat that answers questions and generates name ideas. The plan is to grow it into the main sourcing surface.

- A tool-using agent that runs analysis, checks availability, and reads the watchlist mid-conversation, so every claim is backed by a real call.
- End-to-end sourcing from one prompt ("5 brandable AI names under $500 that are registerable now"): generate, score, value, filter to available, return a ranked shortlist.
- One-click handoff from a suggestion to the analyzer, the watchlist, or a registration/offer flow.
- Memory of a user's budget, niche, and taste across sessions, and portfolio-aware advice once tracking exists.

## 6. Live investment picks with a real marketplace

The headline destination: instead of users bringing a domain to analyze, the product tells them which domains are best to invest in right now, live, and lets them act on it.

- A continuously refreshed, ranked **opportunity feed** of underpriced names (registerable and aftermarket), each showing the estimate, the price, the implied margin, and the confidence.
- **Live marketplace data** from registrars and aftermarket venues so every pick is real and immediately actable.
- Mispricing detection that ranks by the gap between live price and the calibrated valuation band.
- Buy straight from the feed, plus personalized deal flow with alerts when a matching name drops below a target price.

This is the payoff of items 1-5 combined: it needs calibrated valuations, live data, registrar APIs, and the assistant working together.

## 7. Live market data

- Scheduled ingestion of fresh reported sales so comps and TLD medians stay current.
- Live aftermarket pricing so resale detection shows real listings.
- A queryable database instead of CSV-in-repo with in-memory loading.

## 8. Watchlist automation

- Automated rechecks on a schedule.
- Alerts on availability change, price drop, expiry, or value drift.
- A portfolio view with cost basis and realized/unrealized tracking.
- Negotiation assist that drafts outreach from the stored target and stance.

## 9. Platform and trust

- Automated tests for the scoring and valuation math, plus CI.
- Logging, error tracking, and latency metrics.
- A shared, persistent cache instead of per-process memory.
- Rate limiting on public routes, optional billing, a user currency setting, and accessibility/mobile passes.

## Known gaps at a glance

| Area | Now | Target |
| --- | --- | --- |
| Raw market signal | Hardcoded anchors | Real per-name signals |
| Comparable matching | TLD-agnostic | TLD-segmented, learned weights |
| Pricing confidence | Low/Med/High label | Calibrated P10-P90 band |
| ML model | Random-forest baseline | Boosted + embeddings + ensemble |
| AI advisory | Gemini + fallback | Fine-tuned / self-hosted + RAG |
| Assistant | Chat + ideas | Tool-using sourcing agent |
| Investment picks | User brings a domain | Live ranked opportunity feed |
| Availability | RDAP-inferred | Registrar-API verified |
| Booking | Placeholder | Full registration + aftermarket |
| Market data | Static CSV | Scheduled ingestion + DB |
| Watchlist | Manual recheck | Automated alerts + portfolio |
| Tests / CI | None | Unit + snapshot + CI |

The highest-leverage places to start are TLD-aware comparable matching and tests around the valuation math; both make every other accuracy change safer to ship.
