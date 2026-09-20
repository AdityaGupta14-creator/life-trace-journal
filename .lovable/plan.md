# Deepen the LIFE//TRACE archive

## Experience
- Preserve the current warm paper palette, editorial typography, generous whitespace, LIFE//TRACE identity, and four-part navigation.
- Add a quiet archive progression across the shared experience: Raw receipts → Moments → Connections → Patterns → Chapters.
- Keep interactions restrained, responsive, keyboard accessible, and compatible with reduced-motion preferences.

## Life Field
- Rework the field into selectable time regions with visible exploration cues, density labels, and distinct music/transaction marks.
- Show period activity on hover and keyboard focus, including trace counts and receipt mix.
- On selection, animate into a period-focused state and provide a direct, period-aware transition into Journey.
- Keep the rendering lightweight with aggregated SVG marks rather than raw dataset-sized DOM output.

## Follow the Trace
- Turn the moment detail into a signature connected trace with the selected artifact, nearby moments, factual relationship labels, and exact time distances.
- Rank nearby moments using observable temporal proximity plus available shared attributes, without implying causation.
- Let users select each node and continue following the chain, with gentle expansion motion and a mobile-friendly vertical layout.
- Reuse this interaction from Moments and from contextual links in Journey and Patterns.

## Journey
- Keep year, month, and day exploration while making the period visualization read as an editorial passage rather than a chart.
- Add period-aware navigation and a contextual passage containing representative moments, observed patterns, connected traces, and a short factual narrative generated from that period's records.
- Allow representative receipts to open Follow the Trace.

## Patterns
- Replace static statistical treatment with openable findings grouped as Time, Listening, Transactions, and Cross-data connections.
- Each finding will expose its observation, supporting records, relevant dates, a simple restrained visual, and links into the underlying moments.
- Use explicit proximity/correlation language and derive every statement from analysis utilities.

## Moments
- Add a date-range filter alongside search, type filtering, and sorting.
- Keep the artifact presentation while introducing lightweight pagination so only a small record window renders at once.
- Expand details with nearby moments and the full Follow the Trace interaction.

## Data and states
- Extend the existing analysis layer with period summaries, relationship evidence, time-distance formatting, and pattern support records; keep rendering separate from analysis.
- Add meaningful loading, empty, and error presentation around archive views without adding backend work.
- Preserve the existing adapter boundary so real CSV records can replace mock records without changing the views.

## Verification
- Check all four pages at desktop, tablet, and mobile widths.
- Verify keyboard selection, trace continuation, filters, pagination, reduced-motion behavior, and period-aware navigation.
- Confirm route metadata remains complete and the final preview builds without errors.
