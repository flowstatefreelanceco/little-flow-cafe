/* Little flow cafe settings. Edit this file to change the text and the signup behavior. */
window.CAFE_CONFIG = {
  brandName: 'Flow State Freelance Co.',
  brandUrl: 'https://flowstatestudio.co',

  // Where newsletter signups go.
  //   'netlify'  = Netlify Forms (zero setup, signups show up in your Netlify dashboard)
  //   'webhook'  = POST the email as JSON to webhookUrl (Zapier, Make, Brevo, a Netlify function, etc.)
  //   'off'      = hide the signup box
  signup: {
    mode: 'netlify',
    formName: 'cafe-newsletter',
    webhookUrl: ''
  },

  consentText:
    'By signing up, you agree to be added to the Flow State Freelance Co. community newsletter, ' +
    'which includes check ins, prompts, and gentle invitations in business. ' +
    'Feel free to opt out after your first issue.',

  // Points needed (tasks count 1, focus sessions count 2) to move a new plant in.
  plantUnlockPoints: [0, 0, 0, 0, 4, 9, 15, 22, 30, 40, 52, 64, 78, 92, 108, 125],

  // Hours before a plant gets thirsty, then sleepy (a finished task wakes it up).
  thirstyAfterHours: 36,
  sleepyAfterHours: 96
};
