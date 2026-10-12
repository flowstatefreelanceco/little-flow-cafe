# Little flow cafe

A free cozy coworking and body doubling cafe. Plain HTML, CSS and JavaScript, no build step.

## Put it on Vercel

1. Upload everything in this folder to a GitHub repo (for example `little-flow-cafe`). Keep `index.html` at the top level, with the `api` folder beside it.
2. In Vercel, choose Add New, then Project, and import that repo. Framework preset: Other. Leave build settings empty. Deploy.
3. Already connected? Just commit and push and Vercel updates itself.

## Accounts (Supabase)

Run `supabase/setup.sql` once in the Supabase SQL editor. In Supabase, open Authentication, then URL Configuration, set Site URL to your live Vercel address and add the same address under Redirect URLs.

## Newsletter box

The "Stay in the cafe" box saves emails to the `subscribers` table in Supabase through `api/subscribe.js`. In Vercel, open Project settings, then Environment variables, and add:

- `SUPABASE_URL` (Supabase Project Settings, then API)
- `SUPABASE_SERVICE_ROLE_KEY` (same page). This key belongs only in Vercel, never in the code.

Then redeploy once so the variables load.

## Settings

Everything you might change (brand name, link, plant unlock points, signup mode) is in `js/config.js`.
