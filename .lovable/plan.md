

## Plan

### Part 1 — Focus-only blocking (`sync-rules`)

Change `supabase/functions/sync-rules/index.ts` so when there is **no active focus session**, return `domains: []`. Skip the union-of-active-blocklists branch entirely. VPN domains also only added when focus is active.

### Part 2 — Instant stop via Realtime

Update `extension/background.js`:
- After loading `weblockToken`, open a Supabase Realtime channel subscribed to `postgres_changes` on `public.focus_sessions` filtered by this device's `device_id`
- On any INSERT/UPDATE event → call `syncCloud()` immediately
- Keep the 60s alarm as fallback
- Use the anon key + project URL (already hardcoded in `WEBLOCK_API`) to construct the realtime client via `https://esm.sh/@supabase/supabase-js@2`

### Part 3 — Enable Realtime on the table

Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;` and `ALTER TABLE public.focus_sessions REPLICA IDENTITY FULL;`

### Part 4 — Repackage & deploy

- Rebuild `public/weblock-extension.zip`
- Deploy `sync-rules` edge function
- User re-downloads from Devices page → reload unpacked

### Files

- `supabase/functions/sync-rules/index.ts` — focus-only logic
- `extension/background.js` — Realtime subscription
- `supabase/migrations/` — enable realtime on focus_sessions
- `public/weblock-extension.zip` — rebuilt

