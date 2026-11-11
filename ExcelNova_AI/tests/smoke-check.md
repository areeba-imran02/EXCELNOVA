# Manual smoke test checklist

- [ ] `npm install` completes
- [ ] `npm run check` completes
- [ ] `npm start` starts Express without errors
- [ ] `/api/health` returns status `ok`
- [ ] Dashboard loads at `/`
- [ ] Light/dark theme switches and persists
- [ ] Spreadsheet cells can be edited
- [ ] `=SUM(C2:C6)` returns a numeric value
- [ ] CSV import and export work
- [ ] XLSX import and export work (CDN reachable)
- [ ] Data Analyst displays calculated values
- [ ] Chart renders and PNG export works
- [ ] Gemini chat works with configured API key
- [ ] Fallback model is attempted on a retryable primary failure
- [ ] Supabase sign-up/sign-in works when configured
