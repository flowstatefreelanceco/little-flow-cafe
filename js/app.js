/* Little flow cafe: the app. Timer, tasks, plants, sounds, daily card, character creator, saving. */
(function () {
  'use strict';
  var Cafe = window.Cafe, CFG = window.CAFE_CONFIG || {}, CARDS = window.CAFE_CARDS || [];
  var Pe = Cafe.People, Pl = Cafe.Plants, Art = Cafe.Art, Audio = Cafe.Audio, Auth = Cafe.Auth;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'cozyCafe.v1';
  var STAGE_NAMES = ['Seedling', 'Sprout', 'Growing', 'Thriving'];
  var HEALTH_NAMES = ['Happy', 'Thirsty', 'Sleeping'];
  var SOUNDS = [
    { id: 'waves', label: 'Ocean waves', hint: 'Slow and soft' },
    { id: 'fire', label: 'Fireplace', hint: 'Soft crackle' },
    { id: 'chat', label: 'Cafe chatter', hint: 'Low, friendly murmur' },
    { id: 'plates', label: 'Plates clinking', hint: 'Now and then' },
    { id: 'keys', label: 'Keyboard clicks', hint: 'Other people typing' },
    { id: 'rain', label: 'Rain', hint: 'On the window' },
    { id: 'music', label: 'Lo-fi music', hint: 'Slow and warm' }
  ];
  var TIME_CHIPS = [['auto', 'Real time'], ['morning', 'Morning'], ['day', 'Daytime'], ['golden', 'Golden hour'], ['evening', 'Evening'], ['night', 'Night']];
  var WX_CHIPS = [['clear', 'Clear'], ['cloudy', 'Cloudy'], ['rain', 'Rainy'], ['snow', 'Snowy']];

  /* ---------- small helpers ---------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag), k;
    for (k in (attrs || {})) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] === false || attrs[k] == null) continue;
      else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayNum(key) { var p = key.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); }
  function hourNow() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function seeded(str) {
    var h = 1779033703 ^ str.length, i;
    for (i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  /* ---------- saving (this device only) ---------- */
  var storageOk = true, memStore = null;
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { storageOk = false; }
    return memStore;
  }
  function defaults() {
    var snd = {};
    SOUNDS.forEach(function (s) { snd[s.id] = { on: s.id === 'waves' || s.id === 'music', vol: s.id === 'waves' ? 0.45 : (s.id === 'music' ? 0.28 : 0.5) }; });
    return {
      v: 1, savedAt: 0, char: Pe.defaultSpec(), hasChar: false, day: dayKey(), tasks: [],
      plants: {}, points: 0, sessions: 0, minutes: 0, tasksDone: 0, streak: { count: 0, last: '' },
      sounds: snd, master: 0.8, muted: false, sfx: true,
      vibes: { time: 'auto', wx: 'clear' }, calm: false,
      timer: { focus: 25, break: 5 }, daily: { day: '', picked: -1 }, nudged: false, choice: {}, vac: null, big: false, lights: {}
    };
  }
  var S = (function () {
    var d = defaults(), saved = load();
    if (saved && typeof saved === 'object') {
      Object.keys(d).forEach(function (k) {
        if (saved[k] === undefined) return;
        if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && k !== 'char') {
          Object.keys(saved[k] || {}).forEach(function (kk) { d[k][kk] = saved[k][kk]; });
        } else d[k] = saved[k];
      });
    }
    d.char = Pe.cleanSpec(d.char);
    if (!d.choice || typeof d.choice !== 'object') d.choice = {};
    SOUNDS.forEach(function (s) { if (!d.sounds[s.id]) d.sounds[s.id] = { on: false, vol: 0.5 }; });
    return d;
  })();
  var saveTimer = 0;
  function save() {
    memStore = S;
    S.savedAt = Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { window.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOk = false; showSaveNote(); }
      cloudSoon();
    }, 150);
  }
  function showSaveNote() {
    $('save-note').textContent = storageOk
      ? ((window.Cafe.Auth && Cafe.Auth.user && Cafe.Auth.user()) ? 'Your list is saved to your account.' : 'Your list is saved on this device. Log in to keep it everywhere.')
      : 'Saving is turned off in this browser, so your list will clear when you close this tab.';
  }

  /* ---------- toasts, modals, tip ---------- */
  function toast(msg, opts) {
    opts = opts || {};
    var box = $('toasts');
    while (box.children.length >= 3) box.removeChild(box.firstChild);
    var t = el('div', { class: 'toast', role: 'status' }, [el('span', { text: msg })]);
    if (opts.action) t.appendChild(el('button', { class: 'btn', type: 'button', text: opts.action.label, onclick: function () { opts.action.fn(); remove(); } }));
    box.appendChild(t);
    var timer = setTimeout(remove, opts.ms || 4800);
    function remove() { clearTimeout(timer); t.classList.add('out'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320); }
  }

  var modalStack = [], lastFocus = null;
  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(function (n) { return !n.disabled && !n.hidden && n.offsetParent !== null; });
  }
  function openModal(id) {
    var m = $(id);
    if (!m || !m.hidden) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.classList.add('modal-open');
    modalStack.push(m);
    var f = m.querySelector('[data-autofocus]') || focusables(m)[0];
    if (f) f.focus();
  }
  function closeModal(m) {
    m = m || modalStack[modalStack.length - 1];
    if (!m) return;
    m.hidden = true;
    modalStack = modalStack.filter(function (x) { return x !== m; });
    if (!modalStack.length) document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
    if (m.id === 'modal-char') save();
  }
  document.addEventListener('keydown', function (e) {
    var m = modalStack[modalStack.length - 1];
    if (!m) return;
    if (e.key === 'Escape' && m.id !== 'modal-roll') { e.preventDefault(); closeModal(m); }
    else if (e.key === 'Tab') {
      var f = focusables(m); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  Array.prototype.forEach.call(document.querySelectorAll('.modal'), function (m) {
    m.addEventListener('click', function (e) { if (e.target === m && m.id !== 'modal-roll') closeModal(m); });
    Array.prototype.forEach.call(m.querySelectorAll('[data-close]'), function (b) { b.addEventListener('click', function () { closeModal(m); }); });
  });

  /* ---------- sound helpers (safe if audio is missing) ---------- */
  function sfx(name, arg) { try { if (S.sfx && Audio && Audio.ready()) Audio[name](arg); } catch (e) { /* ignore */ } }

  /* ---------- plants ---------- */
  /* ---------- vacation mode: plants rest and the clock pauses, for up to 10 days ---------- */
  var MAX_VAC_DAYS = 10, vacOpen = false;
  function careClock() { return (S && S.vac && S.vac.from) ? S.vac.from : Date.now(); }
  function vacActive() { return !!(S.vac && S.vac.until > Date.now()); }
  function endVacation(early) {
    if (!S.vac) return;
    var shift = Math.max(0, Math.min(Date.now(), S.vac.until) - S.vac.from);
    Object.keys(S.plants).forEach(function (id) { if (S.plants[id]) S.plants[id].lastCare = (S.plants[id].lastCare || 0) + shift; });
    if (S.streak && S.streak.count > 0) S.streak.last = dayKey();
    S.vac = null; vacOpen = false;
    save(); syncScene(); renderGarden(); renderVacation();
    toast(early ? 'Welcome back. Your plants waited for you.' : 'Welcome back. Your plants kept things cozy while you were away.');
  }
  function startVacation(days) {
    days = Math.max(1, Math.min(MAX_VAC_DAYS, parseInt(days, 10) || 1));
    var now = Date.now();
    S.vac = { from: now, until: now + days * 864e5 };
    vacOpen = false;
    save(); syncScene(); renderGarden(); renderVacation();
    toast('Vacation mode is on for ' + days + (days === 1 ? ' day' : ' days') + '. Your plants will rest and wait for you.');
  }
  function checkVacation() { if (S.vac && S.vac.until <= Date.now()) endVacation(false); }
  function renderVacation() {
    var box = $('vac'); if (!box) return;
    box.innerHTML = '';
    if (vacActive()) {
      var until = new Date(S.vac.until);
      var when = until.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      box.appendChild(el('p', { class: 'vac-on', text: 'On vacation until ' + when + '. Your plants are resting and nothing will wilt.' }));
      box.appendChild(el('button', { class: 'btn', type: 'button', text: 'I am back early', onclick: function () { endVacation(true); } }));
      return;
    }
    if (!vacOpen) {
      box.appendChild(el('button', { class: 'link', type: 'button', text: 'Going away? Turn on vacation mode', onclick: function () { vacOpen = true; renderVacation(); } }));
      return;
    }
    var sel = el('select', { id: 'vac-days', 'aria-label': 'How many days' });
    for (var d = 1; d <= MAX_VAC_DAYS; d++) sel.appendChild(el('option', { value: String(d), text: d + (d === 1 ? ' day' : ' days') }));
    sel.value = '3';
    box.appendChild(el('p', { class: 'fine', text: 'Pause your plants for up to ' + MAX_VAC_DAYS + ' days. They will not get thirsty or sleepy while you are away, and your streak stays safe.' }));
    box.appendChild(el('div', { class: 'vac-row' }, [
      sel,
      el('button', { class: 'btn primary', type: 'button', text: 'Start vacation', onclick: function () { startVacation(sel.value); } }),
      el('button', { class: 'link', type: 'button', text: 'Cancel', onclick: function () { vacOpen = false; renderVacation(); } })
    ]));
  }

  function unlockedIds() {
    var out = [], pts = S.points, th = CFG.plantUnlockPoints || [0, 0, 0, 5, 12, 22, 34, 48];
    Pl.UNLOCK_ORDER.forEach(function (id, i) { if (pts >= (th[i] || 0)) out.push(id); });
    return out;
  }
  function ensurePlants() {
    unlockedIds().forEach(function (id) { if (!S.plants[id]) S.plants[id] = { xp: 0, lastCare: careClock() }; });
  }
  function healthOf(id) {
    var p = S.plants[id]; if (!p) return 0;
    var hrs = Math.max(0, careClock() - p.lastCare) / 36e5;
    return hrs >= (CFG.sleepyAfterHours || 96) ? 2 : (hrs >= (CFG.thirstyAfterHours || 36) ? 1 : 0);
  }
  // a kind of plant is open once you have enough points, or if it is what that spot started with, or already chosen
  function varietyOpen(vid, slotId) {
    if (S.points >= Pl.unlockAt(vid)) return true;
    var s = Pl.SLOTS[slotId];
    return Pl.resolve(s, null).id === vid || (S.choice[slotId] === vid);
  }
  function stageOf(id) {
    var p = S.plants[id], xp = p ? p.xp : 0, st = 0;
    Pl.THRESHOLDS.forEach(function (t, i) { if (xp >= t) st = i; });
    return st;
  }
  function plantMap() {
    var m = {};
    Pl.SLOTS.forEach(function (s) { m[s.id] = { stage: 0, health: 0, unlocked: false }; });
    unlockedIds().forEach(function (id) { m[id] = { stage: stageOf(id), health: healthOf(id), unlocked: true, variety: S.choice[id] || null }; });
    return m;
  }
  // a finished task gives one plant a little care. Sleeping ones wake first.
  function pname(id) { return Pl.resolve(Pl.SLOTS[id], S.choice[id]).label; }
  function carePlant() {
    var ids = unlockedIds(); if (!ids.length) return;
    var pick = null, i;
    for (i = 0; i < ids.length && pick === null; i++) if (healthOf(ids[i]) === 2) pick = ids[i];
    for (i = 0; i < ids.length && pick === null; i++) if (healthOf(ids[i]) === 1) pick = ids[i];
    if (pick === null) {
      pick = ids.slice().sort(function (a, b) { return S.plants[a].xp - S.plants[b].xp; })[0];
      if (Math.random() < 0.4) pick = ids[Math.floor(Math.random() * ids.length)];
    }
    var was = healthOf(pick), before = stageOf(pick), p = S.plants[pick];
    p.xp += 1; p.lastCare = careClock();
    var grew = stageOf(pick) > before;
    scene && scene.sparkle(pick, grew || was === 2);
    sfx('sparkle');
    var name = pname(pick);
    if (was === 2) { sfx('wake'); toast('Your ' + name.toLowerCase() + ' woke right up. Thank you.'); }
    else if (grew) toast('Your ' + name.toLowerCase() + ' grew a little. Look at it go.');
    syncScene(); renderGarden();
  }
  function addPoints(n) {
    var before = unlockedIds();
    S.points += n;
    ensurePlants();
    setTimeout(function () { renderJar(n); }, 0);
    var now = unlockedIds();
    now.forEach(function (id) {
      if (before.indexOf(id) < 0) {
        toast('A new plant just moved in: ' + pname(id).toLowerCase() + '!');
        scene && setTimeout(function () { scene.sparkle(id, true); sfx('sparkle'); }, 400);
      }
    });
  }
  function touchStreak() {
    var today = dayKey(), st = S.streak;
    if (st.last === today) return;
    if (st.last && dayNum(today) - dayNum(st.last) <= 2) st.count += 1; else st.count = 1;
    st.last = today;
  }

  /* ---------- the scene ---------- */
  var scene = null, canvas = $('scene');
  function phaseHour() {
    var t = S.vibes.time;
    return t === 'auto' ? hourNow() : (Art.PHASE_HOURS[t] || 12.5);
  }
  function uiPhase(h) {
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }
  var timerState = { running: false, mode: 'focus', total: 0, startAt: 0, endAt: 0 };
  function syncScene() {
    if (!scene) return;
    var h = phaseHour();
    document.documentElement.setAttribute('data-phase', uiPhase(h));
    scene.setState({
      hour: h, weather: S.vibes.wx, fire: S.fireLit !== false, calm: !!S.calm, lights: S.lights || {},
      mode: timerState.running ? (timerState.mode === 'break' ? 'break' : 'focus') : 'idle',
      plants: plantMap(), player: S.char
    });
  }

  /* ---------- vibes ---------- */
  function buildChips(box, list, getVal, onPick) {
    box.innerHTML = '';
    list.forEach(function (c) {
      var b = el('button', { class: 'chip', type: 'button', text: c[1], 'aria-pressed': String(getVal() === c[0]), onclick: function () { onPick(c[0]); } });
      b.dataset.val = c[0];
      box.appendChild(b);
    });
  }
  function renderVibes() {
    buildChips($('time-chips'), TIME_CHIPS, function () { return S.vibes.time; }, function (v) { S.vibes.time = v; save(); renderVibes(); syncScene(); });
    buildChips($('wx-chips'), WX_CHIPS, function () { return S.vibes.wx; }, function (v) { S.vibes.wx = v; save(); renderVibes(); syncScene(); });
    $('calm').checked = !!S.calm;
  }
  $('calm').addEventListener('change', function () { S.calm = this.checked; save(); syncScene(); });

  /* ---------- timer ---------- */
  var RING = 326.73, ticker = 0;
  var LENS = { focus: [15, 25, 45, 60], break: [5, 10, 15] };
  var customOn = { focus: false, break: false };
  function fmt(sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m >= 100 ? m : pad(m)) + ':' + pad(s); }
  function curLen() { return S.timer[timerState.mode] || 25; }
  function renderTimerControls() {
    var mode = timerState.mode, run = timerState.running;
    Array.prototype.forEach.call($('mode-seg').children, function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
      b.disabled = run && b.dataset.mode !== mode;
    });
    var box = $('len-chips'); box.innerHTML = '';
    if (mode !== 'vibes') {
      LENS[mode].forEach(function (n) {
        var on = !customOn[mode] && curLen() === n;
        box.appendChild(el('button', { class: 'chip', type: 'button', text: n + ' min', 'aria-pressed': String(on), disabled: run, onclick: function () { customOn[mode] = false; S.timer[mode] = n; save(); renderTimerControls(); renderTimerFace(); } }));
      });
      box.appendChild(el('button', { class: 'chip', type: 'button', text: 'Custom', 'aria-pressed': String(customOn[mode]), disabled: run, onclick: function () { customOn[mode] = true; renderTimerControls(); $('len-custom').focus(); } }));
    }
    var isCustom = mode !== 'vibes' && (customOn[mode] || LENS[mode].indexOf(curLen()) < 0);
    if (isCustom) customOn[mode] = true;
    $('custom-wrap').hidden = !(isCustom && mode !== 'vibes');
    $('len-custom').value = curLen();
    $('len-custom').disabled = run;
    $('len-chips').hidden = mode === 'vibes';
    $('t-start').hidden = run;
    $('t-start').textContent = mode === 'vibes' ? 'Start vibing' : (mode === 'break' ? 'Start break' : 'Start focus');
    $('t-finish').hidden = !run;
    $('t-finish').textContent = mode === 'focus' ? 'Finish early' : 'Finish';
    $('t-reset').hidden = !run;
  }
  function renderTimerFace() {
    var mode = timerState.mode, sec, frac, sub;
    if (timerState.running) {
      var elapsed = (Date.now() - timerState.startAt) / 1000;
      if (mode === 'vibes') { sec = elapsed; frac = (elapsed % 3600) / 3600; sub = 'Just vibes, no goal'; }
      else { sec = Math.max(0, (timerState.endAt - Date.now()) / 1000); frac = 1 - sec / timerState.total; sub = mode === 'break' ? 'Stretch, sip, breathe' : 'Everyone in here is working too'; }
    } else {
      sec = mode === 'vibes' ? 0 : curLen() * 60; frac = 0;
      sub = mode === 'vibes' ? 'Count up, no goal' : 'Ready when you are';
    }
    $('time').textContent = fmt(sec);
    $('time-sub').textContent = sub;
    $('ring-fg').style.strokeDashoffset = String(RING * (1 - clamp01(frac)));
    document.title = timerState.running ? fmt(sec) + ' Little flow cafe' : 'Little flow cafe';
  }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function startTimer() {
    var mode = timerState.mode, now = Date.now();
    if (mode !== 'vibes') {
      var v = parseInt($('len-custom').value, 10);
      if (customOn[mode] && v >= 1 && v <= 180) S.timer[mode] = v;
    }
    timerState.running = true; timerState.startAt = now;
    timerState.total = mode === 'vibes' ? 0 : curLen() * 60;
    timerState.endAt = now + timerState.total * 1000;
    save(); syncScene(); renderTimerControls(); renderTimerFace();
    clearInterval(ticker); ticker = setInterval(tick, 250);
    sfx('pop');
  }
  function stopTimer() { timerState.running = false; clearInterval(ticker); renderTimerControls(); renderTimerFace(); syncScene(); }
  function tick() {
    if (!timerState.running) return;
    if (timerState.mode !== 'vibes' && Date.now() >= timerState.endAt) { completeTimer(true); return; }
    renderTimerFace();
  }
  function completeTimer(natural) {
    var mode = timerState.mode, mins = Math.round((Math.min(Date.now(), timerState.endAt || Date.now()) - timerState.startAt) / 60000);
    if (mode === 'vibes') mins = Math.round((Date.now() - timerState.startAt) / 60000);
    stopTimer();
    if (mode === 'focus') {
      if (mins >= 5 || natural) {
        mins = Math.max(mins, 1);
        S.sessions += 1; S.minutes += mins; touchStreak();
        addPoints(mins >= 45 ? 3 : 2);
        scene && scene.cheer();
        try { if (S.sfx && Audio.ready()) Audio.chime(); } catch (e) { /* ignore */ }
        toast('Focus time done. ' + mins + ' minutes in the cafe. Nice.', { ms: 7000, action: { label: 'Take a break', fn: function () { setMode('break'); startTimer(); } } });
        // water thirsty plants as a thank you
        unlockedIds().forEach(function (id) { if (healthOf(id) === 1) { S.plants[id].lastCare = careClock(); } });
        carePlant();
        nudgeJoin();
      } else toast('That was a short one, no worries. Try again when you are ready.');
    } else if (mode === 'break') {
      try { if (S.sfx && Audio.ready()) Audio.chime('break'); } catch (e) { /* ignore */ }
      toast('Break is over. Ready when you are.', { action: { label: 'Focus', fn: function () { setMode('focus'); } } });
    } else {
      if (mins >= 10) { S.minutes += 0; touchStreak(); addPoints(1); scene && scene.sparkle(unlockedIds()[0], false); toast('Thanks for hanging out. A plant noticed.'); }
      else toast('Come back any time.');
    }
    save(); renderGarden();
  }
  function setMode(m) {
    if (timerState.running) return;
    timerState.mode = m; renderTimerControls(); renderTimerFace();
  }
  Array.prototype.forEach.call($('mode-seg').children, function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  $('len-custom').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    if (v >= 1 && v <= 180 && timerState.mode !== 'vibes') { S.timer[timerState.mode] = v; save(); renderTimerFace(); }
  });
  $('t-start').addEventListener('click', startTimer);
  $('t-finish').addEventListener('click', function () { completeTimer(false); });
  $('t-reset').addEventListener('click', function () { stopTimer(); toast('Timer reset. No harm done.'); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { tick(); checkDay(); syncScene(); } });

  function nudgeJoin() {
    if (S.nudged || CFG.signup && CFG.signup.mode === 'off') return;
    S.nudged = true; save();
    setTimeout(function () {
      toast('Like it here? Get gentle check ins and prompts by email.', { ms: 9000, action: { label: 'Tell me more', fn: function () { $('join').scrollIntoView({ behavior: 'smooth', block: 'center' }); } } });
    }, 3500);
  }

  /* ---------- tasks ---------- */
  var editingId = null;
  function topTask(i) { return S.tasks.filter(function (t) { return t.top === i; })[0]; }
  function addTask(text, top) {
    text = (text || '').trim().slice(0, 120);
    if (!text) return;
    S.tasks.push({ id: uid(), text: text, done: false, top: top === undefined ? -1 : top, rewarded: false });
    save(); renderTasks();
  }
  function toggleTask(t) {
    t.done = !t.done;
    if (t.done && !t.rewarded) {
      t.rewarded = true; S.tasksDone += 1; touchStreak(); addPoints(1);
      sfx('chime', 'task');
      carePlant();
      var left = S.tasks.filter(function (x) { return !x.done; }).length;
      if (!left && S.tasks.length > 1) { scene && scene.cheer(); toast('Everything on your list is done. Wow.'); }
    }
    save(); renderTasks(); renderGarden();
  }
  function removeTask(t) { S.tasks = S.tasks.filter(function (x) { return x !== t; }); save(); renderTasks(); }
  function textButton(t) {
    if (editingId === t.id) {
      var inp = el('input', { class: 'edit', type: 'text', maxlength: '120', value: t.text, 'aria-label': 'Edit task' });
      function done(saveIt) {
        if (editingId !== t.id) return;
        editingId = null;
        var v = inp.value.trim();
        if (saveIt && v) t.text = v; else if (saveIt && !v) { removeTask(t); return; }
        save(); renderTasks();
      }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); done(true); } else if (e.key === 'Escape') { e.preventDefault(); done(false); } });
      inp.addEventListener('blur', function () { done(true); });
      setTimeout(function () { inp.focus(); inp.select(); }, 0);
      return inp;
    }
    return el('button', { class: 'text', type: 'button', text: t.text, title: 'Tap to edit', onclick: function () { editingId = t.id; renderTasks(); } });
  }
  function checkBtn(t) {
    return el('button', { class: 'check', type: 'button', 'aria-pressed': String(t.done), 'aria-label': (t.done ? 'Mark not done: ' : 'Mark done: ') + t.text, text: t.done ? '✓' : '', onclick: function () { toggleTask(t); } });
  }
  function renderTasks() {
    var top = $('top3'); top.innerHTML = '';
    [0, 1, 2].forEach(function (i) {
      var t = topTask(i), li;
      if (t) {
        li = el('li', { class: 'filled' + (t.done ? ' done' : '') }, [
          el('span', { class: 'slot-num', text: String(i + 1) }), checkBtn(t), textButton(t),
          el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move to everything else', title: 'Move down', text: '↓', onclick: function () { t.top = -1; save(); renderTasks(); } }),
          el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete task', title: 'Delete', text: '×', onclick: function () { removeTask(t); } })
        ]);
        if (t.done) li.querySelector('.text') && li.querySelector('.text').setAttribute('style', 'text-decoration: line-through; color: var(--muted)');
      } else {
        var inp = el('input', { type: 'text', maxlength: '120', placeholder: i === 0 ? 'What matters most today?' : 'Another good one', 'aria-label': 'Top task ' + (i + 1) });
        var f = el('form', { autocomplete: 'off', onsubmit: function (e) { e.preventDefault(); addTask(inp.value, i); } }, [inp]);
        li = el('li', {}, [el('span', { class: 'slot-num', text: String(i + 1) }), f]);
      }
      top.appendChild(li);
    });
    var list = $('tasklist'); list.innerHTML = '';
    var rest = S.tasks.filter(function (t) { return t.top < 0; });
    var free = [0, 1, 2].some(function (i) { return !topTask(i); });
    rest.forEach(function (t) {
      list.appendChild(el('li', { class: 'task' + (t.done ? ' done' : '') }, [
        checkBtn(t), textButton(t),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move to top 3', title: free ? 'Move to top 3' : 'Your top 3 is full', disabled: !free, text: '★', onclick: function () { for (var i = 0; i < 3; i++) if (!topTask(i)) { t.top = i; break; } save(); renderTasks(); } }),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete task', title: 'Delete', text: '×', onclick: function () { removeTask(t); } })
      ]));
    });
    $('task-count').textContent = rest.length ? '(' + rest.length + ')' : '';
    $('clear-done').hidden = !S.tasks.some(function (t) { return t.done; });
  }
  $('task-form').addEventListener('submit', function (e) { e.preventDefault(); addTask($('task-input').value, -1); $('task-input').value = ''; });
  $('clear-done').addEventListener('click', function () { S.tasks = S.tasks.filter(function (t) { return !t.done; }); save(); renderTasks(); });

  /* new day: bring leftovers along, or let them go */
  function checkDay() {
    var today = dayKey();
    if (S.day === today) return;
    var left = S.tasks.filter(function (t) { return !t.done; });
    if (!left.length) { S.tasks = []; S.day = today; save(); renderTasks(); return; }
    if (!$('modal-roll').hidden) return;
    var list = $('roll-list'); list.innerHTML = '';
    left.forEach(function (t) {
      var cb = el('input', { type: 'checkbox', checked: true }); cb.dataset.id = t.id;
      list.appendChild(el('li', {}, [el('label', {}, [cb, el('span', { text: t.text })])]));
    });
    openModal('modal-roll');
  }
  $('roll-keep').addEventListener('click', function () {
    var keep = {};
    Array.prototype.forEach.call($('roll-list').querySelectorAll('input'), function (cb) { if (cb.checked) keep[cb.dataset.id] = true; });
    S.tasks = S.tasks.filter(function (t) { return keep[t.id]; }).map(function (t) { t.top = -1; t.done = false; return t; });
    S.day = dayKey(); save(); renderTasks(); closeModal($('modal-roll'));
    toast('Fresh day. Your picks came along.');
  });
  $('roll-fresh').addEventListener('click', function () {
    S.tasks = []; S.day = dayKey(); save(); renderTasks(); closeModal($('modal-roll'));
    toast('Clean slate. Good morning.');
  });

  /* ---------- sounds ---------- */
  function applySound(id) {
    var s = S.sounds[id];
    try { Audio.setLayer(id, !!s.on, s.vol); } catch (e) { /* ignore */ }
  }
  function applyAllSound() {
    try { Audio.setMaster(S.master, S.muted); Audio.setSfx(S.sfx, S.master); } catch (e) { /* ignore */ }
    SOUNDS.forEach(function (s) { applySound(s.id); });
  }
  function renderSounds() {
    var box = $('sound-rows'); box.innerHTML = '';
    SOUNDS.forEach(function (d) {
      var s = S.sounds[d.id];
      var sw = el('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(!!s.on), 'aria-label': d.label, id: 'sw-' + d.id });
      var vol = el('input', { type: 'range', min: '0', max: '100', value: String(Math.round(s.vol * 100)), 'aria-label': d.label + ' volume' });
      sw.addEventListener('click', function () {
        s.on = !s.on; sw.setAttribute('aria-checked', String(s.on)); applySound(d.id);
        if (d.id === 'fire') syncScene();
        save();
      });
      vol.addEventListener('input', function () { s.vol = vol.value / 100; applySound(d.id); save(); });
      box.appendChild(el('div', { class: 'sound-row' }, [sw, el('label', { for: 'sw-' + d.id }, [d.label, el('small', { text: d.hint })]), vol]));
    });
    $('master-vol').value = String(Math.round(S.master * 100));
    $('sfx').checked = !!S.sfx;
    renderMute();
  }
  function renderMute() {
    var b = $('btn-mute');
    b.setAttribute('aria-pressed', String(!!S.muted));
    b.textContent = S.muted ? 'Sound off' : 'Sound on';
  }
  $('btn-mute').addEventListener('click', function () { S.muted = !S.muted; renderMute(); applyAllSound(); save(); });
  $('master-vol').addEventListener('input', function () { S.master = this.value / 100; applyAllSound(); save(); });
  $('sfx').addEventListener('change', function () { S.sfx = this.checked; applyAllSound(); save(); });
  function toggleLight(h) {
    S.lights = S.lights || {};
    var on = S.lights[h.id] === false;       // it was off, so this tap turns it on
    S.lights[h.id] = on;
    syncScene(); save(); sfx('pop');
    toast(on ? (h.name + ' is on.') : (h.name + ' is off.'));
  }
  function toggleFire() {
    S.fireLit = S.fireLit === false; syncScene(); save();
    toast(S.fireLit ? 'The fire is lit.' : 'The fire is resting.');
  }

  /* ---------- garden ---------- */
  function renderGarden() {
    var ul = $('plant-list'); ul.innerHTML = '';
    var ids = unlockedIds();
    ids.forEach(function (id) {
      var h = healthOf(id), st = stageOf(id), s = Pl.SLOTS[id];
      var cur = Pl.resolve(s, S.choice[id]).id;
      var sel = el('select', { class: 'plant-pick', 'aria-label': 'Plant type for plant ' + (ids.indexOf(id) + 1) });
      Pl.varietiesFor(s).forEach(function (v) {
        var open = varietyOpen(v.id, id), o = el('option', { value: v.id, text: open ? v.label : v.label + ' (unlocks at ' + Pl.unlockAt(v.id) + ')' });
        if (!open) o.disabled = true;
        if (v.id === cur) o.selected = true; sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        S.choice[id] = sel.value; syncScene(); save(); sfx('pop');
        if (scene) scene.sparkle(id, false);
        toast('Swapped for a ' + Pl.resolve(s, sel.value).label.toLowerCase() + '.');
      });
      ul.appendChild(el('li', {}, [el('span', { class: 'dot h' + h }), sel, el('small', { text: STAGE_NAMES[st] + ', ' + HEALTH_NAMES[h].toLowerCase() })]));
    });
    var th = CFG.plantUnlockPoints || [], nextIdx = ids.length;
    var u = $('unlock'); u.innerHTML = '';
    if (nextIdx < Pl.UNLOCK_ORDER.length) {
      var need = th[nextIdx], prev = th[nextIdx - 1] || 0, next = 'A new plant';
      u.appendChild(el('div', { text: next + ' moves in at ' + need + ' points (' + Math.max(0, need - S.points) + ' to go). Finished tasks count 1, focus sessions count 2.' }));
      var bar = el('div', { class: 'bar' }, [el('span', { style: 'width:' + Math.round(clamp01((S.points - prev) / Math.max(1, need - prev)) * 100) + '%' })]);
      u.appendChild(bar);
    } else u.appendChild(el('div', { text: 'The whole garden has moved in. Lovely.' }));
    var st = $('stats'); st.innerHTML = '';
    [[S.tasksDone, 'Tasks finished'], [S.sessions, 'Focus sessions'], [S.minutes, 'Minutes focused'], [S.streak.count, S.streak.count === 1 ? 'Day in the cafe' : 'Days in the cafe']].forEach(function (x) {
      st.appendChild(el('div', { class: 'stat' }, [el('b', { text: String(x[0]) }), el('span', { text: x[1] })]));
    });
    var tc = $('today-card');
    if (S.daily.day === dayKey() && S.daily.picked >= 0 && CARDS[S.daily.picked]) { tc.hidden = false; tc.textContent = 'Today’s card: ' + CARDS[S.daily.picked][0]; }
    else tc.hidden = true;
  }
  function waterOne(id, delay) {
    setTimeout(function () { scene && scene.water(id); sfx('water'); }, delay || 0);
    S.plants[id].lastCare = careClock();
  }
  function tapPlant(id) {
    var h = healthOf(id), name = pname(id);
    if (h === 1) { waterOne(id); toast('Your ' + name.toLowerCase() + ' says thank you.'); syncScene(); renderGarden(); save(); }
    else if (h === 2) toast('Your ' + name.toLowerCase() + ' is napping. Finishing a task will wake it up.');
    else { scene && scene.sparkle(id, false); sfx('pop'); toast('Your ' + name.toLowerCase() + ' is doing great.'); }
  }


  /* ---------- star jar: every point is a colorful star ---------- */
  var STAR_COLS = ['#ff6a9a', '#ffb52e', '#7ac96b', '#5aa9e6', '#a77be0', '#ff8a4a', '#3fc7b0', '#f25f5c'];
  var JAR_MAX = 150, jarAnim = 0, jarShown = -1;
  function jarRand(i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
  function starPos(i, n) {
    var big = (n || 0) <= 64, cols = big ? 8 : 11, sp = big ? 18 : 14, rh = big ? 16 : 13, x0 = big ? 48 : 40;
    var r = Math.floor(i / cols), c = i % cols;
    return { x: x0 + c * sp + (r % 2 ? sp / 2 : 0) + (jarRand(i, 1) - 0.5) * 4, y: 212 - r * rh + (jarRand(i, 2) - 0.5) * 3, rot: jarRand(i, 3) * 1.2, col: STAR_COLS[i % STAR_COLS.length], rad: big ? 9.5 : 7.2 };
  }
  function drawStar(g, x, y, r, rot, col) {
    g.beginPath();
    for (var k = 0; k < 10; k++) { var rr = k % 2 ? r * 0.45 : r, an = -Math.PI / 2 + rot + k * Math.PI / 5; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
    g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 0.8; g.strokeStyle = 'rgba(120,70,60,0.35)'; g.stroke();
    g.beginPath(); g.arc(x - r * 0.18, y - r * 0.22, r * 0.18, 0, 6.2832); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
  }
  function jarPath(g) {
    g.beginPath(); g.moveTo(54, 52); g.lineTo(166, 52); g.quadraticCurveTo(166, 66, 182, 78); g.quadraticCurveTo(190, 86, 190, 104);
    g.lineTo(190, 206); g.quadraticCurveTo(190, 228, 168, 228); g.lineTo(52, 228); g.quadraticCurveTo(30, 228, 30, 206);
    g.lineTo(30, 104); g.quadraticCurveTo(30, 86, 38, 78); g.quadraticCurveTo(54, 66, 54, 52); g.closePath();
  }
  function paintJar(n, fall) {
    var cv = $('jar'); if (!cv) return; var g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    // back of the glass
    jarPath(g); g.fillStyle = 'rgba(214,236,242,0.35)'; g.fill();
    g.save(); jarPath(g); g.clip();
    var shown = Math.min(n, JAR_MAX);
    for (var i = 0; i < shown; i++) { var p = starPos(i, shown); drawStar(g, p.x, p.y, p.rad, p.rot, p.col); }
    if (fall) { drawStar(g, fall.x, fall.y, fall.rad, fall.rot, fall.col); }
    g.restore();
    // glass rim, shine and lid
    jarPath(g); g.lineWidth = 2.2; g.strokeStyle = 'rgba(120,170,185,0.75)'; g.stroke();
    g.beginPath(); g.moveTo(44, 110); g.quadraticCurveTo(40, 160, 44, 205); g.lineWidth = 4; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke();
    g.beginPath(); g.moveTo(178, 120); g.lineTo(178, 150); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.stroke();
    g.beginPath(); var rx = 46, ry = 22, rw = 128, rh = 30, rr = 9;
    g.moveTo(rx + rr, ry); g.arcTo(rx + rw, ry, rx + rw, ry + rh, rr); g.arcTo(rx + rw, ry + rh, rx, ry + rh, rr); g.arcTo(rx, ry + rh, rx, ry, rr); g.arcTo(rx, ry, rx + rw, ry, rr); g.closePath();
    g.fillStyle = '#d9a566'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#a8743e'; g.stroke();
    g.fillStyle = 'rgba(255,240,205,0.45)'; g.fillRect(rx + 8, ry + 5, rw - 16, 3);
    g.strokeStyle = 'rgba(140,90,45,0.4)'; g.lineWidth = 1; [14, 24].forEach(function (yy) { g.beginPath(); g.moveTo(rx + 12, ry + yy); g.lineTo(rx + rw - 30, ry + yy); g.stroke(); });
    // a little heart tag
    g.fillStyle = '#ff7a9a'; g.beginPath(); g.moveTo(110, ry + 24); g.bezierCurveTo(96, ry + 12, 104, ry + 4, 110, ry + 11); g.bezierCurveTo(116, ry + 4, 124, ry + 12, 110, ry + 24); g.fill();
  }
  function renderJar(dropCount) {
    var n = S.points;
    var txt = $('jar-text');
    if (txt) {
      var ids = unlockedIds().length, th = CFG.plantUnlockPoints || [];
      txt.textContent = n === 0 ? 'Finish a task or a focus session to drop in your first star.'
        : n + (n === 1 ? ' star' : ' stars') + (ids < Pl.UNLOCK_ORDER.length ? '. ' + Math.max(0, th[ids] - n) + ' more until a new plant moves in.' : '. The whole garden has moved in.');
    }
    if (dropCount > 0 && n > 0 && !(S.calm)) {
      var token = ++jarAnim, start = Date.now(), tgt = starPos(Math.min(n - 1, JAR_MAX - 1), Math.min(n, JAR_MAX)), col = tgt.col, base = Math.max(0, n - 1);
      (function step() {
        if (token !== jarAnim) return;
        var tt = Math.min(1, (Date.now() - start) / 700), e = tt < 1 ? tt * tt : 1;
        var y = -10 + (tgt.y + 10) * e - (tt > 0.85 ? Math.sin((tt - 0.85) / 0.15 * Math.PI) * 6 : 0);
        paintJar(base, { x: tgt.x, y: y, rot: tgt.rot + (1 - tt) * 3, col: col, rad: tgt.rad });
        if (tt < 1) requestAnimationFrame(step); else paintJar(n);
      })();
    } else paintJar(n);
    jarShown = n;
  }

  /* ---------- greenhouse: every plant, plus the collection to unlock ---------- */
  function houseCanvas(w, h) { return el('canvas', { width: String(w), height: String(h), class: 'house-cv', 'aria-hidden': 'true' }); }
  function renderGreenhouse() {
    var ids = unlockedIds(), th = CFG.plantUnlockPoints || [];
    var kinds = Pl.VARIETIES.filter(function (v) { return S.points >= Pl.unlockAt(v.id); }).length;
    $('house-lead').textContent = ids.length + ' of ' + Pl.SLOTS.length + ' plants have moved in, and you have found ' + kinds + ' of ' + Pl.VARIETIES.length + ' kinds. Finished tasks count 1 point, focus sessions count 2.';
    var grid = $('house-grid'); grid.innerHTML = '';
    var draws = [];
    Pl.UNLOCK_ORDER.forEach(function (id, i) {
      var s = Pl.SLOTS[id], open = ids.indexOf(id) >= 0, cv = houseCanvas(140, 150);
      var card = el('div', { class: 'house-card' + (open ? '' : ' locked') }, [cv]);
      if (open) {
        var rv = Pl.resolve(s, S.choice[id]), hh = healthOf(id), st = stageOf(id);
        card.appendChild(el('b', { text: rv.label }));
        card.appendChild(el('small', { text: STAGE_NAMES[st] + ', ' + HEALTH_NAMES[hh].toLowerCase() }));
        if (hh === 1) card.appendChild(el('button', { class: 'btn', type: 'button', text: 'Give water', onclick: function () { waterOne(id); toast('Your ' + rv.label.toLowerCase() + ' says thank you.'); syncScene(); renderGarden(); save(); renderGreenhouse(); } }));
        draws.push(function () { Pl.drawSample(cv, s, rv.id, st, hh, 0, false); });
      } else {
        card.appendChild(el('b', { text: 'A new plant' }));
        card.appendChild(el('small', { text: 'Moves in at ' + (th[i] || 0) + ' points' }));
        draws.push(function () { Pl.drawSample(cv, s, Pl.resolve(s, null).id, 3, 0, 0, true); });
      }
      grid.appendChild(card);
    });
    var coll = $('house-coll'); coll.innerHTML = '';
    $('house-coll-note').textContent = 'New kinds unlock as your points grow. Swap any plant to an unlocked kind from the Your plants list.';
    Pl.VARIETIES.slice().sort(function (a, b) { return Pl.unlockAt(a.id) - Pl.unlockAt(b.id); }).forEach(function (v) {
      var open = S.points >= Pl.unlockAt(v.id), cv = houseCanvas(140, 150);
      var tmpl = null;
      coll.appendChild(el('div', { class: 'house-card' + (open ? '' : ' locked') }, [cv,
        el('b', { text: open ? v.label : '???' }),
        el('small', { text: open ? 'Unlocked' : 'Unlocks at ' + Pl.unlockAt(v.id) + ' points' })]));
      draws.push(function () { Pl.drawSample(cv, tmpl, v.id, 3, 0, 0, !open); });
    });
    draws.forEach(function (f) { try { f(); } catch (e) { /* a missing sprite should not break the list */ } });
  }
  function openGreenhouse() { renderGreenhouse(); openModal('modal-house'); }
  function applyBig() {
    var m = document.querySelector('.layout'); if (!m) return;
    m.classList.toggle('big', !!S.big);
    var b = $('btn-big'); if (b) { b.setAttribute('aria-pressed', String(!!S.big)); b.textContent = S.big ? 'Smaller view' : 'Big view'; }
  }
  $('btn-big').addEventListener('click', function () { S.big = !S.big; applyBig(); save(); });
  applyBig();
  $('btn-house').addEventListener('click', openGreenhouse);
  $('open-house').addEventListener('click', openGreenhouse);
  $('water-all').addEventListener('click', function () {
    var ids = unlockedIds(), thirsty = ids.filter(function (id) { return healthOf(id) === 1; }), asleep = ids.filter(function (id) { return healthOf(id) === 2; });
    thirsty.forEach(function (id, i) { waterOne(id, i * 450); });
    if (thirsty.length) { toast('Everyone thirsty got a drink.'); syncScene(); renderGarden(); save(); }
    else if (asleep.length) toast('Everyone awake is happy. Finish a task to wake the sleepy ones.');
    else toast('Everyone is all set.');
  });

  /* ---------- character creator ---------- */
  function swatchRow(label, colors, getVal, onPick, names) {
    var fs = el('fieldset', {}, [el('legend', { text: label })]);
    var row = el('div', { class: 'swatches' });
    colors.forEach(function (c, i) {
      var b = el('button', { class: 'swatch', type: 'button', style: 'background:' + c, 'aria-label': (names ? names[i] : label + ' ' + (i + 1)), 'aria-pressed': String(getVal() === i), onclick: function () { onPick(i); } });
      row.appendChild(b);
    });
    fs.appendChild(row); return fs;
  }
  function chipRow(label, items, getVal, onPick, group) {
    var fs = el('fieldset', {}, [el('legend', { text: label })]);
    var groups = {}, order = [];
    items.forEach(function (it) { var g = group ? it.group : ''; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(it); });
    order.forEach(function (g) {
      if (g) fs.appendChild(el('div', { class: 'sub-legend', text: g }));
      var row = el('div', { class: 'chips' });
      groups[g].forEach(function (it) {
        row.appendChild(el('button', { class: 'chip', type: 'button', text: it.label, 'aria-pressed': String(getVal() === it.id), onclick: function () { onPick(it.id); } }));
      });
      fs.appendChild(row);
    });
    return fs;
  }
  function checkRow(label, getVal, onSet) {
    var cb = el('input', { type: 'checkbox' }); cb.checked = !!getVal();
    cb.addEventListener('change', function () { onSet(cb.checked); });
    return el('label', { class: 'check-line' }, [cb, label]);
  }
  function changeChar(patch) {
    for (var k in patch) S.char[k] = patch[k];
    S.char = Pe.cleanSpec(S.char); S.hasChar = true;
    save(); drawPreview(); syncScene(); renderCharControls();
  }
  function drawPreview() { Pe.drawPreview($('char-preview'), S.char, 0); $('char-name').value = S.char.name === 'You' ? $('char-name').value : S.char.name; }
  function renderCharControls() {
    var O = Pe.Options, c = S.char, box = $('char-controls');
    var keepScroll = box.scrollTop, active = document.activeElement && document.activeElement.closest && document.activeElement.closest('#char-controls') ? document.activeElement : null;
    var focusIdx = active ? Array.prototype.indexOf.call(box.querySelectorAll('button, input'), active) : -1;
    box.innerHTML = '';
    box.appendChild(swatchRow('Skin tone', O.skin, function () { return c.skin; }, function (i) { changeChar({ skin: i }); }, O.skin.map(function (_, i) { return 'Skin tone ' + (i + 1); })));
    box.appendChild(chipRow('Hair style', O.hairStyles, function () { return c.hair; }, function (id) { changeChar({ hair: id }); }, true));
    box.appendChild(swatchRow('Hair color', O.hairColors, function () { return c.hairColor; }, function (i) { changeChar({ hairColor: i }); }, O.hairColorNames));
    box.appendChild(chipRow('Body shape', O.bodies, function () { return c.body; }, function (id) { changeChar({ body: id }); }));
    box.appendChild(chipRow('Outfit', O.outfits, function () { return c.outfit; }, function (id) { changeChar({ outfit: id }); }));
    box.appendChild(swatchRow('Outfit color', O.outfitColors, function () { return c.outfitColor; }, function (i) { changeChar({ outfitColor: i }); }, O.outfitColors.map(function (_, i) { return 'Outfit color ' + (i + 1); })));
    box.appendChild(chipRow('Glasses', O.glasses, function () { return c.glasses; }, function (id) { changeChar({ glasses: id }); }));
    box.appendChild(chipRow('Facial hair', O.facial, function () { return c.facial; }, function (id) { changeChar({ facial: id }); }));
    box.appendChild(chipRow('Face details', O.details, function () { return c.detail; }, function (id) { changeChar({ detail: id }); }));
    box.appendChild(chipRow('Hair extras', O.hairAcc, function () { return c.hairAcc; }, function (id) { changeChar({ hairAcc: id }); }));
    var ex = el('fieldset', {}, [el('legend', { text: 'Little extras' }),
      checkRow('Headphones', function () { return c.headphones; }, function (v) { changeChar({ headphones: v }); }),
      checkRow('Hearing aids', function () { return c.hearing; }, function (v) { changeChar({ hearing: v }); })]);
    box.appendChild(ex);
    box.appendChild(chipRow('Seat', O.seats, function () { return c.seat; }, function (id) { changeChar({ seat: id }); }));
    box.scrollTop = keepScroll;
    if (focusIdx >= 0) { var n = box.querySelectorAll('button, input')[focusIdx]; if (n) n.focus({ preventScroll: true }); }
  }
  $('char-name').addEventListener('input', function () { S.char.name = (this.value.trim() || 'You').slice(0, 14); S.hasChar = true; save(); syncScene(); });
  $('char-random').addEventListener('click', function () {
    var r = Pe.randomSpec(); r.name = S.char.name; S.char = Pe.cleanSpec(r); S.hasChar = true;
    save(); drawPreview(); syncScene(); renderCharControls(); sfx('pop');
  });
  function openCharacter() { renderCharControls(); drawPreview(); openModal('modal-char'); }
  $('btn-char').addEventListener('click', openCharacter);
  if ($('btn-char2')) $('btn-char2').addEventListener('click', openCharacter);

  /* ---------- daily card ---------- */
  var todaysCards = null;
  function pickToday() {
    var key = dayKey(), rnd = seeded('cafe-' + key);
    var sweet = [], sassy = [];
    CARDS.forEach(function (c, i) { (c[1] === 'sassy' ? sassy : sweet).push(i); });
    function take(arr) { return arr.splice(Math.floor(rnd() * arr.length), 1)[0]; }
    var a = take(sweet), b = take(sassy), rest = sweet.concat(sassy), c = take(rest);
    var out = [a, b, c];
    for (var i = out.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = out[i]; out[i] = out[j]; out[j] = t; }
    return out;
  }
  function renderCards() {
    todaysCards = pickToday();
    var grid = $('pick-grid'); grid.innerHTML = '';
    var picked = S.daily.day === dayKey() ? S.daily.picked : -1;
    todaysCards.forEach(function (ci, pos) {
      var c = CARDS[ci];
      var btn = el('button', { class: 'pcard', type: 'button', 'aria-label': 'Card ' + (pos + 1) + ', face down' }, [
        el('div', { class: 'inner' }, [
          el('div', { class: 'face back' }, [el('span', { class: 'star', text: '✦' })]),
          el('div', { class: 'face front' }, [el('span', { class: 'kind', text: c[1] === 'sassy' ? 'A little sass' : 'A little sweet' }), el('span', { text: c[0] })])
        ])
      ]);
      btn.dataset.ci = ci;
      btn.addEventListener('click', function () { flipCard(btn, ci); });
      grid.appendChild(btn);
    });
    var done = picked >= 0;
    $('cards-actions').hidden = !done;
    $('card-peek').hidden = !done;
    $('cards-lead').textContent = done ? 'Here is your card for today.' : 'Take a breath, then choose the one that calls to you.';
    $('cards-note').textContent = done ? 'A fresh set of cards arrives tomorrow.' : '';
    if (done) Array.prototype.forEach.call(grid.children, function (b) {
      if (+b.dataset.ci === picked) { b.classList.add('flipped'); b.setAttribute('aria-label', 'Your card: ' + CARDS[picked][0]); }
      else b.classList.add('dim');
    });
  }
  function flipCard(btn, ci) {
    if (S.daily.day === dayKey() && S.daily.picked >= 0) return;
    S.daily.day = dayKey(); S.daily.picked = ci; touchStreak(); save();
    btn.classList.add('flipped'); btn.setAttribute('aria-label', 'Your card: ' + CARDS[ci][0]);
    Array.prototype.forEach.call($('pick-grid').children, function (b) { if (b !== btn) b.classList.add('dim'); });
    sfx('flip'); sfx('sparkle');
    $('cards-lead').textContent = 'Here is your card for today.';
    $('cards-actions').hidden = false; $('card-peek').hidden = false;
    $('cards-note').textContent = 'A fresh set of cards arrives tomorrow.';
    scene && scene.emit('spark', 330, 240, 12, { spread: 30, speed: 24, life: 1.2 });
    renderGarden();
  }
  $('card-peek').addEventListener('click', function () {
    Array.prototype.forEach.call($('pick-grid').children, function (b) { b.classList.add('flipped'); b.classList.remove('dim'); b.setAttribute('aria-label', CARDS[+b.dataset.ci][0]); });
    $('card-peek').hidden = true; sfx('flip');
  });
  $('card-copy').addEventListener('click', function () {
    var text = CARDS[S.daily.picked] ? CARDS[S.daily.picked][0] : '';
    function ok() { toast('Copied. Share it with someone.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { toast(text); });
    else { var ta = el('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast(text); } document.body.removeChild(ta); }
  });
  function openCards() { renderCards(); openModal('modal-cards'); }
  $('btn-cards').addEventListener('click', openCards);

  /* ---------- newsletter ---------- */
  function setupSignup() {
    var cfg = CFG.signup || { mode: 'off' };
    $('su-consent').textContent = CFG.consentText || '';
    if (cfg.mode === 'off') { $('join').hidden = true; $('btn-join').hidden = true; return; }
    var form = $('signup'), status = $('su-status');
    form.setAttribute('name', cfg.formName || 'cafe-newsletter');
    form.querySelector('[name="form-name"]').value = cfg.formName || 'cafe-newsletter';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('su-email').value.trim();
      status.className = 'status';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { status.className = 'status err'; status.textContent = 'That email looks a little off. Mind checking it?'; return; }
      if (form.querySelector('[name="bot-field"]').value) return;
      $('su-btn').disabled = true; status.textContent = 'One moment...';
      var req;
      if (cfg.mode === 'webhook' && cfg.webhookUrl) {
        req = fetch(cfg.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, source: 'little-flow-cafe', consent: true, consentText: CFG.consentText || '' }) });
      } else {
        var body = new URLSearchParams({ 'form-name': cfg.formName || 'cafe-newsletter', email: email, 'bot-field': '' }).toString();
        req = fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
      }
      req.then(function (r) {
        if (!r.ok) throw new Error('bad');
        status.className = 'status'; status.textContent = 'You are in! Watch your inbox for a first hello.';
        form.reset(); toast('Welcome to the community.');
      }).catch(function () {
        status.className = 'status err';
        status.textContent = 'Signups only work once the cafe is live on Netlify. Please try again after it is published.';
      }).then(function () { $('su-btn').disabled = false; });
    });
  }

  /* ---------- clicking and hovering the scene ---------- */
  var tip = $('tip');
  function toCanvas(ev) {
    var r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (Art.W / r.width), y: (ev.clientY - r.top) * (Art.H / r.height), s: r.width / Art.W };
  }
  function tipText(h) {
    switch (h.type) {
      case 'plant': var hl = healthOf(h.id); return pname(h.id) + (hl === 1 ? ', thirsty. Tap to water' : (hl === 2 ? ', napping' : ', happy'));
      case 'player': return 'You. Tap to change your look';
      case 'npc': return h.name;
      case 'cat': return 'Biscuit. Tap to pet';
      case 'dog': return 'Waffles';
      case 'pebble': return 'Pebble, napping';
      case 'cards': return 'Daily card nook';
      case 'fire': return S.fireLit !== false ? 'Tap to rest the fire' : 'Tap to light the fire';
      case 'clock': return 'The cafe clock';
      case 'window': return 'Tap to change the weather';
      case 'books': return 'Good books for your break';
      case 'avocado': return 'The avocado chair';
      case 'tomato': return 'Sliced tomato side table';
      case 'barista': return 'Pia, your barista';
      case 'counter': return 'Fresh from the oven';
      case 'sign': return 'Cafe menu';
      case 'light': return h.name + (S.lights && S.lights[h.id] === false ? ': tap to turn on' : ': tap to turn off');
      default: return '';
    }
  }
  canvas.addEventListener('mousemove', function (ev) {
    if (!scene) return;
    var p = toCanvas(ev), h = scene.hit(p.x, p.y);
    scene.hover = h;
    canvas.style.cursor = h ? 'pointer' : 'default';
    if (h) {
      tip.hidden = false; tip.textContent = tipText(h);
      var wrap = $('scene-wrap').getBoundingClientRect().width;
      var cx = (h.rect.x + h.rect.w / 2) * p.s, ty = h.rect.y * p.s - 8;
      cx = Math.max(70, Math.min(wrap - 70, cx));
      tip.style.left = cx + 'px'; tip.style.top = Math.max(26, ty) + 'px'; tip.style.transform = 'translate(-50%, -100%)';
    } else tip.hidden = true;
  });
  canvas.addEventListener('mouseleave', function () { if (scene) scene.hover = null; tip.hidden = true; });
  canvas.addEventListener('click', function (ev) {
    if (!scene) return;
    var p = toCanvas(ev), h = scene.hit(p.x, p.y);
    if (!h) return;
    switch (h.type) {
      case 'plant': tapPlant(h.id); break;
      case 'player': scene.heartAtPlayer(); openCharacter(); break;
      case 'npc': scene.waveAt(h.id); sfx('pop'); break;
      case 'cat': scene.petCat(); sfx('purr'); break;
      case 'dog': scene.emit('heart', h.rect.x + 14, h.rect.y, 3, { spread: 6 }); sfx('pop'); toast('Waffles wiggled a little in his sleep.'); break;
      case 'pebble': scene.emit('heart', h.rect.x + 12, h.rect.y, 3, { spread: 6 }); sfx('purr'); break;
      case 'cards': openCards(); break;
      case 'fire': toggleFire(); break;
      case 'light': toggleLight(h); break;
      case 'clock': var d = new Date(); toast('It is ' + (d.getHours() % 12 || 12) + ':' + pad(d.getMinutes()) + (d.getHours() < 12 ? ' am' : ' pm') + ' where you are.'); break;
      case 'window':
        var order = ['clear', 'cloudy', 'rain', 'snow'], nx = order[(order.indexOf(S.vibes.wx) + 1) % order.length];
        S.vibes.wx = nx; save(); renderVibes(); syncScene(); sfx('pop'); break;
      case 'books': toast('Save a good book for your next break.'); break;
      case 'avocado': scene.hugAvocado(); sfx('purr'); toast('The avocado chair gives the best hugs.'); break;
      case 'tomato': sfx('pop'); toast('Sliced tomato, extra cozy.'); break;
      case 'barista': scene.waveBarista(); sfx('pop'); toast('Pia slides over something warm. Take your time.'); break;
      case 'counter': sfx('pop'); toast('Fresh pastries, all made this morning.'); break;
      case 'sign': sfx('pop'); toast('Today: slow mornings and warm cups.'); break;
      default: break;
    }
  });

  /* ---------- loop ---------- */
  var lastDraw = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    var gap = S.calm ? 90 : 33;
    if (now - lastDraw < gap) return;
    lastDraw = now;
    try { scene.frame(now); } catch (e) { /* keep the cafe running */ }
  }

  /* ---------- start ---------- */
  /* ---------- accounts and cloud saving (optional, Supabase) ---------- */
  var cloudTimer = 0, syncing = false;
  function cloudSoon() {
    if (!Auth || !Auth.user()) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(function () { Auth.push(S); }, 4000);
  }
  function friendly(err) {
    var m = String(err || '').toLowerCase();
    if (m === 'not-ready') return 'We could not reach the sign in service. Please try again in a moment.';
    if (m.indexOf('rate') >= 0 || m.indexOf('seconds') >= 0) return 'That was a lot of emails at once. Please wait a minute and try again.';
    if (m.indexOf('signups not allowed') >= 0 || m.indexOf('not found') >= 0) return 'We could not find that email. Try signing up instead.';
    if (m.indexOf('expired') >= 0 || m.indexOf('invalid') >= 0) return 'That code did not work. Check it and try again, or ask for a new one.';
    return 'Something went wrong. Please try again.';
  }
  function setupAuth() {
    var configured = !!(Auth && Auth.configured());
    var msgEl = $('auth-msg'), pending = '', enter = $('enter');
    $('acct-consent').textContent = CFG.accountConsent || 'By signing up, you agree to join the Flow State community newsletter. You are welcome to unsubscribe after the first issue!';
    function say(t) { msgEl.textContent = t || ''; }
    function showTab(name) {
      Array.prototype.forEach.call($('auth-tabs').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tab') === name)); });
      $('auth-signup').hidden = name !== 'signup'; $('auth-login').hidden = name !== 'login'; $('auth-code').hidden = true; $('auth-tabs').hidden = false; say('');
    }
    Array.prototype.forEach.call($('auth-tabs').querySelectorAll('button'), function (b) { b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); }); });
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function guard() {
      if (configured) return true;
      say('Accounts are opening soon. For now, step inside as a guest and everything saves on this device.');
      return false;
    }
    function showCode(email) {
      pending = email;
      $('auth-signup').hidden = true; $('auth-login').hidden = true; $('auth-tabs').hidden = true; $('auth-code').hidden = false;
      $('auth-sent').textContent = 'We sent a sign in link and a code to ' + email + '. Tap the link in the email, or type the code here.';
      say(''); setTimeout(function () { $('code-in').focus(); }, 50);
    }
    function busy(form, on) { var b = form.querySelector('button[type="submit"]'); if (b) b.disabled = on; }
    $('auth-signup').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var first = $('su-first').value.trim(), last = $('su-last').value.trim(), email = $('su-mail').value.trim();
      if (!first || !last) { say('Please add your first and last name.'); return; }
      if (!validEmail(email)) { say('That email does not look quite right.'); return; }
      if (!guard()) return;
      busy(this, true); say('One moment...');
      var f = this;
      Auth.signUp(first, last, email).then(function (r) { busy(f, false); if (r.error) say(friendly(r.error)); else showCode(email); });
    });
    $('auth-login').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = $('li-mail').value.trim();
      if (!validEmail(email)) { say('That email does not look quite right.'); return; }
      if (!guard()) return;
      busy(this, true); say('One moment...');
      var f = this;
      Auth.logIn(email).then(function (r) { busy(f, false); if (r.error) say(friendly(r.error)); else showCode(email); });
    });
    $('auth-code').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var code = $('code-in').value.replace(/\s+/g, '');
      if (code.length < 6) { say('The code has 6 digits.'); return; }
      busy(this, true); say('Checking...');
      var f = this;
      Auth.verify(pending, code).then(function (r) { busy(f, false); if (r.error) say(friendly(r.error)); else say('You are in!'); });
    });
    $('code-back').addEventListener('click', function () { showTab('signup'); });
    function logout() {
      Auth.push(S).then(function () { return Auth.signOut(); }).then(function () {
        try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
        window.location.reload();
      });
    }
    $('auth-out').addEventListener('click', logout);
    $('btn-logout').addEventListener('click', logout);
    $('btn-acct').addEventListener('click', function () {
      $('splash').hidden = false; document.body.classList.add('modal-open');
      var f = $('su-first'); if (f) f.focus();
    });
    function render() {
      var u = Auth && Auth.user();
      if (u) {
        var nm = Auth.firstName();
        $('auth').hidden = true; $('auth-in').hidden = false;
        $('auth-hello').textContent = 'Welcome back' + (nm ? ', ' + nm : '');
        enter.className = 'btn primary big'; enter.textContent = 'Step inside';
        $('btn-logout').hidden = false; $('btn-acct').hidden = true;
      } else {
        $('auth').hidden = false; $('auth-in').hidden = true;
        enter.className = 'btn guest'; enter.textContent = 'Or step inside as a guest. Your cafe saves on this device';
        $('btn-logout').hidden = true; $('btn-acct').hidden = !configured;
      }
    }
    function afterAuth() {
      render();
      if (syncing) return; syncing = true;
      Auth.pull().then(function (row) {
        if (row && row.data && (row.data.savedAt || 0) > (S.savedAt || 0) + 500) {
          try { window.localStorage.setItem(KEY, JSON.stringify(row.data)); } catch (e) { /* ignore */ }
          window.location.reload();
          return;
        }
        return Auth.push(S).then(function () { syncing = false; });
      });
    }
    render();
    if (configured) {
      Auth.onChange(function (ev, u) { if (u && ev === 'SIGNED_IN') { $('splash').hidden = $('splash').hidden; afterAuth(); } });
      Auth.boot().then(function (u) { if (u) afterAuth(); else render(); });
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && Auth.user()) Auth.push(S); });
    }
  }

  function init() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches && !load()) S.calm = true;
    $('brand-link').href = CFG.brandUrl || '#'; $('brand-link').textContent = CFG.brandName || 'Flow State Freelance Co.';
    try { scene = Art.createScene(canvas); } catch (e) { scene = null; }
    ensurePlants();
    renderVibes(); renderTimerControls(); renderTimerFace(); renderTasks(); renderSounds(); renderGarden(); setupSignup(); setupAuth(); showSaveNote(); checkVacation(); renderVacation(); renderJar(0); setInterval(checkVacation, 60000);
    syncScene();
    if (scene) requestAnimationFrame(loop);
    setInterval(function () { if (S.vibes.time === 'auto') syncScene(); renderGarden(); checkDay(); }, 60000);
    $('enter').addEventListener('click', function () {
      try { Audio.unlock(); } catch (e) { /* no sound in this browser */ }
      applyAllSound();
      $('splash').hidden = true;
      document.body.classList.remove('modal-open');
      checkDay();
      if (!S.hasChar) setTimeout(openCharacter, 250);
      else toast('Welcome back to the cafe.');
    });
    var f = $('enter'); if (f) f.focus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
