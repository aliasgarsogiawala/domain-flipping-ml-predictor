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
  # Domain Flip

  Domain Flip is a domain intelligence workspace for valuation, resale detection, availability checks, and watchlist tracking.

  The app now uses a DomainTools-inspired editorial UI: light gray surfaces, strong black borders, lime highlights, and periwinkle CTAs.

  ## What it does

  ### Domain analysis
  - Rule-based scoring across 10+ categories
  - RDAP lookup for registrar, creation date, expiry, and status flags
  - Market signal blending from deterministic mock data
  - Comparisons between two domains
  - A breakdown of what raised or lowered the score

  ### Valuation realism
  - TLD market weight system to keep .com, .ai, .io, .co, and ccTLDs in realistic ranges
  - Liquidity adjustment so stronger extensions remain easier to resell
  - Sanity checks that prevent weak ccTLDs from outranking stronger .com names without support
  - Both raw appraisals and adjusted market estimates are exposed in the API and UI

  ### Resale detection
  - Detects aftermarket signals on landing pages
  - Identifies bot protection, marketplace keywords, and listing hints
  - Returns confidence levels: high, medium, low
  - Provides verification links for major marketplaces

  ### Watchlist
  - localStorage-backed watchlist for the MVP
  - Add taken domains from the analyzer
  - Recheck one item or all items at once
  - Stores score, estimated value, registrar, expiry, and timestamps

  ### Landing page
  - Market insights section
  - TLD benchmark cards
  - Lifecycle workflow blocks
  - Clean, data-heavy layout with a technical editorial feel

  ## Stack

  - Next.js 16 App Router
  - TypeScript
  - Tailwind CSS
  - Recharts
  - Serverless API route for analysis
  - RDAP lookups via public domain data sources

  ## Main routes

  - / — landing page with market insights
  - /analyze — analyzer and comparison workspace
  - /watchlist — tracked domains board
  - /api/analyze — analysis endpoint

  ## Analysis pipeline

  The analysis route normalizes a domain, then combines:

  1. Rule-based scoring
  2. Mock market data
  3. RDAP data
  4. Resale detection
  5. TLD-weighted valuation adjustment

  The final response includes:

  - score
  - ruleScore
  - marketScore
  - investmentScore
  - estimatedValueUsd
  - tldMarketAnchorUsd
  - adjustedEstimatedValueUsd
  - liquidityScore
  - verdict
  - riskLevel
  - reasons
  - weaknesses
  - breakdown
  - RDAP metadata
  - resale status and marketplace links
  - investment report and value projection

  ## Scoring model

  The analyzer evaluates domains using categories such as:

  - TLD strength
  - Length
  - Brandability
  - Memorability
  - Pronounceability
  - Premium brand signal
  - Trend relevance
  - Commercial intent
  - Registration history
  - Risk penalties

  The final score is blended from rule-based and market-based signals, then capped or normalized when the name looks unrealistic.

  ## Watchlist schema

  ```ts
  {
    domain: string;
    score: number;
    availabilityStatus: "Available" | "Taken" | "Unknown";
    resaleStatus?: "not_listed" | "listed_for_sale" | "possibly_listed" | "needs_verification" | "unknown";
    estimatedValueUsd?: number | null;
    registrar?: string | null;
    expiresAt?: string | null;
    addedAt: string;
    lastCheckedAt: string;
  }
  ```

  ## Project structure

  ```text
  src/
  ├── app/
  │   ├── page.tsx
  │   ├── analyze/page.tsx
  │   ├── watchlist/page.tsx
  │   ├── api/analyze/route.ts
  │   └── globals.css
  ├── components/
  │   ├── Navbar.tsx
  │   ├── Footer.tsx
  │   ├── DomainComparisonChart.tsx
  │   └── ValueProjectionChart.tsx
  └── lib/
      ├── domainAnalyzer.ts
      ├── domainMarketplace.ts
      ├── domainAvailability.ts
      ├── mockMarketData.ts
      ├── rdap.ts
      ├── watchlist.ts
      ├── investmentReport.ts
      └── valueProjection.ts
  ```

  ## Scripts

  ```bash
  pnpm dev
  pnpm build
  pnpm start
  pnpm lint
  ```

  ## Getting started

  ```bash
  pnpm install
  pnpm dev
  ```

  Then open http://localhost:3000.

  ## Design system

  - Background: #ECECEA
  - Cards: #F3F3F1
  - Text: #111111
  - Borders: strong black, 2px
  - Accent lime: #B8FF2C
  - CTA purple: #7385F6

  ## Notes

  - This is an MVP.
  - Market data is heuristic.
  - Watchlist persistence currently uses localStorage.
  - The project is structured so a database and cron-based alerts can be added later.

  ## License

  MIT