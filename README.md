# LIFE//TRACE — A Life Leaves Traces

> **WebRush Hackathon Challenge**: "Your Life, In Receipts"  
> **Core Concept**: RAW DATA → PATTERNS → CONNECTIONS → INSIGHTS → STORY  
> **Visual Identity**: Warm Ivory / Editorial Paper, Serif Typography, Charcoal Text, Restrained Natural Accents

---

## 1. Executive Summary & Problem Alignment

**LIFE//TRACE** transforms over 160,000 digital-life receipts and streaming records into an interactive archival exploration. Instead of presenting a generic analytics dashboard or KPI summary cards, LIFE//TRACE treats fragmented digital records like physical archaeology. 

Every view reflects a deliberate narrative progression:
```
RAW RECEIPTS → MOMENTS → CONNECTIONS → PATTERNS → CHAPTERS
```

The user steps into an archive spanning **11 calendar years (2013–2024)**, observing recurring rituals, temporal density clusters, and proximity chains without invented psychological interpretations or artificial causality.

---

## 2. Real Datasets Connected

The production application connects 100% genuine datasets without fabricated sample data:

| Dataset | Records Connected | Time Range | Source Fields & Details |
|---|---|---|---|
| **Spotify History** | **149,860** records | Jul 2013 — Dec 2024 (11+ yrs) | Track name, artist, album, platform, duration (ms), skips, shuffle mode, start/end reasons |
| **Daily Household Transactions** | **2,461** records | Jan 2015 — Sep 2018 | Date/time, payment mode, category, subcategory, note, amount (INR), income/expense |
| **India Transactions Archive** | **9,417** valid records (10,267 total rows) | 2023 — 2024 | Transaction date/time, merchant, category, amount (INR), city, state, fraud flag |
| **Total Archive** | **161,738** total records | **2013 — 2024** | **149,860 music moments** and **11,878 real financial receipts** |

### Critical Data Integrity Principle
> **Responsible Data Interpretation**:
> The Spotify streaming history and financial transaction records do not share an explicit personal identifier. In accordance with strict data integrity standards, cross-dataset relationships are established solely through **observable temporal proximity** (e.g. transactions and listening moments occurring within the same 15-minute, 1-hour, or same-day windows). The application never fabricates psychological states, moods, motivations, or causal claims.

---

## 3. Product Architecture

```
Raw CSV Datasets
  ├── spotify_history.csv (21.3 MB)
  ├── Daily Household Transactions.csv (190 KB)
  └── Augmented_IndiaTransactMultiFacet2024.csv (2.5 MB)
          │
          ▼
Ingestion & Precomputation Pipeline (scripts/process-archive.mjs)
  ├── Precomputes 138 monthly intervals across 2013–2024
  ├── Derives top artists, skip rates, platforms, category breakdowns
  ├── Generates public/data/archive-summary.json (~69 KB)
  └── Indexes 31,633 client-side moments into public/data/archive-moments.json
          │
          ▼
Normalized Data Adapter (src/lib/lifetrace-data.ts)
  ├── Strongly typed LifeMoment models
  ├── Asynchronous multi-field search and date-range queries
  └── Fast archival pagination (24 cards/page)
          │
          ▼
Analysis & Relationship Engine (src/lib/lifetrace-analysis.ts)
  ├── aggregateByDay / aggregateByMonth / aggregateByYear / aggregateByHour
  ├── analyzeListeningPatterns / analyzeTransactionPatterns / analyzeTimePatterns
  ├── findTemporalConnections & formatTimeDistance
  └── generatePeriodSummary (Factual narrative generator)
          │
          ▼
Editorial Archive UI (src/routes/)
  ├── Discover (/) — Scale indicator, Life Field, discoveries, chapters
  ├── Journey (/journey) — Year/Month/Day temporal zoom, period narratives
  ├── Patterns (/patterns) — 4 factual observation categories with evidence
  └── Moments (/moments) — Paginated explorer with Follow the Trace
```

---

## 4. Key Features & Innovations

### The Life Field (Temporal Density Field)
- Visualizes 161,738 records as an aggregated temporal field across 138 monthly intervals.
- Distinct color marks differentiate pure music streaming (dusty blue) from overlapping receipt periods (ochre).
- Lightweight SVG marks avoid DOM node explosion from 150,000+ raw records.
- Accessible keyboard navigation (`Tab`, `Enter`, `Space`, visible focus rings).
- Interactive HUD displays exact monthly trace counts and receipt mix, with direct passage transitions into **Journey**.

### Follow the Trace (Signature Feature)
- Accessible from any artifact in Moments, Journey, Patterns, or Discover.
- Presents the selected artifact as a physical archival slip with real timestamps and metadata.
- Automatically discovers nearest temporal neighbors in the archive and displays exact factual time distances ("within 15 minutes", "42 min later", "same day").
- Interactive sequential navigation: clicking any connected node advances the trace chain (`Node A → Node B → Node C → Node D`) with breadcrumbs to step back.
- Responsive design: fluid horizontal scroll on desktop, vertical archival timeline on mobile. Respects `prefers-reduced-motion`.

### Editorial Storytelling & Chapters
- Real, data-grounded chapters reflecting historical listening and spending eras:
  1. *The Emergence (2013–2015)*: Early Android/Web Player streaming and earliest household account records.
  2. *The Routine Builds (2016)*: 6,413 music sessions and steady daily transit/food entries.
  3. *The High-Density Peak (2017)*: Densest single year in the archive (26,320 songs and 1,035 receipts).
  4. *Everyday Rhythms & Rituals (2018)*: 14,817 songs and 676 daily receipts with frequent food and transit tracking.
  5. *The Ambient Stream (2019–2021)*: 62,198 songs with a 94.7% playthrough completion rate.
  6. *The Multi-Facet Archive (2022–2024)*: Late-era catalogue streams and 9,417 merchant card transactions.

---

## 5. Performance Strategy

1. **Zero 21MB CSV Runtime Parsing**:
   Raw CSV files are never parsed synchronously in the browser. The ingestion pipeline precomputes high-level distributions into a 69 KB JSON file that loads instantly on initial page visit.
2. **Archival Pagination**:
   The Moments explorer queries an indexed 31,633-moment client dataset with 24 items per page, guaranteeing minimal DOM memory footprint and 60fps scrolling.
3. **Memoized Analytics**:
   Heavy date grouping and sorting are memoized outside the render tree.

---

## 6. Accessibility & Responsive Verification

- **Accessibility**:
  - Full semantic HTML structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`).
  - Visible focus rings (`focus-visible:outline-2 focus-visible:outline-ring`).
  - ARIA attributes: `role="region"`, `role="listbox"`, `role="option"`, `aria-selected`, `aria-label`.
  - Respects user preference for `prefers-reduced-motion`.
- **Responsive Layout**:
  - Tested across 375px (mobile), 768px (tablet), and 1440px+ (desktop).
  - Mobile incorporates a fixed bottom navigation bar with safe-area padding and single-column vertical trace cards.
  - Zero accidental horizontal overflow.

---

## 7. How to Run Locally

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation & Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```
The server will start locally at `http://localhost:8080/`.

### Production Build & Verification
```bash
# Compile and build production bundle
npm run build

# Preview production build locally
npm run preview

# Verify TypeScript types
npx tsc --noEmit
```

### Re-Processing Real Datasets
If the source CSV files are updated:
```bash
node scripts/process-archive.mjs
```
This re-ingests all CSV files, calculates exact statistics, and regenerates `public/data/archive-summary.json` and `public/data/archive-moments.json`.
