# Life Unfolded

Build a premium frontend-only web experience called LIFE//TRACE for a hackathon challenge called "Your Life, In Receipts".

CORE IDEA:
The application transforms a large collection of digital-life records into an interactive story. It must not feel like a generic analytics dashboard or a simple chronological timeline.

The central product philosophy is:

RAW DATA → PATTERNS → CONNECTIONS → INSIGHTS → STORY

The user should feel like they are exploring an interactive digital archaeology of someone's life.

TECH:

React + Vite

TypeScript

Tailwind CSS

Lucide icons

Framer Motion for restrained animations

Recharts only where useful

Frontend only

No backend

Use local/mock data adapters initially so real CSV data can be connected easily

Structure the data-processing logic separately from UI components

VISUAL DIRECTION:
Create a sophisticated dark editorial/futuristic archive aesthetic.
Use a near-black background, warm off-white typography, subtle borders, restrained gradients, soft glow around data visualizations, generous whitespace, and smooth transitions.
Avoid generic SaaS dashboard styling.
Avoid excessive cards, excessive gradients, excessive colors, and clutter.
The design should feel premium, cinematic, curious, and intelligent.

BRAND:
LIFE//TRACE

Tagline:
"A life leaves traces."

PRIMARY NAVIGATION:

Discover

Journey

Patterns

Moments

DISCOVER PAGE:
Create a cinematic landing experience.

Hero:
"LIFE//TRACE"
"A life leaves traces."

Show dataset scale prominently:

149,860 music moments

2,461 transaction moments

Create an interactive "Life Field" visualization representing activity distributed across time.
Do NOT make it look like a conventional bar chart.
Use hundreds/thousands of lightweight points or particles/aggregated points.
Users should be able to hover over regions to see date ranges and activity summaries and click a region to explore it.

Below the visualization, create a "Discoveries" section containing automatically generated insight cards.

Example insight types:

unusual late-night activity

most active periods

recurring artists

recurring transaction categories

repeated temporal patterns

major changes in activity over time

Do not hardcode fictional conclusions. Build an analysis layer that generates insights from the available data.

JOURNEY PAGE:
Create an interactive temporal exploration interface.

Users should be able to:

zoom between year/month/day levels

hover activity clusters

click a period

see associated music and transaction activity

filter by category/type

Do not simply render a long list of cards.
Make the visualization the primary interface.

PATTERNS PAGE:
Create a visually rich pattern-discovery experience.

Sections:

Time Patterns

Music Patterns

Transaction Patterns

Cross-Data Connections

Examples:

most active hours

weekday vs weekend behavior

late-night listening

top artists

top tracks

skipped vs completed listening

spending by category

recurring transaction categories

payment method patterns

temporal proximity between music and transactions

Clearly distinguish observed correlation from causation.

Create visually interactive pattern cards.
Clicking a pattern should open a deeper exploration view.

CHAPTERS:
Create a storytelling system that groups meaningful periods into data-driven "chapters".

Examples of possible chapter titles:

The Discovery

The Night Shift

The Routine

The Change

The Repeat

These are examples only. Chapter generation should be based on actual detected patterns.

Each chapter should include:

date range

short data-driven description

key statistics

related moments

interactive visualization

"Follow this trace" action

CONNECTION EXPLORER:
This is a signature feature.

When a user selects a receipt/moment, show nearby related activity as a visual chain/network.

Example:
Music → Transaction → Music → Place

Show time distance between events.

Users can click nodes to inspect the underlying record.

Connections must be based on observable data such as temporal proximity, shared categories, repeated entities, or shared dates.
Do not invent causal relationships.

MOMENTS PAGE:
Create a searchable and filterable receipt explorer.

Filters:

All

Music

Transactions

Food

Transportation

Subscriptions

Other categories

Search should work across relevant fields.

Provide:

search

category filtering

date filtering

sorting

detail drawer/modal

Individual receipt details should show related nearby moments and a "Follow this trace" action.

DATA ARCHITECTURE:
Create clean utility functions such as:

analyzeListeningPatterns()

analyzeTimePatterns()

analyzeTransactionPatterns()

findTemporalConnections()

generateInsights()

generateChapters()

