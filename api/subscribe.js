// Vercel serverless function: saves a newsletter signup to your Supabase "subscribers" table.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY live in Vercel environment variables, never in the page.
module.exports = async function (req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false }); return; }
  var body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  var email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) { res.status(400).json({ ok: false, error: 'email' }); return; }
  var url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { res.status(500).json({ ok: false, error: 'not configured' }); return; }
  try {
    var r = await fetch(url.replace(/\/$/, '') + '/rest/v1/subscribers?on_conflict=email', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ email: email, source: String(body.source || 'little-flow-cafe').slice(0, 60), consent_text: String(body.consentText || '').slice(0, 500) })
    });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch (e) { res.status(502).json({ ok: false }); }
};
