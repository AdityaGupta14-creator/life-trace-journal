# LIFE//TRACE editorial archive

## Experience
- Build a warm, editorial multi-page experience with shared navigation for Discover, Journey, Patterns, and Moments.
- Make the opening feel like a museum archive: oversized serif typography, paper-like surfaces, restrained natural accents, and an interactive Life Field instead of dashboard charts.
- Add responsive compositions for desktop, tablet, and mobile, with accessible keyboard states and reduced-motion support.

## Data and storytelling
- Create typed mock adapters for music and transaction records, designed to be replaced by CSV adapters later.
- Separate analysis utilities for time, listening, transactions, aggregation, temporal connections, insights, and chapter generation.
- Generate all discoveries and chapters from the supplied sample records rather than hardcoding conclusions.

## Interaction
- Discover: explore and select aggregated regions in the Life Field, then browse generated discoveries and chapters.
- Journey: change year/month/day scale, filter record types, select periods, and inspect the associated activity.
- Patterns: browse interactive findings grouped by time, music, transactions, and cross-data connections, with deeper detail views and clear correlation language.
- Moments: search, filter, date-sort, inspect an artifact, and follow nearby moments through an interactive trace path.

## Technical details
- Use TanStack Start’s existing React/Vite structure, TypeScript, Tailwind CSS tokens, Lucide icons, lightweight SVG, and restrained CSS/React motion.
- Keep heavy records aggregated and memoized; render only small derived sets in the interface.
- Add route-specific metadata and verify the final experience at desktop and mobile sizes.
