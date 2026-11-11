# ExcelNova AI — Project State

Current package: Complete ZIP MVP codebase
Date: 2026-11-11

## Completed in source
See `IMPLEMENTATION_STATUS.md` for exact scope.
Frontend, backend, Gemini fallback, spreadsheet workspace, local analytics, charts, learning starter, optional Supabase setup, SQL migration and deployment docs are included.

## User setup still required
1. Extract ZIP.
2. Install Node.js 20+.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add Gemini API key.
6. Optional: create Supabase project, run SQL migration and add URL + anon key.
7. Run `npm run dev` and test locally.
8. Push to GitHub, connect Render, set environment variables and deploy.

## Known limitations
- Supabase auth UI works when configured; API JWT authorization and cloud project/chat persistence are not yet connected.
- Spreadsheet formulas are a deliberately small safe subset.
- AI builder output requires user review and manual conversion into sheet layout.
- Assistant JSON route is used by UI; SSE route exists but is not wired to the chat display.
- Live cloud behavior has not been tested with user's credentials.

## Next recommended development milestone
Test the extracted package locally, fix environment-specific errors, then implement secure Supabase token verification and database-backed projects/chat before calling it production-ready.
