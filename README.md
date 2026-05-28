# Domain Flip

A domain valuation and market intelligence platform. Analyze domain names with rule-based scoring, detect resale listings, track availability, and identify market opportunities.

## Features

### 1. Domain Analyzer
- **Rule-based scoring**: Evaluates domains across 10+ scoring categories:
  - TLD strength (`.com`, `.ai`, `.io`, `.dev`, etc.)
  - Name length and character composition
  - Brandability, memorability, pronounceability
  - Commercial intent and trend relevance
  - Premium brand signal detection
  - Registration history and risk penalties

- **Real-time RDAP lookup**: Checks registration status, registrar, creation date, expiry, and RDAP status flags
- **Mock market data**: Deterministic pricing signals based on domain characteristics (comparable sales, estimated value, market demand)
- **Score blending**: Combines rule-based score (60%) and market signals (40%) to produce final score (0-100)
- **Intelligent capping**: Applies domain-specific caps to ensure realistic valuations:
  - Available domains: capped at 78
  - No comparables + no premium signal: capped at 72
  - Weak TLDs: capped at 65
  - Hyphens/numbers without strong market: capped at 60
  - Premium signal: floor of 85

### 2. Aftermarket Resale Detection
- **Bot protection detection**: Identifies Cloudflare, CAPTCHA, and verification screens
- **Marketplace keyword matching**: Detects listings on Sedo, Afternic, Dan.com, GoDaddy, HugeDomains, Flippa
- **Confidence levels**: high, medium, low based on detection strength
- **Resale status types**:
  - `not_listed` — available or unlisted
  - `listed_for_sale` — confirmed marketplace listing
  - `possibly_listed` — marketplace indicator but no confirmation
  - `needs_verification` — bot protection blocks detection
  - `unknown` — lookup failed
- **Marketplace verification links**: Quick links to check status on major marketplaces

### 3. Market Insights Landing Page
- **Statistics cards**: Quick stats on popular TLDs (`.com`, `.ai`, `.io`, `.dev`)
- **TLD comparison table**: Strength ratings and example domains
- **"What makes a domain valuable?"** section explaining key value drivers
- **Heuristic note**: Transparent about limitations of pricing estimates

### 4. Domain Watchlist
- **localStorage-based persistence**: MVP storage without database
- **Track taken domains**: Add domains for monitoring over time
- **Manual recheck**: Refresh status, availability, and resale information on demand
- **Bulk recheck**: "Recheck all" button to update multiple domains at once
- **Rich item data**: Score, availability, resale status, estimated value, registrar, expiry date, timestamps
- **Future notification system**: Planned architecture for automated daily checks and email alerts:
  - Watchlist stored in database
  - Cron job runs daily
  - RDAP/marketplace checks for changes
  - Email alerts on availability or expiry status changes

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
cd domain-flip

# Install dependencies
npm install
# or
pnpm install
```

### Running the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (app router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js serverless)
- **Data**: localStorage for MVP watchlist persistence
- **External APIs**: RDAP (ICANN domain registration data)

### File Structure

```
src/
├── app/
│   ├── page.tsx               # Landing page with Market Insights
│   ├── analyze/
│   │   └── page.tsx           # Domain analyzer UI
│   ├── watchlist/
│   │   └── page.tsx           # Domain watchlist page
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts       # Domain analysis API endpoint
│   ├── layout.tsx             # Root layout with Navbar/Footer
│   └── globals.css            # Global styles and tokens
├── components/
│   ├── Navbar.tsx             # Navigation header
│   └── Footer.tsx             # Footer with links
└── lib/
    ├── domainAnalyzer.ts      # Rule-based scoring logic
    ├── domainMarketplace.ts   # Resale detection and marketplace links
    ├── mockMarketData.ts      # Deterministic market data generator
    ├── domainAvailability.ts  # Mock availability helper
    ├── watchlist.ts           # localStorage watchlist utilities
    └── rdap.ts                # RDAP lookup client
