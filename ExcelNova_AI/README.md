# ExcelNova AI

**Intelligent Spreadsheets. Smarter Decisions. Powered by AI.**

ExcelNova AI is a full-stack, vanilla-JavaScript spreadsheet workspace starter with working spreadsheet editing, formula calculations, CSV/XLSX import/export, data profiling, charts, learning/practice screens, AI formula/chat workflows, multi-agent task routing, Gemini model fallback, optional Supabase authentication, and deployment documentation.

> **Honest scope note:** This is a runnable FYP MVP codebase, not a claim that every enterprise-grade feature in a long-term FYP roadmap is already finished. It does not include a full Excel-parity spreadsheet engine, production-grade audit/compliance suite, complete admin console, or fully automated test coverage. See `docs/IMPLEMENTATION_STATUS.md`.

## Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript (ES modules)
- Backend: Node.js 20+, Express
- AI: Gemini API, server-side model fallback chain
- Optional auth/database: Supabase Auth + PostgreSQL + RLS SQL migration
- Spreadsheet file handling: SheetJS (loaded from CDN in browser)
- Charts: Chart.js (loaded from CDN in browser)
- Icons: inline SVG/CSS symbols; no framework dependency

## Run locally
1. Install Node.js 20+.
2. Extract the ZIP and open this folder in VS Code.
3. Open a terminal in this folder and run:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Add your Gemini API key to `.env` (optional until you use AI).
6. Run:

   ```bash
   npm run dev
   ```

7. Visit `http://localhost:3000`.

The server hosts both frontend and API on the same origin. No separate frontend server is required.

## Gemini model fallback
Default configurable chain:
1. `gemini-3.8-flash`
2. `gemini-3.6-flash`
3. `gemini-3.5-flash-lite`

Google may change model access, free-tier eligibility, quotas, and model availability. These IDs are configurable in `.env`. The backend tries the next model for transient failures, rate limits, overload, timeout, or missing model. It does **not** silently retry invalid API keys or permission errors. Fallback does not bypass Google's quotas or guarantee uninterrupted free usage.

Official references:
- Models: https://ai.google.dev/gemini-api/docs/models
- Pricing/free tier: https://ai.google.dev/gemini-api/docs/pricing
- API key: https://aistudio.google.com/apikey

## Optional Supabase setup
1. Create a Supabase project.
2. Run `database/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`.
4. Restart the app.
5. Register through the sign-in screen.

Without Supabase, the app runs in local guest mode. Guest projects are stored in this browser's localStorage and are not synced across devices. Do not use guest mode for sensitive data.

## Deploy
### Render (single service)
1. Push the extracted project folder to a GitHub repository.
2. In Render, create a **Blueprint** from the repository and apply `render.yaml`, or create a Web Service manually.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in Render:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL` (if using Supabase)
   - `SUPABASE_ANON_KEY` (if using Supabase)
   - optionally model IDs and `APP_ORIGIN`
6. Deploy. Render provides the public URL.

The free hosting plan may sleep or have resource limits. Gemini's free quota is separate from hosting limits.

### GitHub push
```bash
git init
git add .
git commit -m "Initial ExcelNova AI project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```
Never commit `.env`.

## Important security notes
- Gemini key is read only by the backend.
- Supabase service-role key is not used in this browser app and must never be exposed.
- Supabase RLS policies are included for user-owned data.
- Spreadsheet formula evaluation is intentionally limited to a safe supported set; it does not use `eval()`.
- Imported file size is capped in the browser. Do not upload confidential spreadsheets to third-party services without understanding their privacy terms.
- The AI is an assistant, not a substitute for checking calculations. Numeric profiling is computed locally from the actual dataset.

## Project map
See `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DEPLOYMENT.md`, and `docs/IMPLEMENTATION_STATUS.md`.
