# Deployment guide

## Before pushing to GitHub
- Extract the ZIP.
- Check `.gitignore` includes `.env`.
- Copy `.env.example` to `.env` only on your local machine.
- Never add real API keys to GitHub.
- Run `npm install`, `npm run check`, and `npm start`.

## GitHub
```bash
git init
git add .
git commit -m "Initial ExcelNova AI release"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## Render
1. Create a Render account and connect GitHub.
2. New → Blueprint, select repository containing `render.yaml`.
3. Apply blueprint.
4. Add `GEMINI_API_KEY` in service Environment settings.
5. Add Supabase URL and anon key if using Supabase.
6. Deploy and wait for `/api/health` to report healthy.

## Supabase
Run `database/migrations/001_initial_schema.sql` in the SQL Editor. Set Auth email settings and redirect URLs to your deployed site. Configure allowed site URL in Supabase Auth settings.

## Final smoke tests
- Open `/api/health`.
- Open app and switch theme.
- Edit a spreadsheet cell and apply `=SUM(C2:C6)`.
- Import CSV and export XLSX.
- Run data profile and create chart.
- Configure Gemini key and test chat.
- If using Supabase, sign up, verify email if required, sign in, sign out.

Free service quotas, sleeping, and model rate limits apply.
