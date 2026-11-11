# Architecture

## Runtime
- Express serves the static Vanilla JS frontend and `/api/*` routes from one origin.
- Frontend uses ES modules, no React/Next/Vue/Angular.
- Spreadsheet state and guest projects persist in browser localStorage.
- Optional Supabase Auth can provide registration/login; the supplied SQL creates user-owned tables with RLS.
- Gemini requests are made only from the Express backend.

## AI request path
Browser → `/api/ai/chat` → Orchestrator → specialist classification → Gemini model router → primary/fallback/backup model → validation status → response.

The SSE endpoint `/api/ai/stream` emits real backend execution events. The current assistant UI uses the JSON chat endpoint; SSE is available for a future richer live activity panel.

## Specialist routing in MVP
- Formula Agent: formula-related questions
- Data Analyst Agent: dataset analysis questions; basic numeric profile is calculated server-side from supplied values
- Visualization Agent: chart questions
- Spreadsheet Builder Agent: spreadsheet-template questions
- Learning Agent: lessons and learning questions
- General Assistant: other requests
- Validation Agent: reports response completion; it does not independently prove arbitrary AI text correct.

## Spreadsheet
- Editable HTML grid, add row/column, supported formulas, CSV and XLSX import/export.
- Numeric profiling runs locally in the browser and can be sent as context to Gemini.
- Formula support is intentionally limited; see `docs/IMPLEMENTATION_STATUS.md`.

## Deployment
Single Node service can be deployed to Render. Supabase is optional but recommended for cross-device accounts and persistence. Gemini API key belongs only in server environment variables.
