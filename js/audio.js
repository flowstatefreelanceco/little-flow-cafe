/* Little flow cafe: every sound is made live in the browser (no audio files needed). */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});

  function rand(a, b) { return a + Math.random() * (b - a); }
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // how loud each layer is at slider = 100%
  var LAYER_GAIN = { waves: 0.8, fire: 0.9, chat: 0.55, plates: 0.8, keys: 0.7, rain: 0.75, music: 0.6 };

  function makeNoise(ctx, seconds, type) {
    var n = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0), i, w;
    if (type === 'white') {
      for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (i = 0; i < n; i++) {
        w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    } else if (type === 'brown') {
      var last = 0;
      for (i = 0; i < n; i++) { w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    } else if (type === 'vinyl') {
      for (i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.004;
        if (Math.random() < 0.0009) d[i] = (Math.random() * 2 - 1) * (0.2 + Math.random() * 0.5);
      }
    }
    return buf;
  }

  function Engine() {
    this.ctx = null; this.master = null; this.sfx = null;
    this.layers = {};
    this.muted = false; this.masterVol = 0.8;
    this.sfxOn = true; this.sfxVol = 0.7;
    this.buf = {};
  }

  Engine.prototype.unlock = function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!this.ctx) {
      this.ctx = new AC();
      var ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.masterVol;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
      this.master.connect(comp); comp.connect(ctx.destination);
      this.sfx = ctx.createGain();
      this.sfx.gain.value = this.sfxOn ? this.sfxVol : 0;
      this.sfx.connect(this.master);
      this.buf.white = makeNoise(ctx, 2, 'white');
      this.buf.pink = makeNoise(ctx, 4, 'pink');
      this.buf.brown = makeNoise(ctx, 4, 'brown');
      this.buf.vinyl = makeNoise(ctx, 5, 'vinyl');
      var len = Math.floor(ctx.sampleRate * 2.2);
      var ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var data = ir.getChannelData(ch);
        for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
      this.buf.ir = ir;
    }
    if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) { /* ignore */ } }
    var self = this;
    Object.keys(this.layers).forEach(function (n) {
      var L = self.layers[n];
      if (L.on && !L.running) self._start(n);
    });
    return true;
  };

  Engine.prototype.ready = function () { return !!(this.ctx && this.ctx.state === 'running'); };

  Engine.prototype.setMaster = function (v, muted) {
    this.masterVol = v; this.muted = !!muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.05);
  };
  Engine.prototype.setSfx = function (on, v) {
    this.sfxOn = !!on; if (v !== undefined) this.sfxVol = v;
    if (this.sfx) this.sfx.gain.setTargetAtTime(this.sfxOn ? this.sfxVol : 0, this.ctx.currentTime, 0.05);
  };

  Engine.prototype.setLayer = function (name, on, vol) {
    var L = this.layers[name];
    if (!L) L = this.layers[name] = { on: false, vol: 0.5, running: false, out: null, stop: null };
    if (vol !== undefined) L.vol = vol;
    L.on = !!on;
    if (!this.ctx) return;
    if (L.on && !L.running) this._start(name);
    else if (!L.on && L.running) this._stop(name);
    if (L.out) L.out.gain.setTargetAtTime(L.vol * (LAYER_GAIN[name] || 1), this.ctx.currentTime, 0.08);
  };

  Engine.prototype._start = function (name) {
    var L = this.layers[name], ctx = this.ctx;
    var starter = LAYERS[name];
    if (!starter || !ctx) return;
    var out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    out.gain.setTargetAtTime(L.vol * (LAYER_GAIN[name] || 1), ctx.currentTime, 0.4);
    L.out = out; L.running = true;
    L.stop = starter(this, out);
  };
  Engine.prototype._stop = function (name) {
    var L = this.layers[name], ctx = this.ctx;
    if (!L || !L.running) return;
    L.running = false;
    var out = L.out, stop = L.stop;
    L.out = null; L.stop = null;
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(function () { try { if (stop) stop(); out.disconnect(); } catch (e) { /* ignore */ } }, 900);
  };

  /* little helpers */
  Engine.prototype.loop = function (type) {
    var s = this.ctx.createBufferSource();
    s.buffer = this.buf[type]; s.loop = true;
    s.loopStart = 0; s.loopEnd = this.buf[type].duration;
    s.start(0, Math.random() * this.buf[type].duration * 0.9);
    return s;
  };
  Engine.prototype.burst = function (dest, o) {
    var ctx = this.ctx, now = o.t || ctx.currentTime;
    var s = ctx.createBufferSource(); s.buffer = this.buf.white;
    var f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.value = o.freq; f.Q.value = o.q || 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(o.amp, now + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);
    var chain = s; chain.connect(f); f.connect(g);
    var tail = g;
    if (o.pan !== undefined && ctx.createStereoPanner) {
      var pn = ctx.createStereoPanner(); pn.pan.value = o.pan; g.connect(pn); tail = pn;
    }
    tail.connect(dest);
    s.start(now, Math.random() * 1.5);
    s.stop(now + o.dur + 0.05);
  };
  Engine.prototype.tone = function (dest, o) {
    var ctx = this.ctx, now = o.t || ctx.currentTime;
    var osc = ctx.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.freq, now);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, now + o.dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(o.amp, now + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);
    osc.connect(g); g.connect(dest);
    osc.start(now); osc.stop(now + o.dur + 0.05);
  };
  Engine.prototype.ping = function (dest, f, amp, dur, t) {
    this.tone(dest, { freq: f, amp: amp, dur: dur, t: t });
    this.tone(dest, { freq: f * 2.76, amp: amp * 0.35, dur: dur * 0.5, t: t });
    this.tone(dest, { freq: f * 5.4, amp: amp * 0.12, dur: dur * 0.25, t: t });
  };

  /* ---------- the ambient layers ---------- */
  var LAYERS = {};

  LAYERS.waves = function (E, out) {
    // soft ocean swells: filtered noise that rises and falls slowly, with a little foam on top
    var ctx = E.ctx, alive = true, timer = null;
    var n = E.loop('brown'), lp = ctx.createBiquadFilter(), sw = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 0.4; sw.gain.value = 0.2;
    n.connect(lp); lp.connect(sw); sw.connect(out);
    var f = E.loop('pink'), hp = ctx.createBiquadFilter(), fg = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 1400; fg.gain.value = 0.0;
    f.connect(hp); hp.connect(fg); fg.connect(out);
    function swell() {
      if (!alive) return;
      var t = ctx.currentTime, rise = rand(3, 4.5), fall = rand(3.5, 5.5), peak = rand(0.55, 0.8);
      sw.gain.cancelScheduledValues(t); sw.gain.setValueAtTime(sw.gain.value, t);
      sw.gain.linearRampToValueAtTime(peak, t + rise); sw.gain.linearRampToValueAtTime(0.14, t + rise + fall);
      lp.frequency.cancelScheduledValues(t); lp.frequency.setValueAtTime(lp.frequency.value, t);
      lp.frequency.linearRampToValueAtTime(rand(900, 1500), t + rise); lp.frequency.linearRampToValueAtTime(420, t + rise + fall);
      fg.gain.cancelScheduledValues(t); fg.gain.setValueAtTime(0.0, t);
      fg.gain.linearRampToValueAtTime(0.0, t + rise * 0.7); fg.gain.linearRampToValueAtTime(rand(0.04, 0.09), t + rise + 0.2); fg.gain.linearRampToValueAtTime(0.0, t + rise + fall);
      timer = setTimeout(swell, (rise + fall) * 1000 - 200);
    }
    swell();
    return function () { alive = false; clearTimeout(timer); try { n.stop(); f.stop(); } catch (e) { /* ignore */ } };
  };

  LAYERS.fire = function (E, out) {
    var ctx = E.ctx, alive = true, timer = null;
    var rumble = E.loop('brown'), lp = ctx.createBiquadFilter(), g1 = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 340; g1.gain.value = 0.55;
    rumble.connect(lp); lp.connect(g1); g1.connect(out);
    var hiss = E.loop('white'), bp = ctx.createBiquadFilter(), g2 = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.4; g2.gain.value = 0.012;
    hiss.connect(bp); bp.connect(g2); g2.connect(out);
    function crackle() {
      if (!alive) return;
      var big = Math.random() < 0.08;
      E.burst(out, {
        freq: big ? rand(500, 1400) : rand(1200, 5500), q: rand(0.8, 3), amp: big ? rand(0.4, 0.7) : rand(0.05, 0.32),
        dur: big ? rand(0.03, 0.07) : rand(0.006, 0.03), type: 'bandpass', pan: rand(-0.4, 0.4)
      });
      timer = setTimeout(crackle, Math.random() < 0.2 ? rand(300, 1100) : rand(30, 260));
    }
    crackle();
    return function () { alive = false; clearTimeout(timer); try { rumble.stop(); hiss.stop(); } catch (e) { /* ignore */ } };
  };

  LAYERS.rain = function (E, out) {
    var ctx = E.ctx, alive = true, timer = null;
    var p = E.loop('pink'), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g1 = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 500; lp.type = 'lowpass'; lp.frequency.value = 8000; g1.gain.value = 0.5;
    p.connect(hp); hp.connect(lp); lp.connect(g1); g1.connect(out);
    var b = E.loop('brown'), lp2 = ctx.createBiquadFilter(), g2 = ctx.createGain();
    lp2.type = 'lowpass'; lp2.frequency.value = 600; g2.gain.value = 0.3;
    b.connect(lp2); lp2.connect(g2); g2.connect(out);
    function drip() {
      if (!alive) return;
      E.burst(out, { freq: rand(2000, 6500), q: rand(2, 6), amp: rand(0.03, 0.12), dur: rand(0.01, 0.03), pan: rand(-0.7, 0.7) });
      timer = setTimeout(drip, rand(120, 700));
    }
    drip();
    return function () { alive = false; clearTimeout(timer); try { p.stop(); b.stop(); } catch (e) { /* ignore */ } };
  };

  LAYERS.chat = function (E, out) {
    var ctx = E.ctx, alive = true, timers = [];
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.3;
    var mixer = ctx.createGain(); mixer.gain.value = 0.9;
    mixer.connect(lp); lp.connect(out);
    var room = E.loop('pink'), rbp = ctx.createBiquadFilter(), rg = ctx.createGain();
    rbp.type = 'bandpass'; rbp.frequency.value = 650; rbp.Q.value = 0.5; rg.gain.value = 0.06;
    room.connect(rbp); rbp.connect(rg); rg.connect(mixer);
    var vowels = [[730, 1090], [570, 840], [300, 870], [660, 1720], [520, 1190], [400, 2000]];
    function voice() {
      var f0 = rand(95, 235);
      var o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f0;
      var o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = f0 * 1.004;
      var vg = ctx.createGain(); vg.gain.value = 0;
      var b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter();
      b1.type = 'bandpass'; b1.Q.value = 5; b2.type = 'bandpass'; b2.Q.value = 7;
      var vm = ctx.createGain(); vm.gain.value = 0.5;
      o1.connect(vg); o2.connect(vg); vg.connect(b1); vg.connect(b2); b1.connect(vm); b2.connect(vm); vm.connect(mixer);
      o1.start(); o2.start();
      var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) { pan.pan.value = rand(-0.8, 0.8); vm.disconnect(); vm.connect(pan); pan.connect(mixer); }
      function sentence() {
        if (!alive) return;
        var n = Math.floor(rand(3, 11)), i = 0;
        function syl() {
          if (!alive) return;
          var now = ctx.currentTime, dur = rand(0.12, 0.26), v = vowels[Math.floor(Math.random() * vowels.length)];
          o1.frequency.setTargetAtTime(f0 * rand(0.9, 1.14), now, 0.03);
          o2.frequency.setTargetAtTime(f0 * rand(0.9, 1.14) * 1.004, now, 0.03);
          b1.frequency.setTargetAtTime(v[0] * rand(0.9, 1.1), now, 0.03);
          b2.frequency.setTargetAtTime(v[1] * rand(0.9, 1.1), now, 0.03);
          vg.gain.setTargetAtTime(rand(0.04, 0.1), now, 0.02);
          vg.gain.setTargetAtTime(0.0001, now + dur * 0.6, 0.035);
          i++;
          if (i < n) timers.push(setTimeout(syl, dur * 1000 + rand(0, 60)));
          else timers.push(setTimeout(sentence, rand(900, 5200)));
        }
        syl();
      }
      timers.push(setTimeout(sentence, rand(0, 3000)));
      return function () { try { o1.stop(); o2.stop(); } catch (e) { /* ignore */ } };
    }
    var stops = [];
    for (var i = 0; i < 5; i++) stops.push(voice());
    return function () {
      alive = false; timers.forEach(clearTimeout);
      stops.forEach(function (s) { s(); });
      try { room.stop(); } catch (e) { /* ignore */ }
    };
  };

  LAYERS.plates = function (E, out) {
    var ctx = E.ctx, alive = true, timer = null;
    function clink() {
      if (!alive) return;
      var now = ctx.currentTime, kind = Math.random();
      if (kind < 0.55) {
        var n = 1 + Math.floor(Math.random() * 3), f = rand(2400, 4200);
        for (var i = 0; i < n; i++) E.ping(out, f * rand(0.9, 1.15), rand(0.05, 0.1), rand(0.12, 0.3), now + i * rand(0.06, 0.14));
      } else if (kind < 0.8) {
        E.ping(out, rand(1700, 2500), 0.07, rand(0.4, 0.7), now);
        E.ping(out, rand(1700, 2500), 0.05, rand(0.3, 0.5), now + rand(0.1, 0.2));
      } else {
        E.burst(out, { freq: rand(200, 400), q: 0.8, amp: 0.2, dur: 0.07, type: 'lowpass' });
        E.ping(out, rand(3000, 4600), 0.05, 0.14, now + 0.02);
      }
      timer = setTimeout(clink, rand(2500, 9000));
    }
    timer = setTimeout(clink, 600);
    return function () { alive = false; clearTimeout(timer); };
  };

  LAYERS.keys = function (E, out) {
    var ctx = E.ctx, alive = true, timer = null;
    function typing() {
      if (!alive) return;
      var n = Math.floor(rand(4, 16)), i = 0, pan = rand(-0.5, 0.5);
      function key() {
        if (!alive) return;
        var now = ctx.currentTime, space = Math.random() < 0.14;
        E.burst(out, { freq: rand(1800, 3600), q: 1.1, amp: space ? rand(0.12, 0.2) : rand(0.06, 0.15), dur: rand(0.012, 0.022), pan: pan });
        E.tone(out, { freq: space ? rand(110, 150) : rand(150, 210), freqEnd: 80, amp: space ? 0.09 : 0.05, dur: 0.035, t: now });
        i++;
        if (i < n) timer = setTimeout(key, rand(60, 190) + (Math.random() < 0.12 ? rand(120, 320) : 0));
        else timer = setTimeout(typing, rand(1500, 6500));
      }
      key();
    }
    timer = setTimeout(typing, 400);
    return function () { alive = false; clearTimeout(timer); };
  };

  LAYERS.music = function (E, out) {
    var ctx = E.ctx, alive = true;
    var bus = ctx.createGain(); bus.gain.value = 0.9;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = 0.4;
    bus.connect(lp); lp.connect(out);
    var wet = ctx.createGain(); wet.gain.value = 0.32;
    var conv = ctx.createConvolver(); conv.buffer = E.buf.ir;
    lp.connect(wet); wet.connect(conv); conv.connect(out);
    var vin = E.loop('vinyl'), vhp = ctx.createBiquadFilter(), vg = ctx.createGain();
    vhp.type = 'highpass'; vhp.frequency.value = 1400; vg.gain.value = 0.3;
    vin.connect(vhp); vhp.connect(vg); vg.connect(out);

    var bpm = Math.floor(rand(68, 80)), step = 60 / bpm / 4;
    var progs = [
      [[53, 'maj7'], [52, 'min7'], [50, 'min7'], [55, 'dom7']],
      [[48, 'maj7'], [45, 'min7'], [50, 'min7'], [55, 'dom7']],
      [[51, 'maj7'], [50, 'min7'], [48, 'min7'], [53, 'dom7']],
      [[57, 'min7'], [50, 'min7'], [55, 'dom7'], [48, 'maj7']]
    ];
    var prog = progs[Math.floor(Math.random() * progs.length)];
    var types = { maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10] };
    var penta = { maj7: [0, 2, 4, 7, 9], dom7: [0, 2, 4, 7, 9], min7: [0, 3, 5, 7, 10] };

    function rhodes(freq, t, dur, amp) {
      E.tone(bus, { freq: freq, amp: amp, dur: dur, t: t, attack: 0.012 });
      E.tone(bus, { freq: freq * 2, type: 'triangle', amp: amp * 0.22, dur: dur * 0.6, t: t, attack: 0.006 });
    }
    function pluck(freq, t, dur) {
      var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1600;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    }
    function schedule(idx, t) {
      var bar = Math.floor(idx / 16), s = idx % 16, ch = prog[bar % 4], root = ch[0], ints = types[ch[1]];
      if (s === 0) {
        ints.forEach(function (iv, k) { rhodes(midi(root + 12 + iv), t + k * 0.014, step * 15, 0.045); });
        E.tone(bus, { freq: midi(root - 12), amp: 0.2, dur: step * 7, t: t, attack: 0.01 });
      }
      if (s === 10) E.tone(bus, { freq: midi(root - 12), amp: 0.14, dur: step * 4, t: t, attack: 0.01 });
      if (s === 0 || s === 10 || (s === 7 && Math.random() < 0.3)) {
        E.tone(bus, { freq: 125, freqEnd: 45, amp: 0.38, dur: 0.2, t: t });
      }
      if (s === 4 || s === 12) {
        E.burst(bus, { freq: 1900, q: 0.8, amp: 0.1, dur: 0.11, t: t });
        E.tone(bus, { freq: 190, freqEnd: 120, amp: 0.05, dur: 0.08, t: t });
      }
      if (s % 2 === 0) {
        var th = t + (s % 4 === 2 ? step * 0.28 : 0);
        E.burst(bus, { freq: 7500, q: 0.7, amp: s % 4 === 0 ? 0.045 : 0.03, dur: 0.03, t: th, type: 'highpass' });
      }
      if (s % 2 === 0 && Math.random() < 0.26) {
        var sc = penta[ch[1]], note = root + 24 + sc[Math.floor(Math.random() * sc.length)];
        pluck(midi(note), t + step * 0.2, rand(0.5, 1.1));
      }
    }
    var next = ctx.currentTime + 0.15, n = 0;
    var timer = setInterval(function () {
      if (!alive) return;
      while (next < ctx.currentTime + 0.4) { schedule(n, next); next += step; n++; }
    }, 80);
    return function () { alive = false; clearInterval(timer); try { vin.stop(); } catch (e) { /* ignore */ } };
  };

  /* ---------- gentle sound effects ---------- */
  Engine.prototype._sfx = function (fn) {
    if (!this.ctx) { if (!this.unlock()) return; }
    if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) { /* ignore */ } }
    if (!this.sfxOn) return;
    fn(this.ctx, this.sfx);
  };
  Engine.prototype.bell = function (dest, f, t, dur, amp) {
    this.tone(dest, { freq: f, amp: amp, dur: dur, t: t, attack: 0.006 });
    this.tone(dest, { freq: f * 2.01, amp: amp * 0.25, dur: dur * 0.6, t: t, attack: 0.006 });
    this.tone(dest, { freq: f * 3.02, amp: amp * 0.1, dur: dur * 0.35, t: t, attack: 0.006 });
  };
  Engine.prototype.chime = function (kind) {
    var E = this;
    this._sfx(function (ctx, dest) {
      var now = ctx.currentTime;
      var notes = kind === 'break' ? [784, 659.25, 523.25] : [659.25, 783.99, 987.77, 1318.5];
      notes.forEach(function (f, i) { E.bell(dest, f, now + i * 0.22, 2.4, 0.2); });
    });
  };
  Engine.prototype.sparkle = function () {
    var E = this;
    this._sfx(function (ctx, dest) {
      var now = ctx.currentTime;
      [1318.5, 1568, 1976, 2349, 2637].forEach(function (f, i) { E.tone(dest, { freq: f, amp: 0.1, dur: 0.35, t: now + i * 0.05 }); });
    });
  };
  Engine.prototype.wake = function () {
    var E = this;
    this._sfx(function (ctx, dest) {
      var now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach(function (f, i) { E.bell(dest, f, now + i * 0.09, 1.2, 0.12); });
    });
  };
  Engine.prototype.water = function () {
    var E = this;
    this._sfx(function (ctx, dest) {
      var now = ctx.currentTime;
      E.burst(dest, { freq: 2500, q: 0.5, amp: 0.1, dur: 0.7, t: now + 0.15, type: 'bandpass' });
      for (var i = 0; i < 6; i++) E.tone(dest, { freq: rand(500, 900), freqEnd: rand(1200, 1800), amp: 0.05, dur: 0.1, t: now + 0.2 + i * 0.1 });
    });
  };
  Engine.prototype.flip = function () {
    var E = this;
    this._sfx(function (ctx, dest) {
      var now = ctx.currentTime;
      E.burst(dest, { freq: 3000, q: 0.6, amp: 0.1, dur: 0.12, t: now, type: 'highpass' });
      E.tone(dest, { freq: 880, amp: 0.06, dur: 0.25, t: now + 0.05 });
    });
  };
  Engine.prototype.pop = function () {
    var E = this;
    this._sfx(function (ctx, dest) { E.tone(dest, { freq: 520, freqEnd: 780, amp: 0.07, dur: 0.07 }); });
  };
  Engine.prototype.purr = function () {
    var E = this;
    this._sfx(function (ctx, dest) {
      var now = ctx.currentTime;
      var src = ctx.createBufferSource(); src.buffer = E.buf.brown; src.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      var g = ctx.createGain(); g.gain.value = 0;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 24;
      var lg = ctx.createGain(); lg.gain.value = 0.35;
      lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.5, now + 0.25);
      g.gain.setTargetAtTime(0.0001, now + 1.2, 0.2);
      src.connect(lp); lp.connect(g); g.connect(dest);
      src.start(now); lfo.start(now); src.stop(now + 2); lfo.stop(now + 2);
    });
  };

  Cafe.Audio = new Engine();
})();