```

## API Endpoints

### POST /api/analyze
Analyzes a domain and returns a comprehensive scoring report.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "domain": "example.com",
  "name": "example",
  "tld": "com",
  "score": 78,
  "ruleScore": 80,
  "marketScore": 75,
  "availabilityStatus": "Taken",
  "estimatedValueUsd": 5000,
  "comparableSalesCount": 8,
  "resaleStatus": "possibly_listed",
  "detectedMarketplace": "Sedo",
  "resaleConfidence": "medium",
  "marketplaceLinks": { "sedo": "...", "godaddy": "..." },
  "registrar": "GoDaddy",
  "expiresAt": "2026-12-31T23:59:59Z",
  "verdict": "High Potential",
  "riskLevel": "Low",
  "reasons": [...],
  "weaknesses": [...],
  "breakdown": {
    "tldStrength": 20,
    "length": 15,
    "brandability": 18,
    "memorability": 14,
    "pronounceability": 12,
    "premiumBrandSignal": 0,
    "trendRelevance": 8,
    "commercialIntent": 12,
    "registrationHistory": 5,
    "riskPenalties": 0
  }
}
```

## Scoring Breakdown

The analyzer evaluates domains across these weighted categories:

| Category | Max | Description |
|----------|-----|-------------|
| TLD Strength | 20 | Premium vs generic TLDs |
| Length | 20 | Shorter domains score higher |
| Brandability | 20 | How well it works as a brand |
| Memorability | 15 | Easy to remember and spell |
| Pronounceability | 15 | How naturally it speaks |
| Premium Brand Signal | 20 | Matches known premium domains |
| Trend Relevance | 15 | Alignment with current trends |
| Commercial Intent | 15 | Buyer intent and market demand |
| Registration History | 10 | Age and renewal status |
| Risk Penalties | 20 | Deductions for hyphens, numbers, etc. |

Final score = (rule_score × 0.6) + (market_score × 0.4) + registration_history

## Watchlist

### localStorage Schema
```typescript
{
  domain: string;
  score: number;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  resaleStatus?: "not_listed" | "listed_for_sale" | "possibly_listed" | "needs_verification" | "unknown";
  estimatedValueUsd?: number | null;
  registrar?: string | null;
  expiresAt?: string | null;
  addedAt: string;  // ISO timestamp
  lastCheckedAt: string;  // ISO timestamp
}
```

### Operations
- **Add**: Click "Notify when available" on any taken/listed domain
- **Recheck**: Update single item or all items with latest analysis
- **Remove**: Delete from watchlist
- **View**: See all tracked domains, their scores, and status

## Free External Data Sources

The app uses only free and public data:

- **RDAP**: [https://rdap.org](https://rdap.org) — Domain registration status, registrar, dates, ICANN standardized
- **Wayback Machine**: Optional future enhancement for historical domain snapshots
- **Cloudflare DoH**: Alternative DNS lookups and nameserver resolution
- **NameBio**: Manual marketplace research tool (for user reference)

No paid APIs or subscriptions required.

## Future Enhancements

### Short-term
- [ ] Marketplace price extraction heuristics
- [ ] Historical snapshot tracking via Wayback Machine API
- [ ] DNS nameserver analysis
- [ ] Bulk domain upload (CSV)

### Long-term
- [ ] User authentication and accounts
- [ ] PostgreSQL/MongoDB backend for watchlist
- [ ] Scheduled cron jobs for daily domain checks
- [ ] Email notifications on status changes
- [ ] Advanced historical pricing trends
- [ ] AI-powered domain recommendations
- [ ] Paid premium features (benchmarking, alerts, exports)

## Scheduled Job Architecture (Future)

When moving to production, the watchlist notification system will use:

```
┌─────────────────┐
│   Watchlist DB  │
│  (PostgreSQL)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cron Job (1x/d)│  (0:00 UTC)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Batch RDAP API  │
│ Marketplace scan│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Change Detection│
│ (availability,  │
│  expiry < 45d)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email Service   │
│ (SendGrid/AWS)  │
└─────────────────┘
```

## Styling

The app uses a dark professional design with:
- **Color palette**: Slate grays, cyan accents, minimal white
- **Typography**: Semibold headers, structured hierarchy
- **Spacing**: Generous padding and clean layout
- **Responsive**: Mobile-first, optimized for mobile/tablet/desktop
- **No gradients**: Solid colors and subtle transparency
- **No emojis**: Professional, business-focused UI

## Contributing

Contributions are welcome! Please:
1. Create a feature branch
2. Make focused changes
3. Test locally with `npm run dev`
4. Submit a pull request

## License

MIT