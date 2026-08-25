# Great.cards Partner Dashboard — Vercel (shared backend)

Hosted version of the partner dashboard. Same tool as the single-file version, but data
(uploaded daily rows + the partner registry) is stored in a shared store, so **anyone who
opens the link sees the same accumulated data** — founders included.

## What's here
```
index.html        the dashboard (client does the click↔application matching)
api/state.js      GET  → returns {partners, rows, batches}
api/upload.js     POST → stores a batch of computed daily rows (dedupe by date+PID)
api/partner.js    POST add / DELETE remove a registry entry
api/batch.js      DELETE → remove an upload batch and all rows it added
_lib/store.js     storage layer — Neon serverless Postgres (free, no card)
```

The heavy lifting (matching each **Confirmed** card to a real click via the `click_id`
inside `clean_exit`, dated by **decision date**) happens in the browser. Only the small
computed daily rows are sent to the server — the giant raw click/application files never leave
your machine.

## Deploy (one-time, ~5 min)

1. **Push this folder to a Git repo** (GitHub/GitLab) or run `vercel` from the Vercel CLI.
2. In Vercel: **New Project** → import the repo. Framework preset: **Other**. Deploy.
3. Add a **free Neon Postgres** database (this is the shared storage — free tier, no credit card):
   - **Easiest:** Vercel dashboard → your project → **Storage** → **Create Database** → **Neon (Postgres)** →
     **Connect** to this project. Vercel auto-adds `DATABASE_URL` / `POSTGRES_URL`.
   - **Or manually:** sign up at **https://neon.tech** (free, no card) → create a project →
     copy the connection string → in Vercel **Settings → Environment Variables** add
     `DATABASE_URL` = that string.
   - The code accepts any of: `DATABASE_URL`, `POSTGRES_URL`, `NEON_DATABASE_URL`,
     `POSTGRES_PRISMA_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING`.
   - The table (`gc_state`) is created automatically on first write — nothing to set up.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the functions pick up the env var + install the driver.

That's it. Open the deployed URL:
- The banner reads live data from the store.
- Drop the day's **click export + application export** → it matches, stores the daily rows, and
  everyone's view updates.
- **＋ Partner** adds a PID→name→status that persists.
- **Upload history** lists each upload; **✕ remove** deletes that batch's data.

## Local use / offline
Open `index.html` directly (file://) and it still works as the session-only tool — no backend,
nothing stored, uploads live until you reload. Handy for a quick local check.

## Notes
- If you deploy **without** the database, the site loads but runs in session-only mode
  (the `/api/state` call reports `configured:false`). Add Neon + redeploy to enable persistence.
- **Free & no credit card:** Neon's free tier is plenty for this (state is one small JSON row).
  This replaced Upstash/Vercel-KV, which now requires a paid Marketplace plan.
- The baked registry in `index.html` (13 PROD partners) is the default; anything added via
  **＋ Partner** is stored server-side and overrides/extends it.
- Storage is a single JSON row (`gc_state`) in Postgres — fine for this data size (thousands of
  tiny daily rows). If it ever grows huge, split `rows` into their own table; the API shape stays the same.
