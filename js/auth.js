/* Little flow cafe: optional accounts and cloud saving through Supabase.
   Passwordless: people enter their name and email, then use the link (or 6 digit code) we email them.
   Only the public anon key is used here. It is safe in the page because the database rules (RLS) limit what it can do. */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});
  var CFG = window.CAFE_CONFIG || {}, SB = CFG.supabase || {};
  var client = null, user = null, listeners = [];

  function configured() { return !!(SB.url && SB.anonKey); }

  function loadLib(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
    s.onload = function () { cb(); };
    s.onerror = function () { cb('fail'); };
    document.head.appendChild(s);
  }

  // resolves with the signed in user, or null. Never rejects.
  function boot() {
    return new Promise(function (resolve) {
      if (!configured()) return resolve(null);
      var done = false;
      function finish(u) { if (!done) { done = true; resolve(u); } }
      setTimeout(function () { finish(user); }, 4500);
      loadLib(function (err) {
        if (err || !window.supabase) return finish(null);
        try {
          client = window.supabase.createClient(SB.url, SB.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        } catch (e) { return finish(null); }
        client.auth.onAuthStateChange(function (ev, sess) {
          user = sess ? sess.user : null;
          listeners.forEach(function (f) { try { f(ev, user); } catch (e) { /* ignore */ } });
        });
        client.auth.getSession().then(function (r) {
          user = r && r.data && r.data.session ? r.data.session.user : null;
          finish(user);
        }).catch(function () { finish(null); });
      });
    });
  }

  function msg(e) { return (e && e.message) ? e.message : 'Something went wrong. Please try again.'; }
  function redirect() { return window.location.origin + window.location.pathname; }

  function signUp(first, last, email) {
    if (!client) return Promise.resolve({ error: 'not-ready' });
    return client.auth.signInWithOtp({
      email: email,
      options: { shouldCreateUser: true, emailRedirectTo: redirect(), data: { first_name: first, last_name: last, newsletter: 'true' } }
    }).then(function (r) { return r.error ? { error: msg(r.error) } : { ok: true }; }).catch(function (e) { return { error: msg(e) }; });
  }
  function logIn(email) {
    if (!client) return Promise.resolve({ error: 'not-ready' });
    return client.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false, emailRedirectTo: redirect() } })
      .then(function (r) { return r.error ? { error: msg(r.error) } : { ok: true }; }).catch(function (e) { return { error: msg(e) }; });
  }
  function verify(email, code) {
    if (!client) return Promise.resolve({ error: 'not-ready' });
    return client.auth.verifyOtp({ email: email, token: code, type: 'email' })
      .then(function (r) { return r.error ? { error: msg(r.error) } : { ok: true }; }).catch(function (e) { return { error: msg(e) }; });
  }
  function signOut() {
    if (!client) return Promise.resolve();
    return client.auth.signOut().catch(function () { /* ignore */ });
  }
  function pull() {
    if (!client || !user) return Promise.resolve(null);
    return client.from('saves').select('data,updated_at').eq('user_id', user.id).maybeSingle()
      .then(function (r) { return r && r.data ? r.data : null; }).catch(function () { return null; });
  }
  function push(data) {
    if (!client || !user) return Promise.resolve(false);
    return client.from('saves').upsert({ user_id: user.id, data: data, updated_at: new Date().toISOString() })
      .then(function (r) { return !r.error; }).catch(function () { return false; });
  }
  function firstName() { var m = user && user.user_metadata; return (m && m.first_name) || ''; }

  Cafe.Auth = {
    configured: configured, boot: boot, signUp: signUp, logIn: logIn, verify: verify, signOut: signOut, pull: pull, push: push,
    user: function () { return user; }, firstName: firstName,
    onChange: function (f) { listeners.push(f); }
  };
})();