aggregateByDay()

aggregateByMonth()

aggregateByHour()

Keep analysis logic separate from rendering.

PERFORMANCE:
The Spotify dataset is very large.
Never render 149,860 individual DOM elements at once.
Use aggregation, memoization, virtualization where appropriate, and lightweight SVG/canvas visualizations.
The initial page should load quickly.

ACCESSIBILITY:
Use semantic HTML.
Provide keyboard-accessible interactions.
Visible focus states.
Good color contrast.
ARIA labels where appropriate.
Do not rely only on color to communicate meaning.

RESPONSIVE:
Desktop, tablet, and mobile must each feel intentionally designed.
Do not simply scale the desktop UI down.

MICROINTERACTIONS:
Use subtle motion:

page transitions

hover reveals

chart/data point emphasis

drawer transitions

smooth filtering

connection highlighting

Avoid excessive animation.

IMPORTANT:
The final experience must communicate within the first few seconds that this is NOT a normal analytics dashboard.

The user should feel:
"There's a story hidden here. I want to find it."

Build the application with polished placeholder/sample data first, but structure everything so the provided CSV datasets can be connected without rewriting the UI architecture. IMPORTANT VISUAL DIRECTION CHANGE:

Do NOT use a dark theme.

Do NOT make this look like an AI-generated analytics dashboard, SaaS dashboard, crypto dashboard, futuristic cyberpunk interface, or generic data visualization template.

The visual identity should feel HUMAN, EDITORIAL, WARM, CURIOUS, and MEMORABLE.

Use a warm off-white / ivory paper-like background with charcoal text and restrained muted accent colors.

Think:

premium editorial magazine

beautifully designed personal journal

museum/archive exhibition

physical scrapbook translated into digital

Apple Journal-like simplicity

sophisticated data storytelling

Avoid:

dark backgrounds

neon colors

purple/blue AI gradients

excessive glassmorphism

excessive rounded cards

excessive pill buttons

generic dashboard grids

excessive shadows

overly futuristic UI

VISUAL LANGUAGE:

The interface should make digital records feel like physical artifacts.

Different receipt types can have subtle visual metaphors:

Music → ticket / album card

Transaction → physical receipt

Photo → polaroid/photo print

Event → event ticket

Note → paper note

Message → small correspondence card

Do not make these literal skeuomorphic replicas. Keep them modern and editorial.

Use subtle imperfections and variations in layout so the interface feels curated rather than machine-generated.

Use asymmetrical editorial layouts where appropriate.

Use generous whitespace.

Use large typography and strong typographic hierarchy.

Use serif typography for major emotional/storytelling headings and a clean sans-serif for interface/data.

COLOR PALETTE:

Primary background:
warm ivory / paper

Primary text:
deep charcoal

Secondary text:
muted gray

Accent colors should be muted and natural:
dusty blue
sage
ochre
faded coral
soft lavender
warm yellow

Do not use highly saturated colors.

DATA VISUALIZATION:

Visualization should feel like part of the editorial composition rather than a standard analytics chart.

Create a "Life Field" where aggregated activity appears as small marks/artifacts distributed across time.

The visualization should feel closer to an interactive museum exhibit or editorial infographic than a business dashboard.

STORYTELLING:

Use editorial section titles such as:

"THE BIG PICTURE"

"THINGS YOU KEPT COMING BACK TO"

"A FEW THINGS WE NOTICED"

"FOLLOW A MOMENT"

"CHAPTERS"

Make the storytelling the primary experience.

The user should feel like they are exploring someone's memories and traces, not operating analytics software.

SIGNATURE INTERACTION:

Create a "Follow the Trace" interaction.

When a user selects a moment, reveal nearby connected moments along a visual path.

Example:

Music → Transaction → Event

Show the time distance between moments.

Allow the user to click each artifact.

The transition should feel like following a thread through someone's life.

OVERALL EMOTION:

The first reaction should be:

"This is beautiful. I wonder what I'll discover."

NOT:

"This is an AI dashboard."

The design should feel distinctive enough that it could plausibly be an award-winning editorial interactive website.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://life-trace-journal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c0c33068-dfbd-4024-963d-23214f851ddb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
