// Saves a newsletter signup to your Supabase "subscribers" table.
// The Supabase key lives in Netlify environment variables, never in the page.
exports.handler = async function (event) {
  var headers = { 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: headers, body: JSON.stringify({ ok: false }) };

  var body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { /* ignore */ }
  var email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ ok: false, error: 'email' }) };
  }

  var url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 500, headers: headers, body: JSON.stringify({ ok: false, error: 'not configured' }) };

  try {
    var res = await fetch(url.replace(/\/$/, '') + '/rest/v1/subscribers?on_conflict=email', {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({ email: email, source: String(body.source || 'little-flow-cafe').slice(0, 60), consent_text: String(body.consentText || '').slice(0, 500) })
    });
    if (!res.ok) return { statusCode: 502, headers: headers, body: JSON.stringify({ ok: false }) };
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 502, headers: headers, body: JSON.stringify({ ok: false }) };
  }
};
