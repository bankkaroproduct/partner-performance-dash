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
_lib/redis.js     tiny Upstash/Vercel-KV REST helper
```

The heavy lifting (matching each **Confirmed** card to a real click via the `click_id`
inside `clean_exit`, dated by **decision date**) happens in the browser. Only the small
computed daily rows are sent to the server — the giant raw click/application files never leave
your machine.

## Deploy (one-time, ~5 min)

1. **Push this folder to a Git repo** (GitHub/GitLab) or run `vercel` from the Vercel CLI.
2. In Vercel: **New Project** → import the repo. Framework preset: **Other**. Deploy.
3. Add a free Redis store (this is the shared storage):
   - Vercel dashboard → your project → **Storage** → **Create** → **Upstash Redis** (free tier).
   - Connecting it auto-adds the env vars `KV_REST_API_URL` and `KV_REST_API_TOKEN`
     (Upstash may name them `UPSTASH_REDIS_REST_URL` / `..._TOKEN` — the code accepts both).
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the functions pick up the env vars.

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
- If you deploy **without** the Redis store, the site loads but runs in session-only mode
  (the `/api/state` call reports `configured:false`). Add the store + redeploy to enable
  persistence.
- The baked registry in `index.html` (13 PROD partners) is the default; anything added via
  **＋ Partner** is stored server-side and overrides/extends it.
- Storage is a single JSON document in Redis — fine for this data size (thousands of tiny
  daily rows). If it ever grows huge, move `rows` to a Postgres table; the API shape stays the same.
