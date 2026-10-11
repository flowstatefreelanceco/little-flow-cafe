# Little flow cafe

A free, cozy coworking and body doubling web app. Plain HTML, CSS and JavaScript, no build step.

## Put it online (GitHub and Netlify)

1. Make a new GitHub repo (for example `little-flow-cafe`) and upload everything in this folder to its main branch. Keep `index.html` and `netlify.toml` at the top level of the repo.
2. In Netlify, choose Add new site, then Import an existing project, pick that repo. Leave the build command empty and the publish directory as `.` (the included `netlify.toml` already says this).
3. Deploy. From now on every push to GitHub updates the site by itself.

If the repo is already connected to Netlify, just commit the files and push.

## Collect signups in Supabase

The signup form posts to a small Netlify function that writes to your Supabase project. Your key stays on the server.

1. In Supabase, open SQL Editor, paste `supabase/subscribers.sql` and run it. This makes a locked `subscribers` table.
2. In Supabase, open Project Settings, then API. Copy the Project URL and the `service_role` key.
3. In Netlify, open Site configuration, then Environment variables, and add:
   - `SUPABASE_URL` set to the Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` set to the service_role key
4. In `js/config.js`, set the signup block to:

```js
signup: { mode: 'webhook', formName: 'cafe-newsletter', webhookUrl: '/.netlify/functions/subscribe' }
```

5. Commit and push. Redeploy once so Netlify picks up the new variables.

Never paste the service_role key (or any Brevo or Substack key) into the code or the repo. Only Netlify environment variables.

Prefer not to use Supabase? Leave `mode: 'netlify'` and signups land in Netlify Forms (Forms tab on your site). You can also point `webhookUrl` at Zapier or Make to send people to Brevo or Substack.

## Make it yours

Everything you will want to change is in `js/config.js`:

- `brandName` and `brandUrl` for the footer link.
- `consentText` for the wording under the signup button.
- `plantUnlockPoints` for how many points each plant needs.
- `thirstyAfterHours` and `sleepyAfterHours` for how forgiving the plants are.

Daily cards live in `js/affirmations.js`. Plant varieties live in `js/art-plants.js` (the `VARIETIES` list).

## Saving

Tasks, plants, character and streak are saved in the browser's localStorage. They stay on the same browser and device, are lost if someone clears site data, and do not sync across devices.
