# Little flow cafe

A free, cozy coworking and body doubling web app. Plain HTML, CSS and JavaScript, no build step.

## Put it online (GitHub and Netlify)

1. Make a new GitHub repo (for example `little-flow-cafe`) and upload everything in this folder to its main branch. Keep `index.html` and `netlify.toml` at the top level of the repo.
2. In Netlify, choose Add new site, then Import an existing project, pick that repo. Leave the build command empty and the publish directory as `.` (the included `netlify.toml` already says this).
3. Deploy. From now on every push to GitHub updates the site by itself.

If the repo is already connected to Netlify, just commit the files and push.

## Accounts, cloud saving and newsletter signups (Supabase)

People can sign up with first name, last name and email, then use a sign in link or 6 digit code sent to their email (no passwords). Signing up adds them to your newsletter list, and their tasks, plants and character save online so they follow them to any device. Guests can still step inside and save on their own device.

**1. Make the tables**
In Supabase, open SQL Editor, then New query. Paste everything from `supabase/setup.sql` and click Run.

**2. Turn on email sign in**
In Supabase, open Authentication, then Providers, and make sure Email is on.
Open Authentication, then URL Configuration. Set Site URL to your live Netlify address (for example `https://yourcafe.netlify.app`) and add the same address under Redirect URLs.

**3. Add the 6 digit code to the email (optional but helpful)**
Open Authentication, then Email Templates, then Magic Link. Add this line to the email body so people can type a code instead of tapping the link:
`Your code is {{ .Token }}`
Do the same in the Confirm signup template.

**4. Paste your public keys into `js/config.js`**
In Supabase, open Project Settings, then API. Copy the Project URL and the `anon` key (also called publishable). Paste them here:
```js
supabase: { url: 'https://xxxx.supabase.co', anonKey: 'your-anon-key' },
```
These two are public and safe in the page. The database rules keep each person's data private. Never paste the `service_role` key anywhere in these files.

**5. Email sending limits**
Supabase's built in email is limited to a few emails per hour, so before you launch, add your own email sender: open Project Settings, then Authentication, then SMTP Settings (Brevo works great).

**6. Commit and push**, and Netlify updates by itself.

### The footer newsletter box (optional)
The "Stay in the cafe" box at the bottom also works. By default it saves to Netlify Forms. To save it to Supabase instead, add two Netlify environment variables (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, from Project Settings, then API) and set `signup` in `js/config.js` to:
```js
signup: { mode: 'webhook', formName: 'cafe-newsletter', webhookUrl: '/.netlify/functions/subscribe' },
```
The service_role key belongs only in Netlify environment variables, never in the code.

Your list lives in the Supabase table `subscribers` (Table Editor). Export it to CSV any time and import it into Brevo or Substack.

## Make it yours

Everything you will want to change is in `js/config.js`:

- `brandName` and `brandUrl` for the footer link.
- `consentText` for the wording under the signup button.
- `plantUnlockPoints` for how many points each plant needs.
- `thirstyAfterHours` and `sleepyAfterHours` for how forgiving the plants are.

`accountConsent` is the wording on the sign up form.

Daily cards live in `js/affirmations.js`. Plant varieties live in `js/art-plants.js` (the `VARIETIES` list).

## Saving

Tasks, plants, character and streak are saved in the browser's localStorage. They stay on the same browser and device, are lost if someone clears site data, and do not sync across devices.
