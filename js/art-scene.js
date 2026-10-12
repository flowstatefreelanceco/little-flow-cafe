/* Little flow cafe: one big, calm, flat illustration. A straight-on room with an arched window, a fireplace,
   built-in bookcases, a counter, round tables, and room between everything. */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});
  var C = Cafe.Core, Pe = Cafe.People, Pl = Cafe.Plants;
  var R = C.R, P = C.P, D = C.D, E = C.E, RR = C.RR, line = C.line;
  var mix = C.mix, shade = C.shade, clamp = C.clamp, lerp = C.lerp, rng = C.rng;

  /* ---------- geometry ---------- */
  var W = 576, H = 432;
  var K = 3; // painted at three times its size so every edge stays crisp
  var FLOORY = 300;
  var GLASS = { x: 196, y: 54, w: 136, h: 146 };
  var CLOCK = { x: 98, y: 108, r: 21 };
  var FIREBOX = { x: 80, y: 246, w: 36, h: 54 };
  var PSC = 1.68; // how big seated people are drawn

  /* ---------- the palette: dusty, warm, a little mixed ---------- */
  var PAL = {
    wall: '#f1e6d2', wallHi: '#f8f0e2', wain: '#c9694a', wainLn: '#b05a42', cream: '#efe0c8', creamDk: '#d9c6a6',
    wood: '#a5683c', woodDk: '#7a4630', woodLt: '#c48a55', floorA: '#d29d62', floorB: '#dba96e', seam: '#b9824f',
    stone: '#cdb99d', stoneLn: '#b9a283', terra: '#b9694d', sage: '#9bb08f', mustard: '#e3a93a', blue: '#7f9db3',
    mauve: '#a77a8c', ink: '#5b4237', navy: '#3f5a7a'
  };
  var BOOKC = ['#b9694d', '#d9a64e', '#7f9db3', '#8fa88a', '#a77a8c', '#efe0c8', '#c4806a', '#5f7f8a', '#d9a0a0', '#e6c9a0', '#7a8f4a', '#8c6a9a'];
  var GLASS_COLS = ['#d96b58', '#e8b04a', '#4f9d92', '#5f86c8', '#d98aa8', '#e8b04a'];
  function T(c) { return C.tone(c); }
  function lit(st, id) { return !(st.lights && st.lights[id] === false); }

  /* ---------- time of day ---------- */
  var SKY = [
    { h: 0, top: '#1b1b3a', bot: '#2d2a55', tint: '#7a82cc', ta: 0.50, star: 1 },
    { h: 5, top: '#2a2850', bot: '#6a5a8e', tint: '#8f8ccb', ta: 0.42, star: 0.8 },
    { h: 6.5, top: '#f2a7b8', bot: '#ffd9b0', tint: '#ffd6c8', ta: 0.16, star: 0.1 },
    { h: 8.5, top: '#a9d4f2', bot: '#fde7d0', tint: '#fff1e0', ta: 0.07, star: 0 },
    { h: 12, top: '#8ec9ef', bot: '#dff2f7', tint: '#ffffff', ta: 0, star: 0 },
    { h: 16, top: '#9ccbe8', bot: '#fbe4bd', tint: '#ffe9c4', ta: 0.09, star: 0 },
    { h: 18, top: '#f4a56b', bot: '#f9d27a', tint: '#ffbf8a', ta: 0.2, star: 0 },
    { h: 19.5, top: '#a85a8c', bot: '#f08a6a', tint: '#c07aa8', ta: 0.32, star: 0.3 },
    { h: 21, top: '#2a2750', bot: '#5a4a82', tint: '#7a78c0', ta: 0.46, star: 0.9 },
    { h: 24, top: '#1b1b3a', bot: '#2d2a55', tint: '#7a82cc', ta: 0.50, star: 1 }
  ];
  var PHASE_HOURS = { morning: 8, day: 12.5, golden: 17.5, evening: 20, night: 23.5 };

  function skyAt(h) {
    h = ((h % 24) + 24) % 24;
    var a = SKY[0], b = SKY[1];
    for (var i = 0; i < SKY.length - 1; i++) {
      if (h >= SKY[i].h && h <= SKY[i + 1].h) { a = SKY[i]; b = SKY[i + 1]; break; }
    }
    var t = (h - a.h) / ((b.h - a.h) || 1);
    return {
      top: mix(a.top, b.top, t), bot: mix(a.bot, b.bot, t), tint: mix(a.tint, b.tint, t),
      ta: lerp(a.ta, b.ta, t), star: lerp(a.star, b.star, t)
    };
  }

  /* ---------- layout ---------- */
  var TABLES = [
    { id: 'back', cx: 330, ty: 334, rx: 62, cloth: 'runner', seats: [{ dx: -66, r: 0 }, { dx: 0, r: 1 }, { dx: 66, r: 2 }],
      items: [{ k: 'cup', ox: -30, oy: 4 }, { k: 'book', ox: 20, oy: 8 }, { k: 'tea', ox: 34, oy: 0 }] },
    { id: 'fl', cx: 176, ty: 376, rx: 58, cloth: 'checks', seats: [{ dx: -62, r: 1 }, { dx: 62, r: 2 }],
      items: [{ k: 'cup', ox: -14, oy: 5 }, { k: 'pastry', ox: 16, oy: 6 }] },
    { id: 'fr', cx: 404, ty: 378, rx: 52, cloth: 'wood', seats: [{ dx: 62, r: 0 }],
      items: [{ k: 'cup', ox: 14, oy: 6 }, { k: 'pastry', ox: -4, oy: 8 }, { k: 'book', ox: 26, oy: 0 }] }
  ];
  var PLAYER_SEAT = { table: 'back', index: 1 };
  var CHAIRS = ['#c4572f', '#2f7f8a', '#d9a02a', '#7a4fb0', '#b8302f'];
  var NOOK = { x: 40, y: 342 };
  var HEARTH = { x: 98, y: 322 };
  var AVO = { x: 504, y: 410 };
  var DOGSPOT = { x: 555, y: 298 };
  var BARISTA = { cx: 436, T: 232 };
  var CNT = { x: 344, y: 230, w: 212 };
  var BC1 = { x: 10, y: 66, w: 50, h: 234, rows: 4 };
  var BC2 = { x: 140, y: 146, w: 46, h: 154, rows: 3 };
  var SHELF1 = { x: 358, y: 118, w: 196 }, SHELF2 = { x: 358, y: 172, w: 196 };
  var CHALK = { x: 438, y: 29, w: 60, h: 50 };
  var WAYPOINTS = [[150, 324], [236, 332], [330, 316], [404, 336], [470, 360], [384, 412], [300, 420], [210, 414], [124, 404], [556, 380], [330, 392]];

  /* the lamps you can switch (x, y is the bottom middle of each) */
  var LIGHTS = [
    { id: 'salt1', kind: 'salt', x: 26, y: 0, name: 'Salt lamp' },
    { id: 'glassM', kind: 'glass', x: 163, y: 146, name: 'Stained glass lamp' },
    { id: 'salt3', kind: 'salt', x: 124, y: 200, name: 'Salt lamp' },
    { id: 'salt2', kind: 'salt', x: 394, y: 172, name: 'Salt lamp' },
    { id: 'glassR', kind: 'glass', x: 470, y: 231, name: 'Stained glass lamp' }
  ];
  var PENDANTS = [{ x: 382, h: 50 }, { x: 526, h: 56 }];

  function placePlants() {
    var s = Pl.SLOTS;
    function at(id, x, y, hook) { s[id].x = x; s[id].y = y; if (hook !== undefined) s[id].hook = hook; }
    at(0, 238, 203); at(1, 266, 203); at(2, 296, 203);
    at(3, 88, 200); at(13, 470, 118); at(14, 532, 172);
    at(5, 163, 70, 10); at(6, 412, 70, 10);
    at(4, 128, 338); at(8, 548, 334); at(9, 150, 310); at(10, 396, 310); at(11, 224, 312); at(12, 560, 420);
    var fr = TABLES[2], fl = TABLES[1];
    at(7, fr.cx - 20, fr.ty - 1); at(15, fl.cx + 2, fl.ty - 3);
  }

  /* ---------- small drawing helpers ---------- */
  function rr(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function box(g, x, y, w, h, c, r) { g.fillStyle = T(c); if (r) { rr(g, x, y, w, h, r); g.fill(); } else g.fillRect(x, y, w, h); }
  function ell(g, x, y, rx, ry, c) { g.fillStyle = T(c); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.fill(); }
  function poly(g, pts, c) { g.fillStyle = T(c); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
  function archPath(g, x, y, w, h) {
    var r = w / 2; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + r); g.arc(x + r, y + r, r, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
  }

  /* ---------- little icons (smooth shapes) ---------- */
  var ICON_COL = { heart: '#d9607a', note: '#7a5aa8', coffee: '#8a5a36', spark: '#e8b030', check: '#4aa66a', leaf: '#6aa85a', drop: '#5aa9e6' };
  function icon(name, x, y, col, s) {
    var g = C.ctx(); s = s || 1;
    g.save(); g.translate(x + 3 * s, y + 3 * s); g.scale(s, s);
    g.fillStyle = T(col || ICON_COL[name] || '#444'); g.strokeStyle = g.fillStyle; g.lineWidth = 1.2; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    switch (name) {
      case 'heart': g.moveTo(0, 3.4); g.bezierCurveTo(-5.4, -0.4, -2.8, -4.4, 0, -1.6); g.bezierCurveTo(2.8, -4.4, 5.4, -0.4, 0, 3.4); g.fill(); break;
      case 'spark': g.moveTo(0, -3.8); g.quadraticCurveTo(0.5, -0.5, 3.8, 0); g.quadraticCurveTo(0.5, 0.5, 0, 3.8); g.quadraticCurveTo(-0.5, 0.5, -3.8, 0); g.quadraticCurveTo(-0.5, -0.5, 0, -3.8); g.fill(); break;
      case 'drop': g.moveTo(0, -3.6); g.quadraticCurveTo(3.4, 0.6, 2.4, 1.8); g.arc(0, 1.6, 2.4, 0, Math.PI); g.quadraticCurveTo(-3.4, 0.6, 0, -3.6); g.fill(); break;
      case 'leaf': g.ellipse(0, 0, 4, 2.2, -0.7, 0, 6.2832); g.fill(); break;
      case 'check': g.moveTo(-3, 0.4); g.lineTo(-0.8, 2.8); g.lineTo(3.4, -2.6); g.lineWidth = 1.7; g.stroke(); break;
      case 'note': g.ellipse(-1.2, 2.4, 1.9, 1.4, -0.4, 0, 6.2832); g.fill(); g.beginPath(); g.moveTo(0.4, 2.2); g.lineTo(0.4, -3.4); g.lineTo(3, -2); g.stroke(); break;
      case 'coffee': rr(g, -3.4, -1.4, 5.8, 4.8, 1.6); g.fill(); g.beginPath(); g.arc(2.6, 1, 1.7, -1.5, 1.5); g.stroke(); break;
      default: g.arc(0, 0, 2, 0, 6.2832); g.fill();
    }
    g.restore();
  }
  function bubble(cx, y, name) {
    var g = C.ctx();
    g.fillStyle = '#fffaf0'; rr(g, cx - 10, y - 15, 20, 15, 7); g.fill();
    g.beginPath(); g.moveTo(cx - 3, y - 1); g.lineTo(cx - 1, y + 4); g.lineTo(cx + 3, y - 1); g.closePath(); g.fill();
    icon(name, cx - 3, y - 11, null, 1.1);
  }
  function drawItem(k, x, y, t) {
    var i, kk, g = C.ctx();
    function steam(sx, sy) {
      for (i = 0; i < 2; i++) for (kk = 0; kk < 3; kk++) {
        g.fillStyle = 'rgba(255,255,255,' + (0.6 - kk * 0.17) + ')';
        g.fillRect(Math.round(sx + i * 2 + Math.sin(t * 2 + i * 2 + kk)), sy - kk * 2, 1, 1);
      }
    }
    var breathe = Math.sin(t * 1.6) > 0.3 ? 1 : 0;
    switch (k) {
      case 'cup':
        E(x, y, 5, 2, '#f1e6d6'); R(x - 3, y - 5, 6, 5, '#fff5e8'); R(x - 3, y - 5, 6, 1, '#7a4a2a'); P(x + 3, y - 4, '#fff5e8'); P(x + 4, y - 3, '#fff5e8');
        steam(x - 1, y - 7); break;
      case 'tea':
        E(x, y, 5, 2, '#f1e6d6'); R(x - 3, y - 5, 6, 5, '#a8d5ba'); R(x - 3, y - 5, 6, 1, '#d9a85a'); P(x + 3, y - 4, '#a8d5ba'); P(x + 4, y - 3, '#a8d5ba');
        steam(x - 1, y - 7); break;
      case 'cat':
        R(x - 5, y - 4 - breathe, 11, 4 + breathe, '#e8a458'); R(x + 3, y - 7, 5, 4, '#e8a458');
        P(x + 3, y - 8, '#e8a458'); P(x + 7, y - 8, '#e8a458'); P(x + 5, y - 5, '#2a1f2a'); P(x + 7, y - 5, '#2a1f2a');
        R(x - 3, y - 4 - breathe, 1, 3, '#c98a45'); R(x, y - 4 - breathe, 1, 3, '#c98a45'); R(x - 7, y - 2, 3, 1, '#e8a458'); break;
      case 'pastry':
        E(x, y, 6, 2, '#ffffff'); R(x - 4, y - 4, 8, 3, '#e2a45c'); R(x - 3, y - 5, 6, 1, '#c98a45'); P(x - 1, y - 4, '#f6d27a'); break;
      case 'book':
        R(x - 5, y - 3, 10, 3, '#7fae8a'); R(x - 4, y - 6, 9, 3, '#e8b04a'); R(x - 4, y - 6, 9, 1, '#f6d27a'); break;
      default: break;
    }
  }

  function flameShape(x, baseY, hgt, col, wid) {
    for (var k = 0; k < hgt; k++) {
      var w = Math.max(1, Math.round(wid * (1 - Math.pow(k / hgt, 1.6))));
      R(x - Math.floor(w / 2), baseY - k, w, 1, col);
    }
  }

  function drawCat(x, y, dir, state, t, body, belly) {
    var f = dir >= 0 ? 1 : -1;
    var d = shade(body, -0.22);
    function rect(dx, dy, w, h, c) { R(f > 0 ? x + dx : x - dx - w + 1, y + dy, w, h, c); }
    if (state === 'walk') {
      var ph = Math.floor(t * 7) % 2, ty = Math.round(Math.sin(t * 5));
      rect(-9, -9 + ty, 2, 6, body); rect(-9, -10 + ty, 2, 1, d);
      rect(-6, -7, 11, 5, body); rect(-6, -7, 11, 1, shade(body, 0.15)); rect(-4, -3, 7, 1, belly);
      rect(-4, -7, 1, 3, d); rect(-1, -7, 1, 3, d); rect(2, -7, 1, 2, d);
      rect(-5, -2 - (ph ? 1 : 0), 2, 2, d); rect(4, -2 - (ph ? 1 : 0), 2, 2, d);
      rect(-3, -2 - (ph ? 0 : 1), 2, 2, body); rect(2, -2 - (ph ? 0 : 1), 2, 2, body);
      rect(4, -11, 6, 6, body); rect(4, -13, 2, 2, body); rect(8, -13, 2, 2, body); rect(5, -12, 1, 1, '#f2a0b0'); rect(8, -12, 1, 1, '#f2a0b0');
      rect(8, -9, 1, 1, '#2a1f2a'); rect(8, -8, 2, 2, belly); rect(9, -8, 1, 1, '#f2a0b0');
    } else if (state === 'sit' || state === 'groom') {
      var hb = state === 'groom' ? Math.round(Math.sin(t * 6)) : 0;
      rect(-3, -9, 7, 9, body); rect(-3, -9, 7, 1, shade(body, 0.15)); rect(-1, -6, 3, 5, belly);
      rect(-2, -9, 1, 4, d); rect(1, -9, 1, 4, d);
      rect(4, -3, 5, 2, body); rect(8, -4, 2, 2, body);
      rect(-2, -14 + hb, 6, 5, body); rect(-2, -16 + hb, 2, 2, body); rect(2, -16 + hb, 2, 2, body);
      rect(-1, -15 + hb, 1, 1, '#f2a0b0'); rect(3, -15 + hb, 1, 1, '#f2a0b0');
      rect(2, -12 + hb, 1, 1, '#2a1f2a'); rect(0, -12 + hb, 1, 1, '#2a1f2a'); rect(1, -10 + hb, 1, 1, '#f2a0b0');
      if (state === 'groom') rect(3, -9, 2, 4, body);
    } else {
      var br = Math.round(Math.sin(t * 1.5) * 0.6 + 0.4);
      rect(-6, -5 - br, 12, 5 + br, body); rect(-6, -5 - br, 12, 1, shade(body, 0.15));
      rect(-4, -5 - br, 1, 3, d); rect(-1, -5 - br, 1, 3, d); rect(2, -5 - br, 1, 3, d);
      rect(4, -8, 5, 4, body); rect(4, -9, 1, 1, body); rect(8, -9, 1, 1, body); rect(7, -6, 1, 1, d);
      rect(-8, -3, 3, 2, body);
    }
  }

  /* ---------- Jess's own cat artwork ---------- */
  var CAT_IMG = null;
  function catFrames() {
    if (CAT_IMG) return CAT_IMG;
    var src = window.CafeCatArt; if (!src) return null;
    CAT_IMG = {};
    ['tan', 'white', 'sleep', 'tower'].forEach(function (k) {
      CAT_IMG[k] = src[k].map(function (f) { var im = new Image(); im.src = f.uri; im.w = f.w; im.h = f.h; return im; });
    });
    return CAT_IMG;
  }
  function catSprite(g, kind, frame, x, y, sc, flip) {
    var fr = catFrames(); if (!fr) return;
    var im = fr[kind][frame % fr[kind].length]; if (!im.complete || !im.naturalWidth) return;
    var w = im.w * sc, h = im.h * sc;
    g.save(); g.imageSmoothingEnabled = false;
    if (flip) { g.translate(Math.round(x), 0); g.scale(-1, 1); g.drawImage(im, Math.round(-w / 2), Math.round(y - h), w, h); }
    else g.drawImage(im, Math.round(x - w / 2), Math.round(y - h), w, h);
    g.restore();
  }
  var CAT_SC = 0.667;
  var TAN_CAT = { x: 214, y: 201 };
  var TOWER = { x: 550, y: 398 };

  /* ---------- the scene ---------- */
  function buildNook() {
    var cv = C.makeCanvas(64, 70), c = cv.getContext('2d');
    C.setCtx(c);
    var cx = 32, ty = 62, rx = 22, ry = 11, topY = ty - 26, i;
    // plum cloth to the floor with a scalloped hem
    c.fillStyle = '#6a3a8a';
    c.beginPath(); c.moveTo(cx - rx, topY);
    c.lineTo(cx - rx - 3, ty - 2);
    for (i = 0; i < 6; i++) { var x0 = cx - rx - 3 + i * ((rx + 3) * 2 / 6); c.quadraticCurveTo(x0 + (rx + 3) / 6, ty + 5, x0 + (rx + 3) / 3, ty - 2); }
    c.lineTo(cx + rx, topY); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(68,32,95,0.45)'; c.lineWidth = 1.2; c.lineCap = 'round';
    for (i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i * 6, topY + 6); c.quadraticCurveTo(cx + i * 6.6, topY + 16, cx + i * 7, ty - 3); c.stroke(); }
    var rr = rng(11);
    c.fillStyle = '#f5d98a';
    for (i = 0; i < 16; i++) { c.beginPath(); c.arc(cx - 18 + rr() * 36, topY + 8 + rr() * 18, 0.7, 0, 6.3); c.fill(); }
    E(cx, topY + 2, rx, ry, '#44205f'); E(cx, topY, rx, ry, '#7a4a9a'); E(cx, topY - 1, rx - 3, ry - 3, '#9a62b8');
    // candle jar
    RR(cx - 16, topY - 6, 5, 6, 1.5, '#f0e0c8'); RR(cx - 16, topY - 6, 5, 1.6, 0.8, '#fff8ea');
    // crystals
    function crys(x, h, w, col, hi) { c.fillStyle = col; c.beginPath(); c.moveTo(x, topY); c.lineTo(x, topY - h + 2); c.lineTo(x + w / 2, topY - h - 1); c.lineTo(x + w, topY - h + 2); c.lineTo(x + w, topY); c.closePath(); c.fill(); c.fillStyle = hi; c.fillRect(x + 0.5, topY - h + 2, 1, h - 3); }
    crys(cx + 10, 12, 3.4, '#c9a7ff', '#e6d8ff'); crys(cx + 15, 8, 3.2, '#ffb3d9', '#ffd6ea'); crys(cx + 5.5, 5, 2.6, '#a8e6cf', '#d4f5e6');
    // plant
    RR(cx - 6, topY - 4, 5, 4, 1, '#d98a62');
    E(cx - 5, topY - 7, 1.6, 3, '#62b872'); E(cx - 3, topY - 8, 1.6, 3.4, '#82c394'); E(cx - 1.4, topY - 6, 1.4, 2.4, '#62b872');
    return { cv: cv, ax: cx, ay: ty, topY: topY - ty };
  }

  function buildAvocado() {
    var cv = C.makeCanvas(44, 46), c = cv.getContext('2d');
    C.setCtx(c);
    var cx = 22;
    function pear(inset, col) {
      c.fillStyle = col; c.beginPath();
      c.moveTo(cx, 4 + inset);
      c.bezierCurveTo(cx + 6 - inset * .3, 4 + inset, cx + 9 - inset * .5, 14, cx + 16 - inset * .8, 24);
      c.bezierCurveTo(cx + 24 - inset, 34, cx + 17 - inset, 44 - inset, cx, 44 - inset);
      c.bezierCurveTo(cx - 17 + inset, 44 - inset, cx - 24 + inset, 34, cx - 16 + inset * .8, 24);
      c.bezierCurveTo(cx - 9 + inset * .5, 14, cx - 6 + inset * .3, 4 + inset, cx, 4 + inset);
      c.closePath(); c.fill();
    }
    pear(0, '#4f7a3a'); pear(1.6, '#6a9a4a'); pear(3.4, '#d9e69c'); pear(5.2, '#e8f0b4');
    // pit
    E(cx, 34, 7, 6.5, '#8a5a36'); E(cx, 33, 6.2, 5.6, '#a8744a'); E(cx - 2.2, 30.6, 2, 1.1, '#c8975f');
    R(cx - 18, 43, 36, 2, 'rgba(60,40,20,0.16)');
    return { cv: cv, ax: cx, ay: 44, faceY: 20 };
  }

  /* ---------- the room (painted once) ---------- */
  function miniPlant(g, x, base, r) {
    var pot = [PAL.terra, '#c9a070', PAL.blue, PAL.mauve][Math.floor(r() * 4)], lc = [PAL.sage, '#7f9d6a', '#6f9080'][Math.floor(r() * 3)];
    var w = 9 + r() * 3, h = 7 + r() * 2;
    for (var i = 0; i < 4; i++) {
      var a = -1.1 + i * 0.75 + r() * 0.2;
      g.fillStyle = T(lc); g.beginPath(); g.ellipse(x + Math.sin(a) * 4, base - h - 5 - Math.cos(a) * 3, 2.1, 5.2, a, 0, 6.2832); g.fill();
    }
    box(g, x - w / 2, base - h, w, h, pot, 1.8); box(g, x - w / 2 - 0.6, base - h, w + 1.2, 2.2, shade(pot, -0.12), 1);
  }
  function fillShelf(g, x0, x1, floorY, hmax, r, skip) {
    var x = x0 + 1, bi = 0;
    while (x < x1 - 4) {
      if (skip && x + 6 > skip[0] && x < skip[1]) { x = skip[1] + 2; continue; }
      var roll = r();
      if (roll < 0.1 && x + 14 < x1) { miniPlant(g, x + 7, floorY, r); x += 16; continue; }
      if (roll < 0.17 && x + 16 < x1) { // a little stack lying flat
        var sw = 14, y = floorY;
        for (var k = 0; k < 3; k++) { var hh = 3 + r() * 1.5; box(g, x, y - hh, sw - k * 1.2, hh, BOOKC[Math.floor(r() * BOOKC.length)], 0.8); y -= hh; }
        x += sw + 2; continue;
      }
      var w = 3.6 + r() * 3.2, h = hmax * (0.55 + r() * 0.4), c = BOOKC[Math.floor(r() * BOOKC.length)];
      if (x + w > x1 - 1) break;
      box(g, x, floorY - h, w, h, c, 1);
      box(g, x + w * 0.2, floorY - h + 3, w * 0.6, 1.1, shade(c, 0.35), 0.5);
      x += w + 0.5; bi++;
    }
  }
  function bookcase(g, bc, seed, skips) {
    var r = rng(seed), x = bc.x, y = bc.y, w = bc.w, h = bc.h, cab = bc.rows === 4 ? 46 : 40;
    var innerTop = y + 2, innerH = h - 2 - cab, rowH = innerH / bc.rows, i;
    box(g, x - 4, y - 5, w + 8, h + 5, PAL.wood, 3);
    box(g, x, innerTop, w, innerH, '#5e3b2c', 1);
    box(g, x, innerTop, w, 5, '#4a2f23');
    for (i = 0; i < bc.rows; i++) {
      var fy = innerTop + (i + 1) * rowH;
      fillShelf(g, x + 2, x + w - 2, fy, rowH - 9, r, skips && skips[i]);
      box(g, x - 2, fy, w + 4, 4, PAL.woodLt, 1);
    }
    box(g, x - 4, y + h - cab, w + 8, cab, PAL.wood, 2);
    var dw = (w - 6) / 2;
    [0, 1].forEach(function (d) { var dx = x + 1 + d * (dw + 4); box(g, dx, y + h - cab + 5, dw, cab - 10, shade(PAL.wood, -0.1), 2); box(g, dx + 3, y + h - cab + 8, dw - 6, cab - 16, shade(PAL.wood, 0.06), 1.5); ell(g, d ? dx + 4 : dx + dw - 4, y + h - cab / 2, 1.5, 1.5, '#ecd5a4'); });
    box(g, x - 7, y - 9, w + 14, 5, PAL.woodLt, 2);
  }

  function stoneBlocks(g, x, y, w, h, seed) {
    var r = rng(seed), rowH = 13, row = 0;
    box(g, x, y, w, h, PAL.stone);
    for (var yy = y; yy < y + h; yy += rowH, row++) {
      var off = row % 2 ? 10 : 0;
      g.fillStyle = T(PAL.stoneLn); g.fillRect(x, yy, w, 0.9);
      for (var xx = x - off; xx < x + w; xx += 21) { if (xx > x) g.fillRect(xx, yy, 0.9, rowH); }
      g.fillStyle = 'rgba(255,255,255,' + (0.05 + r() * 0.06).toFixed(2) + ')';
      g.fillRect(x + 2 + r() * (w - 14), yy + 2, 8 + r() * 8, rowH - 4);
    }
  }

  function checkerMug(g, x, y, s, col) { // x,y: bottom middle
    s = s || 1;
    g.save(); g.translate(x, y); g.scale(s, s);
    box(g, -6, -11, 12, 11, '#f4ead6', 2.2);
    g.save(); rr(g, -6, -11, 12, 11, 2.2); g.clip();
    for (var j = 0; j < 4; j++) for (var i = 0; i < 4; i++) if ((i + j) % 2 === 0) { g.fillStyle = T(col || PAL.navy); g.fillRect(-6 + i * 3, -11 + j * 2.75, 3, 2.75); }
    g.restore();
    g.strokeStyle = T('#f4ead6'); g.lineWidth = 1.8; g.beginPath(); g.arc(6.4, -5.6, 3, -1.45, 1.45); g.stroke();
    box(g, -6, -12, 12, 2, '#6a4a38', 1);
    g.restore();
  }

  function buildBackdrop() {
    var cv = C.makeCanvas(W, H), g = cv.getContext('2d'), r, i, x, y;
    C.setCtx(g);
    /* wall */
    box(g, 0, 0, W, FLOORY, '#cfa87c');
    var py0, pk = 0;
    for (py0 = 0; py0 < FLOORY; py0 += 13, pk++) {
      box(g, 0, py0, W, 13, pk % 2 ? '#c99f72' : '#d3ac80');
      g.fillStyle = 'rgba(96,58,32,0.28)'; g.fillRect(0, py0 + 12, W, 1);
      g.fillStyle = 'rgba(255,236,200,0.16)'; g.fillRect(0, py0, W, 1);
      g.strokeStyle = 'rgba(110,68,38,0.16)'; g.lineWidth = 0.7;
      for (var gk = 0; gk < 7; gk++) {
        var gx = ((pk * 97 + gk * 83) % W), gl = 30 + ((pk * 31 + gk * 17) % 60), gy = py0 + 3 + ((gk * 5 + pk * 3) % 8);
        g.beginPath(); g.moveTo(gx, gy); g.quadraticCurveTo(gx + gl * 0.5, gy + (gk % 2 ? 1.4 : -1.4), gx + gl, gy); g.stroke();
      }
      var jx = (pk * 131 + 40) % (W - 20); g.fillStyle = 'rgba(96,58,32,0.22)'; g.fillRect(jx, py0, 1, 13);
    }
    g.save(); archPath(g, GLASS.x - 26, GLASS.y - 26, GLASS.w + 52, 190); g.fillStyle = 'rgba(255,226,170,0.16)'; g.fill(); g.restore();
    box(g, 0, 0, W, 10, PAL.cream); box(g, 0, 10, W, 3, shade(PAL.wall, -0.12));
    /* wainscot */
    box(g, 0, 238, W, 62, PAL.wain);
    box(g, 0, 234, W, 6, PAL.cream); box(g, 0, 240, W, 2, shade(PAL.wain, -0.15));
    g.strokeStyle = T(PAL.wainLn); g.lineWidth = 1.2;
    for (x = 6; x < W; x += 70) { rr(g, x, 250, 58, 40, 3); g.stroke(); }
    box(g, 0, 292, W, 8, PAL.cream); box(g, 0, 291, W, 1.5, shade(PAL.cream, -0.15));
    /* floor */
    var rows = [300, 314, 331, 351, 375, 404, 432];
    for (i = 0; i < rows.length - 1; i++) {
      box(g, 0, rows[i], W, rows[i + 1] - rows[i], i % 2 ? PAL.floorA : PAL.floorB);
      g.fillStyle = T(PAL.seam); g.fillRect(0, rows[i + 1] - 0.9, W, 0.9);
      var pw = 96 + i * 20, off = (i * 53) % pw;
      for (x = -off; x < W; x += pw) g.fillRect(x, rows[i], 0.9, rows[i + 1] - rows[i]);
    }
    var sh = g.createLinearGradient(0, 300, 0, 316); sh.addColorStop(0, 'rgba(110,60,36,0.32)'); sh.addColorStop(1, 'rgba(110,60,36,0)');
    g.fillStyle = sh; g.fillRect(0, 300, W, 16);
    /* woven rug */
    var RX = 300, RY = 372;
    [[236, 56, '#b9694d'], [229, 50, '#efe0c8'], [219, 45, '#d9a64e'], [212, 41, '#efe0c8'], [200, 36, '#9bb08f'], [152, 26, '#efe0c8'], [146, 23, '#c4806a']].forEach(function (q) { ell(g, RX, RY, q[0], q[1], q[2]); });
    g.fillStyle = T('#efe0c8');
    for (i = 0; i < 40; i++) { var a = i / 40 * 6.2832; g.beginPath(); g.ellipse(RX + Math.cos(a) * 190, RY + Math.sin(a) * 31, 2.4, 1.6, 0, 0, 6.2832); g.fill(); }
    g.strokeStyle = T('#b9694d'); g.lineWidth = 1.4;
    for (i = 0; i < 14; i++) { var yy = RY - 20 + i * 3; g.beginPath(); g.moveTo(RX - 236 + 4, yy); g.lineTo(RX - 236 - 5, yy + 1); g.moveTo(RX + 236 - 4, yy); g.lineTo(RX + 236 + 5, yy + 1); g.stroke(); }
    /* chimney and fireplace */
    stoneBlocks(g, 72, 13, 52, 191, 4);
    box(g, 60, 198, 76, 12, PAL.wood, 2); box(g, 56, 194, 84, 6, PAL.woodLt, 2);
    box(g, 62, 210, 72, 90, PAL.stone); stoneBlocks(g, 62, 210, 72, 90, 9);
    g.save(); g.beginPath(); g.moveTo(FIREBOX.x, FIREBOX.y + FIREBOX.h); g.lineTo(FIREBOX.x, FIREBOX.y + 14); g.arc(FIREBOX.x + FIREBOX.w / 2, FIREBOX.y + 14, FIREBOX.w / 2, Math.PI, 0); g.lineTo(FIREBOX.x + FIREBOX.w, FIREBOX.y + FIREBOX.h); g.closePath();
    g.fillStyle = T('#3a2a26'); g.fill(); g.restore();
    box(g, 50, 298, 96, 11, '#dccab0', 3); box(g, 50, 298, 96, 3, '#ebdcc4', 1.5);
    /* the clock */
    ell(g, CLOCK.x, CLOCK.y + 1.5, CLOCK.r + 4, CLOCK.r + 4, 'rgba(0,0,0,0.12)');
    ell(g, CLOCK.x, CLOCK.y, CLOCK.r + 3.5, CLOCK.r + 3.5, PAL.woodDk); ell(g, CLOCK.x, CLOCK.y, CLOCK.r, CLOCK.r, '#f6ebd6');
    g.fillStyle = T(PAL.ink);
    for (i = 0; i < 12; i++) { var an = i / 12 * 6.2832; g.beginPath(); g.arc(CLOCK.x + Math.sin(an) * (CLOCK.r - 4), CLOCK.y - Math.cos(an) * (CLOCK.r - 4), i % 3 === 0 ? 1.5 : 0.9, 0, 6.2832); g.fill(); }
    /* a small framed print */
    box(g, 84, 148, 28, 36, PAL.woodDk, 2); box(g, 87, 151, 22, 30, '#f2e6d0', 1);
    [[98, 176, -0.5, 9], [98, 172, 0.6, 8], [98, 166, -0.6, 8], [98, 162, 0.5, 7]].forEach(function (l) { g.fillStyle = T(PAL.sage); g.beginPath(); g.ellipse(l[0] + Math.sin(l[2]) * 4, l[1] - 4, 2.2, l[3] * 0.55, l[2], 0, 6.2832); g.fill(); });
    g.strokeStyle = T('#7a8f6a'); g.lineWidth = 1; g.beginPath(); g.moveTo(98, 179); g.lineTo(98, 157); g.stroke();
    /* bookcases */
    var skip1 = []; skip1[1] = [BC1.x + 6, BC1.x + 32];
    bookcase(g, BC1, 21, skip1);
    var skip2 = []; 
    bookcase(g, BC2, 33, skip2);
    LIGHTS[0].y = Math.round(BC1.y + 2 + 2 * ((BC1.h - 2 - 46) / BC1.rows));
    /* counter shelves */
    function shelfBoard(s) {
      box(g, s.x, s.y, s.w, 5, PAL.woodLt, 1.5); box(g, s.x, s.y + 5, s.w, 2, shade(PAL.wall, -0.2));
      [s.x + 14, s.x + s.w - 14].forEach(function (bx) { poly(g, [[bx - 3, s.y + 5], [bx + 3, s.y + 5], [bx, s.y + 15]], PAL.woodDk); });
    }
    shelfBoard(SHELF1); shelfBoard(SHELF2);
    r = rng(14);
    [372, 392, 408, 520].forEach(function (mx, k) { checkerMug(g, mx, SHELF1.y, 0.95 + (k % 2) * 0.05, ['#4f7f6a', '#c9694a', '#e3a93a', '#7d4f96'][k]); });
    [[436, 5, 14, '#c4806a'], [441, 5, 17, '#d9a64e'], [446.6, 5, 15, '#8fa88a'], [452, 5, 12, '#7f9db3']].forEach(function (b) { box(g, b[0], SHELF1.y - b[2], b[1], b[2], b[3], 1); });
    [[487, 24], [498, 20]].forEach(function (j) { box(g, j[0], SHELF1.y - j[1], 9, j[1], '#e8dcc4', 2.5); box(g, j[0], SHELF1.y - j[1], 9, 4, PAL.terra, 1.5); });
    [372, 420, 452, 490].forEach(function (bx, k) { if (k === 1) { [0, 1, 2].forEach(function (q) { box(g, bx - 8, SHELF2.y - 4 - q * 4, 18 - q, 4, BOOKC[(q * 3 + 2) % BOOKC.length], 1); }); } else if (k === 2) miniPlant(g, bx, SHELF2.y, rng(7 + k)); else if (k === 3) { box(g, bx - 4, SHELF2.y - 18, 9, 18, '#e8dcc4', 2.5); box(g, bx - 4, SHELF2.y - 18, 9, 4, PAL.mustard, 1.5); } });
    [512, 524].forEach(function (bx, k) { box(g, bx, SHELF2.y - 15 + k * 4, 7, 15 - k * 4, BOOKC[k + 4], 1); });
    /* chalkboard menu */
    box(g, CHALK.x - 4, CHALK.y - 4, CHALK.w + 8, CHALK.h + 8, PAL.wood, 3); box(g, CHALK.x, CHALK.y, CHALK.w, CHALK.h, '#34443f', 1.5);
    g.strokeStyle = 'rgba(244,239,224,0.9)'; g.lineCap = 'round'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(CHALK.x + 10, CHALK.y + 12); g.bezierCurveTo(CHALK.x + 18, CHALK.y + 6, CHALK.x + 26, CHALK.y + 18, CHALK.x + 34, CHALK.y + 10); g.bezierCurveTo(CHALK.x + 40, CHALK.y + 6, CHALK.x + 46, CHALK.y + 14, CHALK.x + 52, CHALK.y + 10); g.stroke();
    g.lineWidth = 1.1; g.strokeStyle = 'rgba(244,239,224,0.7)';
    [24, 31, 38].forEach(function (ly, k) { g.beginPath(); g.moveTo(CHALK.x + 8, CHALK.y + ly); g.lineTo(CHALK.x + 38 - k * 4, CHALK.y + ly); g.stroke(); g.beginPath(); g.moveTo(CHALK.x + 44, CHALK.y + ly); g.lineTo(CHALK.x + 52, CHALK.y + ly); g.stroke(); });
    g.fillStyle = 'rgba(240,160,170,0.95)'; g.beginPath(); g.moveTo(CHALK.x + 30, CHALK.y + 48); g.bezierCurveTo(CHALK.x + 22, CHALK.y + 42, CHALK.x + 25, CHALK.y + 38, CHALK.x + 30, CHALK.y + 42); g.bezierCurveTo(CHALK.x + 35, CHALK.y + 38, CHALK.x + 38, CHALK.y + 42, CHALK.x + 30, CHALK.y + 48); g.fill();
    /* crown shadow at the top */
    var cs = g.createLinearGradient(0, 13, 0, 40); cs.addColorStop(0, 'rgba(110,60,36,0.18)'); cs.addColorStop(1, 'rgba(110,60,36,0)'); g.fillStyle = cs; g.fillRect(0, 13, W, 27);
    return cv;
  }

  /* the window frame, sill and curtains, painted over the sky */
  function buildWinFrame() {
    var cv = C.makeCanvas(W, H), g = cv.getContext('2d'), G = GLASS;
    C.setCtx(g);
    g.beginPath();
    (function ap(x, y, w, h) { var r = w / 2; g.moveTo(x, y + h); g.lineTo(x, y + r); g.arc(x + r, y + r, r, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); })(G.x - 8, G.y - 8, G.w + 16, G.h + 8);
    (function ap(x, y, w, h) { var r = w / 2; g.moveTo(x, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w, y + r); g.arc(x + r, y + r, r, 0, Math.PI, true); g.closePath(); })(G.x, G.y, G.w, G.h);
    g.fillStyle = T(PAL.cream); g.fill('evenodd');
    var cx = G.x + G.w / 2;
    box(g, cx - 2.5, G.y, 5, G.h, PAL.cream); box(g, G.x, G.y + 70, G.w, 5, PAL.cream);
    g.strokeStyle = T(PAL.cream); g.lineWidth = 3.6;
    [-0.55, 0.55].forEach(function (a) { g.beginPath(); g.moveTo(cx, G.y + G.w / 2); g.lineTo(cx + Math.sin(a) * G.w / 2, G.y + G.w / 2 - Math.cos(a) * G.w / 2); g.stroke(); });
    g.strokeStyle = 'rgba(120,80,50,0.25)'; g.lineWidth = 1;
    archPath(g, G.x - 8, G.y - 8, G.w + 16, G.h + 8); g.stroke();
    box(g, G.x - 14, G.y + G.h, G.w + 28, 8, '#f0e2cb', 2); box(g, G.x - 14, G.y + G.h + 8, G.w + 28, 3, shade(PAL.wall, -0.2), 1);
    /* curtains */
    box(g, G.x - 34, 44, G.w + 68, 4, PAL.woodDk, 2); ell(g, G.x - 34, 46, 4, 4, PAL.woodLt); ell(g, G.x + G.w + 34, 46, 4, 4, PAL.woodLt);
    function curtain(side) {
      var x0 = side < 0 ? G.x - 32 : G.x + G.w + 32, ed = side < 0 ? G.x + 10 : G.x + G.w - 10, f = side;
      g.fillStyle = T('#a3b46f'); g.beginPath(); g.moveTo(x0, 48); g.lineTo(ed, 48);
      g.bezierCurveTo(ed - f * 4, 100, ed - f * 10, 130, ed - f * 6, 150);
      g.bezierCurveTo(ed - f * 8, 170, ed - f * 4, 190, ed - f * 2, 204);
      g.lineTo(x0, 204); g.closePath(); g.fill();
      g.save(); g.clip();
      var lo = Math.min(x0, ed) - 14, hi = Math.max(x0, ed) + 14, cs = 9, kx, ky;
      g.fillStyle = 'rgba(255,248,225,0.34)';
      for (kx = lo - ((lo % (cs * 2)) + cs * 2) % (cs * 2); kx < hi; kx += cs * 2) g.fillRect(kx, 44, cs, 164);
      for (ky = 44; ky < 208; ky += cs * 2) g.fillRect(lo, ky, hi - lo, cs);
      g.restore();
      g.strokeStyle = 'rgba(80,100,70,0.22)'; g.lineWidth = 1.3;
      for (var k = 1; k < 4; k++) { var fx = x0 + (ed - x0) * k / 4; g.beginPath(); g.moveTo(fx, 52); g.bezierCurveTo(fx - f * 1, 100, fx - f * 3, 150, fx - f * 1, 202); g.stroke(); }
      box(g, side < 0 ? ed - 18 : ed - 2, 148, 20, 5, PAL.mustard, 2.5);
    }
    curtain(-1); curtain(1);
    return cv;
  }

  /* the counter's front, drawn in front of the barista */
  function buildCounter() {
    var cv = C.makeCanvas(CNT.w + 20, 90), g = cv.getContext('2d'), ox = CNT.x - 10, oy = CNT.y - 4;
    C.setCtx(g);
    function X(x) { return x - ox; } function Y(y) { return y - oy; }
    box(g, X(CNT.x + 6), Y(CNT.y + 12), CNT.w - 12, 62, PAL.terra, 2);
    for (var xx = 0; xx < 17; xx++) {
      box(g, X(CNT.x + 11 + xx * 11.6), Y(CNT.y + 16), 8.6, 52, xx % 2 ? '#c27a5a' : '#bb7054', 4);
      box(g, X(CNT.x + 12.6 + xx * 11.6), Y(CNT.y + 16), 2, 52, 'rgba(255,255,255,0.12)', 1);
    }
    box(g, X(CNT.x + 6), Y(CNT.y + 70), CNT.w - 12, 6, PAL.woodDk, 1.5);
    box(g, X(CNT.x), Y(CNT.y), CNT.w, 12, '#dcb784', 3); box(g, X(CNT.x), Y(CNT.y), CNT.w, 3.4, '#ebd0a2', 1.7); box(g, X(CNT.x + 2), Y(CNT.y + 12), CNT.w - 4, 2.4, 'rgba(70,35,20,0.25)');
    return { cv: cv, ox: ox, oy: oy };
  }

  function buildTable(tb) {
    var rx = tb.rx, ry = Math.round(rx * 0.3), pw = (rx + 12) * 2, ph = ry * 2 + 54;
    var cv = C.makeCanvas(pw, ph), g = cv.getContext('2d'), cx = pw / 2, ty = ry + 4;
    C.setCtx(g);
    ell(g, cx, ty + 40, rx * 0.46, 7, PAL.woodDk); ell(g, cx, ty + 38, rx * 0.46, 7, PAL.wood);
    box(g, cx - 5, ty + 6, 10, 33, PAL.wood, 2); box(g, cx - 5, ty + 6, 3, 33, 'rgba(255,255,255,0.12)');
    ell(g, cx, ty + 5, rx, ry, PAL.woodDk);
    var topc = tb.cloth === 'wood' ? '#cfa070' : (tb.cloth === 'checks' ? '#f0e3cc' : '#e7d3b0');
    ell(g, cx, ty, rx, ry, topc);
    g.save(); g.beginPath(); g.ellipse(cx, ty, rx, ry, 0, 0, 6.2832); g.clip();
    if (tb.cloth === 'checks') {
      g.fillStyle = 'rgba(185,105,77,0.55)'; var s = 8;
      for (var yy = -ry; yy < ry; yy += s) for (var xx = -rx; xx < rx; xx += s) if ((Math.round(xx / s) + Math.round(yy / s)) % 2 === 0) g.fillRect(cx + xx, ty + yy, s, s);
    } else if (tb.cloth === 'runner') {
      box(g, cx - rx, ty - 5, rx * 2, 10, '#7d4f96'); g.fillStyle = T(PAL.mustard); for (var k = -rx; k < rx; k += 8) g.fillRect(cx + k, ty - 1, 4, 2);
    } else {
      g.strokeStyle = 'rgba(122,78,54,0.28)'; g.lineWidth = 1;
      for (var q = -2; q <= 2; q++) { g.beginPath(); g.ellipse(cx, ty, rx * (0.35 + 0.15 * (q + 2)), ry * (0.35 + 0.15 * (q + 2)), 0, 0, 6.2832); g.stroke(); }
    }
    g.restore();
    g.strokeStyle = tb.cloth === 'wood' ? 'rgba(122,78,54,0.5)' : T(PAL.terra); g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(cx, ty, rx - 0.6, ry - 0.4, 0, 0, 6.2832); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(cx - rx * 0.3, ty - ry * 0.35, rx * 0.35, ry * 0.18, 0, 0, 6.2832); g.fill();
    return { cv: cv, ax: cx, ay: ty };
  }

  /* ---------- the scene ---------- */
  function Scene(canvas) {
    this.canvas = canvas;
    canvas.width = W * K; canvas.height = H * K;
    this.ctx = canvas.getContext('2d');
    this.state = { hour: 12, weather: 'clear', fire: true, mode: 'idle', plants: {}, player: Pe.defaultSpec(), calm: false, lights: {} };
    this.time = 0; this.last = null; this.hover = null;
    this.particles = []; this.watering = null; this.cheerAt = -99; this.pulse = {};
    this.build();
  }

  Scene.prototype.build = function () {
    var self = this, i, r = rng(99);
    placePlants();
    this.bg = buildBackdrop();
    this.winFrame = buildWinFrame();
    this.counterSpr = buildCounter();
    this.tableSpr = {};
    TABLES.forEach(function (tb) { self.tableSpr[tb.id] = buildTable(tb); });
    this.nookSpr = buildNook();
    this.avoSpr = buildAvocado();
    this.people = [];
    TABLES.forEach(function (tb) {
      tb.seats.forEach(function (s, idx) {
        var isPlayer = tb.id === PLAYER_SEAT.table && idx === PLAYER_SEAT.index;
        var spec = isPlayer ? self.state.player : Pe.roster[tb.id][s.r];
        self.people.push({
          id: tb.id + idx, table: tb.id, cx: tb.cx + s.dx, T: tb.ty + (s.dx === 0 ? -24 : -14), spec: spec, isPlayer: isPlayer, dx: s.dx,
          ph: r() * 6.28, chair: CHAIRS[(idx + (tb.id === 'fl' ? 1 : 0)) % CHAIRS.length], bubble: null, nextBubble: 6 + r() * 14, waveUntil: 0
        });
      });
    });
    this.nook = { x: NOOK.x, y: NOOK.y }; this.avoPos = { x: AVO.x, y: AVO.y }; this.dogPos = { x: DOGSPOT.x, y: DOGSPOT.y }; this.hearthPos = { x: HEARTH.x, y: HEARTH.y };
    this.barista = { cx: BARISTA.cx, T: BARISTA.T, waveUntil: 0, spec: Pe.cleanSpec({ name: 'Pia', skin: 6, hair: 'bun', hairColor: 1, body: 1, outfit: 'overalls', outfitColor: 4, glasses: 'none', facial: 'none', detail: 'freckles', hairAcc: 'none', headphones: false, hearing: false, seat: 'chair' }) };
    var rs = rng(5), GW = GLASS.w, GH = GLASS.h;
    this.stars = []; for (i = 0; i < 40; i++) this.stars.push({ x: rs() * GW, y: rs() * GH * 0.62, p: rs() * 6, big: rs() < 0.16 });
    this.clouds = []; for (i = 0; i < 6; i++) this.clouds.push({ x: rs() * GW, y: 14 + rs() * 52, s: 0.8 + rs() * 0.9, v: 1.4 + rs() * 3 });
    this.rain = []; for (i = 0; i < 46; i++) this.rain.push({ x: rs() * GW, y: rs() * GH, v: 90 + rs() * 60 });
    this.drops = []; for (i = 0; i < 16; i++) this.drops.push({ x: rs() * GW, y: rs() * GH * 0.7, v: 1.5 + rs() * 3, hold: rs() * 5 });
    this.snow = []; for (i = 0; i < 38; i++) this.snow.push({ x: rs() * GW, y: rs() * GH, v: 9 + rs() * 12, sw: rs() * 6, big: rs() < 0.3 });
    this.motes = []; for (i = 0; i < 18; i++) this.motes.push({ x: 150 + rs() * 300, y: 150 + rs() * 200, v: 2 + rs() * 3, p: rs() * 6 });
    this.cat = { x: WAYPOINTS[0][0], y: WAYPOINTS[0][1], dir: 1, state: 'walk', timer: 6, body: '#34323c', belly: '#f7f2ea', target: 1 };
    this.catPetUntil = 0;
  };

  Scene.prototype.setState = function (o) {
    for (var k in o) {
      if (k === 'player') { this.state.player = Pe.cleanSpec(o.player); this.people.forEach(function (p) { if (p.isPlayer) p.spec = this.state.player; }, this); }
      else this.state[k] = o[k];
    }
  };
  Scene.prototype.emit = function (kind, x, y, n, opts) {
    opts = opts || {};
    for (var i = 0; i < (n || 6); i++) {
      var a = Math.random() * 6.28, sp = (opts.speed || 22) * (0.4 + Math.random());
      var p = { kind: kind, x: x + (Math.random() - 0.5) * (opts.spread || 6), y: y + (Math.random() - 0.5) * (opts.spread || 6), life: 0, max: (opts.life || 1) * (0.7 + Math.random() * 0.6), col: null };
      if (kind === 'spark') { p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 10; p.col = ['#fff3a8', '#ffd96a', '#ffffff', '#ffc2d9'][i % 4]; p.g = 0; }
      else if (kind === 'heart') { p.vx = (Math.random() - 0.5) * 12; p.vy = -14 - Math.random() * 8; p.g = 0; p.col = '#e8607a'; }
      else if (kind === 'drop') { p.vx = (opts.vx || 0) + (Math.random() - 0.5) * 6; p.vy = 10 + Math.random() * 10; p.g = 90; p.col = '#7ec3f0'; }
      else if (kind === 'conf') { p.vx = Math.cos(a) * sp * 1.4; p.vy = -sp * 1.6 - 10; p.g = 70; p.col = ['#f4a6b8', '#ffd96a', '#a8d5ba', '#bcd7f2', '#c9a7ff'][i % 5]; }
      else if (kind === 'leaf') { p.vx = (Math.random() - 0.5) * 18; p.vy = -6 - Math.random() * 8; p.g = 14; p.col = '#7fc96e'; }
      else if (kind === 'z') { p.vx = 4; p.vy = -7; p.g = 0; p.col = '#ffffff'; p.max = 2.4; }
      this.particles.push(p);
    }
  };
  Scene.prototype.sparkle = function (slotId, big) {
    var s = Pl.SLOTS[slotId]; if (!s) return;
    var r = Pl.rectFor(s);
    this.emit('spark', r.x + r.w / 2, r.y + r.h / 2, big ? 18 : 10, { spread: 14, speed: 26, life: 1.1 });
    if (big) this.emit('leaf', r.x + r.w / 2, r.y + r.h / 2, 5, { spread: 10 });
    this.pulse[slotId] = this.time + 1.0;
  };
  Scene.prototype.water = function (slotId) { this.watering = { slot: slotId, t0: this.time }; };
  Scene.prototype.cheer = function () {
    this.cheerAt = this.time;
    this.emit('conf', W / 2, 190, 44, { spread: 120, speed: 44, life: 1.8 });
  };
  Scene.prototype.petCat = function () {
    this.cat.state = 'sit'; this.cat.timer = 4; this.catPetUntil = this.time + 2;
    this.emit('heart', this.cat.x, this.cat.y - 20, 4, { spread: 8 });
  };
  Scene.prototype.hugAvocado = function () { this.avoJoy = this.time + 1.6; this.emit('heart', this.avoPos.x, this.avoPos.y - 40, 4, { spread: 10 }); };
  Scene.prototype.waveAt = function (id) {
    this.people.forEach(function (p) { if (p.id === id) { p.waveUntil = this.time + 1.6; p.bubble = { name: 'heart', until: this.time + 2.2 }; } }, this);
  };
  Scene.prototype.waveBarista = function () { this.barista.waveUntil = this.time + 1.8; this.emit('heart', this.barista.cx, this.barista.T - 36, 2, { spread: 5 }); };
  Scene.prototype.heartAtPlayer = function () {
    this.people.forEach(function (p) { if (p.isPlayer) { p.waveUntil = this.time + 1.5; this.emit('heart', p.cx, p.T - 30, 3, { spread: 6 }); } }, this);
  };

  Scene.prototype.drawNook = function (g, t) {
    var n = this.nookSpr, x = this.nook.x, y = this.nook.y;
    C.blit(g, n.cv, x - n.ax, y - n.ay);
    var topY = y + n.topY;
    var fl = Math.sin(t * 9) > 0 ? 1 : 0;
    R(x - 14, topY - 9 - fl, 1, 3 + fl, '#ffd96a'); P(x - 14, topY - 10 - fl, '#ff9a3a');
    // three face down cards in a little fan
    var cdy = Math.round(Math.sin(t * 1.4));
    [[-8, -1], [-1, -2], [6, -1]].forEach(function (c, ci) {
      var cx = x + c[0], cy = topY + c[1] + (ci === 1 ? cdy : 0);
      R(cx, cy - 4, 6, 8, '#4f3a6e'); R(cx, cy - 4, 6, 1, '#f5d98a'); R(cx, cy + 3, 6, 1, '#f5d98a'); R(cx, cy - 4, 1, 8, '#f5d98a'); R(cx + 5, cy - 4, 1, 8, '#f5d98a');
      P(cx + 3, cy, '#f5d98a'); P(cx + 2, cy, '#f5d98a'); P(cx + 3, cy - 1, '#f5d98a'); P(cx + 3, cy + 1, '#f5d98a');
    });
    // a cutesy wooden sign on a little post
    (function () {
      var px = x + 1, base = topY - 6, py = topY - 30, sway = Math.sin(t * 1.1) * 0.025;
      g.save();
      R(px - 1, py + 6, 3, base - py - 6, '#8a5a2e'); R(px, py + 6, 1, base - py - 6, '#a8743e');
      g.translate(px, py + 6); g.rotate(sway); g.translate(-px, -(py + 6));
      g.fillStyle = 'rgba(60,30,10,0.18)'; g.beginPath(); g.ellipse(px, py + 14, 20, 2, 0, 0, 6.2832); g.fill();
      g.beginPath(); g.moveTo(px - 19, py - 1); g.lineTo(px + 19, py - 1);
      g.arcTo(px + 22, py - 1, px + 22, py + 2, 3); g.lineTo(px + 22, py + 11); g.arcTo(px + 22, py + 14, px + 19, py + 14, 3);
      g.lineTo(px - 19, py + 14); g.arcTo(px - 22, py + 14, px - 22, py + 11, 3); g.lineTo(px - 22, py + 2); g.arcTo(px - 22, py - 1, px - 19, py - 1, 3); g.closePath();
      g.fillStyle = '#d9a566'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#9a6a38'; g.stroke();
      g.fillStyle = 'rgba(255,240,205,0.4)'; g.fillRect(px - 19, py, 38, 1.2);
      g.strokeStyle = 'rgba(140,90,45,0.35)'; g.lineWidth = 0.5;
      [[-17, 3, -8], [4, 11, 16], [-12, 12, -2]].forEach(function (w) { g.beginPath(); g.moveTo(px + w[0], py + w[1]); g.lineTo(px + w[2], py + w[1]); g.stroke(); });
      Ec2(px - 19, py + 6.5, 1, '#8a5a2e'); Ec2(px + 19, py + 6.5, 1, '#8a5a2e');
      g.font = '700 7px Fredoka, Nunito, ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#6a3f1e'; g.fillText('pick a card', px, py + 7.2);
      g.restore();
      function Ec2(ex, ey, r, col) { g.fillStyle = col; g.beginPath(); g.arc(ex, ey, r, 0, 6.2832); g.fill(); }
    })();
    if (Math.sin(t * 2.2) > 0.85) { P(x + 12, topY - 16, '#ffffff'); P(x + 11, topY - 15, '#ffffff'); P(x + 13, topY - 15, '#ffffff'); }
    if (Math.random() < 0.02) this.emit('spark', x + 13, topY - 14, 1, { spread: 4, speed: 8, life: 1 });
  };

  Scene.prototype.drawHearthPet = function (g, t) {
    var hp = this.hearthPos, cx = hp.x, cy = hp.y, b2 = Math.sin(t * 1.7) > 0 ? 1 : 0;
    // stone hearth slab and a cushion
    E(cx, cy + 2, 26, 8, '#cdbba0'); E(cx, cy + 1, 26, 8, '#e3d4bc');
    E(cx, cy, 14, 5, '#9d78c8'); E(cx, cy - 1, 14, 5, '#b99be0');
    if (Math.random() < 0.006) this.emit('z', cx + 10, cy - 12, 1, { spread: 2 });
  };
  Scene.prototype.drawAvocado = function (g, t) {
    var a = this.avoSpr, x = this.avoPos.x, y = this.avoPos.y;
    var sq = Math.sin(t * 1.3) > 0.5 ? 1 : 0;
    C.blit(g, a.cv, x - a.ax, y - a.ay + sq);
    var fy = y - a.ay + a.faceY + sq;
    var blink = ((t * 0.9) % 4.3) < 0.14;
    if (this.avoJoy && this.avoJoy > t) { P(x - 6, fy, '#2a1f2a'); P(x - 5, fy - 1, '#2a1f2a'); P(x - 4, fy, '#2a1f2a'); P(x + 4, fy, '#2a1f2a'); P(x + 5, fy - 1, '#2a1f2a'); P(x + 6, fy, '#2a1f2a'); }
    else if (blink) { R(x - 6, fy + 1, 3, 1, '#2a1f2a'); R(x + 4, fy + 1, 3, 1, '#2a1f2a'); }
    else { R(x - 6, fy - 1, 2, 3, '#2a1f2a'); R(x + 4, fy - 1, 2, 3, '#2a1f2a'); P(x - 6, fy - 1, '#ffffff'); P(x + 4, fy - 1, '#ffffff'); }
    R(x - 10, fy + 3, 3, 2, '#f4a0a8'); R(x + 8, fy + 3, 3, 2, '#f4a0a8');
    R(x - 2, fy + 4, 5, 1, '#8a3a3a'); P(x - 3, fy + 3, '#8a3a3a'); P(x + 3, fy + 3, '#8a3a3a'); R(x - 1, fy + 5, 3, 1, '#c85a62');
  };
  Scene.prototype.drawDog = function (g, t) {
    var x = this.dogPos.x, y = this.dogPos.y;
    g.fillStyle = 'rgba(96,52,30,0.16)'; g.beginPath(); g.ellipse(x, y + 1, 12, 3, 0, 0, 6.2832); g.fill();
  };

  Scene.prototype.softShadow = function (g, x, y, rx, ry, a) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    var gr = g.createRadialGradient(0, 0, rx * 0.25, 0, 0, rx);
    gr.addColorStop(0, 'rgba(96,52,30,' + Math.min(0.5, a * 0.75) + ')'); gr.addColorStop(1, 'rgba(96,52,30,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 6.283); g.fill();
    g.restore();
  };

  Scene.prototype.updateBubbles = function (t) {
    var mode = this.state.mode;
    var focusIcons = ['spark', 'note', 'leaf', 'check'], breakIcons = ['coffee', 'heart', 'note', 'spark'];
    this.people.forEach(function (p) {
      if (p.bubble && p.bubble.until < t) p.bubble = null;
      if (!p.bubble && t > p.nextBubble) {
        var list = mode === 'break' ? breakIcons : focusIcons;
        p.bubble = { name: list[Math.floor(Math.random() * list.length)], until: t + 2.6 };
        p.nextBubble = t + (mode === 'break' ? 5 + Math.random() * 8 : 14 + Math.random() * 26);
      }
    });
  };

  Scene.prototype.updateParticles = function (dt) {
    var out = [];
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.life += dt; if (p.life >= p.max) continue;
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      out.push(p);
    }
    this.particles = out.slice(-260);
  };

  Scene.prototype.drawWatering = function (g, t) {
    var w = this.watering; if (!w) return;
    var el = t - w.t0;
    if (el > 1.1) { this.watering = null; return; }
    var s = Pl.SLOTS[w.slot], r = Pl.rectFor(s);
    var cx = s.x + 12, cy = r.y - 2;
    var tilt = el > 0.15 && el < 0.95;
    R(cx, cy, 9, 7, '#7fb5d9'); R(cx, cy, 9, 1, '#a8d1ea'); R(cx, cy + 6, 9, 1, '#5f8fb0');
    R(cx + 9, cy + 1, 2, 5, '#5f8fb0'); R(cx + 1, cy - 2, 7, 2, '#5f8fb0');
    R(cx - 4, cy + (tilt ? 3 : 1), 4, 1, '#7fb5d9'); R(cx - 5, cy + (tilt ? 4 : 2), 2, 1, '#7fb5d9');
    if (tilt && Math.random() < 0.7) this.emit('drop', cx - 5, cy + 6, 1, { spread: 1, life: 0.6, vx: -4 });
  };


  /* hit testing, in scene pixels */
  function inRect(x, y, r) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }
  Scene.prototype.hit = function (x, y) {
    var i, st = this.state, r;
    for (i = 0; i < Pl.SLOTS.length; i++) {
      var s = Pl.SLOTS[i], p = st.plants[s.id];
      if (!p || !p.unlocked) continue;
      r = Pl.rectFor(s);
      if (inRect(x, y, r)) return { type: 'plant', id: s.id, rect: r };
    }
    for (i = this.people.length - 1; i >= 0; i--) {
      var pe = this.people[i]; r = { x: pe.cx - 16, y: pe.T - 58, w: 32, h: 62 };
      if (inRect(x, y, r)) return { type: pe.isPlayer ? 'player' : 'npc', id: pe.id, name: pe.spec.name, rect: r };
    }
    var c = this.cat; r = { x: c.x - 22, y: c.y - 24, w: 44, h: 28 };
    if (inRect(x, y, r)) return { type: 'cat', id: 'cat', name: 'Biscuit', rect: r };
    r = { x: TAN_CAT.x - 16, y: TAN_CAT.y - 34, w: 32, h: 36 };
    if (inRect(x, y, r)) return { type: 'cat', id: 'cat', name: 'Mochi', rect: r };
    r = { x: this.dogPos.x - 16, y: this.dogPos.y - 34, w: 32, h: 36 };
    if (inRect(x, y, r)) return { type: 'dog', id: 'dog', name: 'Waffles', rect: r };
    r = { x: this.hearthPos.x - 22, y: this.hearthPos.y - 26, w: 44, h: 28 };
    if (inRect(x, y, r)) return { type: 'pebble', id: 'pebble', name: 'Pebble', rect: r };
    r = { x: this.avoPos.x - 33, y: this.avoPos.y - 66, w: 66, h: 68 };
    if (inRect(x, y, r)) return { type: 'avocado', id: 'avocado', name: 'The avocado chair', rect: r };
    r = { x: this.nook.x - 36, y: this.nook.y - 92, w: 72, h: 96 };
    if (inRect(x, y, r)) return { type: 'cards', id: 'cards', rect: r };
    var b = this.barista; r = { x: b.cx - 17, y: b.T - 58, w: 34, h: 38 };
    if (inRect(x, y, r)) return { type: 'barista', id: 'barista', name: 'Pia, your barista', rect: r };
    for (i = 0; i < LIGHTS.length; i++) {
      var L = LIGHTS[i]; r = { x: L.x - 11, y: L.y - (L.kind === 'glass' ? 30 : 22), w: 22, h: L.kind === 'glass' ? 32 : 24 };
      if (inRect(x, y, r)) return { type: 'light', id: L.id, name: L.name, rect: r };
    }
    r = { x: FIREBOX.x - 4, y: FIREBOX.y, w: FIREBOX.w + 8, h: FIREBOX.h };
    if (inRect(x, y, r)) return { type: 'fire', id: 'fire', rect: r };
    r = { x: CLOCK.x - CLOCK.r - 3, y: CLOCK.y - CLOCK.r - 3, w: CLOCK.r * 2 + 6, h: CLOCK.r * 2 + 6 };
    if (inRect(x, y, r)) return { type: 'clock', id: 'clock', rect: r };
    r = { x: GLASS.x, y: GLASS.y, w: GLASS.w, h: GLASS.h };
    if (inRect(x, y, r)) return { type: 'window', id: 'window', rect: r };
    r = { x: CHALK.x - 4, y: CHALK.y - 4, w: CHALK.w + 8, h: CHALK.h + 8 };
    if (inRect(x, y, r)) return { type: 'sign', id: 'sign', rect: r };
    r = { x: CNT.x, y: CNT.y - 36, w: CNT.w, h: 106 };
    if (inRect(x, y, r)) return { type: 'counter', id: 'counter', rect: r };
    r = { x: BC1.x - 6, y: BC1.y - 8, w: BC1.w + 12, h: BC1.h + 8 };
    if (inRect(x, y, r)) return { type: 'books', id: 'books', rect: r };
    r = { x: BC2.x - 6, y: BC2.y - 8, w: BC2.w + 12, h: BC2.h + 8 };
    if (inRect(x, y, r)) return { type: 'books', id: 'books', rect: r };
    r = { x: 0, y: 8, w: W, h: 24 };
    if (inRect(x, y, r)) return { type: 'light', id: 'strings', name: 'String lights', rect: r };
    return null;
  };

  /* ---------- the window sky ---------- */
  Scene.prototype.drawSky = function (g, t) {
    var st = this.state, h = st.hour, sky = this.sky, wx = st.weather, G = GLASS, GW = G.w, GH = G.h, i;
    g.save(); archPath(g, G.x, G.y, G.w, G.h); g.clip(); g.translate(G.x, G.y);
    var top = sky.top, bot = sky.bot;
    if (wx === 'cloudy') { top = mix(top, '#9aa4b0', 0.5); bot = mix(bot, '#b9c0c9', 0.5); }
    else if (wx === 'rain') { top = mix(top, '#7c8796', 0.62); bot = mix(bot, '#98a2b0', 0.62); }
    else if (wx === 'snow') { top = mix(top, '#c4cfdb', 0.45); bot = mix(bot, '#dde5ee', 0.45); }
    var gr = g.createLinearGradient(0, 0, 0, GH); gr.addColorStop(0, T(top)); gr.addColorStop(0.5, T(mix(top, bot, 0.62))); gr.addColorStop(0.82, T(bot)); gr.addColorStop(1, T(mix(bot, '#ffffff', 0.25)));
    g.fillStyle = gr; g.fillRect(0, 0, GW, GH);
    var night = clamp((sky.ta - 0.1) / 0.4, 0, 1);
    var sa = clamp(sky.star * (wx === 'clear' ? 1 : wx === 'snow' ? 0.3 : 0.1), 0, 1);
    if (sa > 0.05) this.stars.forEach(function (s) {
      var tw = 0.5 + 0.5 * Math.sin(t * 1.6 + s.p);
      g.fillStyle = 'rgba(255,255,240,' + (sa * (0.45 + 0.55 * tw)).toFixed(2) + ')';
      g.beginPath(); g.arc(s.x, s.y, s.big ? 1.3 : 0.8, 0, 6.2832); g.fill();
    });
    var hh = ((h % 24) + 24) % 24, dim = wx === 'clear' ? 1 : 0.45;
    if (hh >= 6 && hh <= 19.6) {
      var p = (hh - 6) / 13.6, sx = 14 + p * (GW - 28), sy = GH - 36 - Math.sin(p * Math.PI) * (GH * 0.6);
      var low = 1 - Math.sin(p * Math.PI), sc = T(mix('#fff0b0', '#f09a5a', clamp(low * 1.4, 0, 1)));
      var sg = g.createRadialGradient(sx, sy, 2, sx, sy, 46);
      sg.addColorStop(0, 'rgba(255,248,220,' + (0.85 * dim).toFixed(2) + ')'); sg.addColorStop(0.25, 'rgba(255,230,170,' + (0.35 * dim).toFixed(2) + ')'); sg.addColorStop(1, 'rgba(255,220,160,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, 46, 0, 6.2832); g.fill();
      g.globalAlpha = dim; g.fillStyle = T(mix('#fffbe6', '#f6b06a', clamp(low * 1.2, 0, 1))); g.beginPath(); g.arc(sx, sy, 6, 0, 6.2832); g.fill(); g.globalAlpha = 1;
    }
    if (hh >= 18.8 || hh <= 6.7) {
      var mp = clamp(((hh + 24 - 18.8) % 24) / 11.9, 0, 1), mx = 14 + mp * (GW - 28), my = GH - 40 - Math.sin(mp * Math.PI) * (GH * 0.55);
      g.globalAlpha = dim; g.fillStyle = 'rgba(255,246,214,0.22)'; g.beginPath(); g.arc(mx, my, 13, 0, 6.2832); g.fill();
      g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(mx, my, 8, 0, 6.2832); g.fill();
      g.fillStyle = T(mix(sky.top, sky.bot, 0.3)); g.beginPath(); g.arc(mx + 3.4, my - 1.6, 6.6, 0, 6.2832); g.fill(); g.globalAlpha = 1;
    }
    var nm = night * 0.75, wxm = wx === 'clear' ? 0 : 0.3;
    function lc(c, hz) { var q = mix(c, sky.bot, hz); q = mix(q, '#1d2340', nm); if (wxm) q = mix(q, '#8a96a2', wxm); return T(q); }
    function hill(fn, col) { g.fillStyle = col; g.beginPath(); g.moveTo(0, GH); for (var x = 0; x <= GW; x += 3) g.lineTo(x, fn(x)); g.lineTo(GW, GH); g.closePath(); g.fill(); }
    function y1(x) { return GH * 0.56 + 9 * Math.sin(x * 0.035 + 0.6) + 4 * Math.sin(x * 0.11); }
    function y2(x) { return GH * 0.66 + 7 * Math.sin(x * 0.045 + 2.2) + 3 * Math.sin(x * 0.13 + 1); }
    function y3(x) { return GH * 0.78 + 5 * Math.sin(x * 0.05 + 4) + 2.5 * Math.sin(x * 0.12); }
    hill(y1, lc('#8fa6b4', 0.5));
    hill(y2, lc('#7c9c8e', 0.28));
    // far trees along the middle ridge: soft round crowns
    for (var ti = 0; ti < 46; ti++) {
      var tx = (ti * 37 + 11) % GW, tr = 3 + (ti * 7 % 4), ty = y2(tx);
      g.fillStyle = lc(ti % 3 ? '#5f8a6c' : '#6f9a72', 0.2); g.beginPath(); g.ellipse(tx, ty - tr * 0.6, tr, tr * 0.9, 0, 0, 6.2832); g.fill();
    }
    hill(y3, lc('#5f8c63', 0.08));
    for (var tj = 0; tj < 64; tj++) {
      var ux = (tj * 29 + 5) % GW, ur = 2.6 + (tj * 5 % 4) * 0.8, uy = y3(ux);
      g.fillStyle = lc('#4a7452', 0); g.beginPath(); g.ellipse(ux, uy - ur * 0.5, ur, ur * 1.05, 0, 0, 6.2832); g.fill();
      g.fillStyle = lc('#6b9a6a', 0); g.beginPath(); g.ellipse(ux - ur * 0.25, uy - ur * 0.8, ur * 0.55, ur * 0.55, 0, 0, 6.2832); g.fill();
    }
    if (wx === 'snow') { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, GH - 6, GW, 6); }
    var cc = mix('#ffffff', sky.bot, 0.25);
    if (wx === 'cloudy') cc = '#d4d9df'; else if (wx === 'rain') cc = '#a3acb8'; else if (wx === 'snow') cc = '#e6ebf1';
    cc = T(mix(cc, '#2a2a4a', night * 0.65));
    var count = wx === 'clear' ? 3 : 6, calm = st.calm ? 0.3 : 1;
    for (i = 0; i < count; i++) {
      var cl = this.clouds[i], cx = ((cl.x + t * cl.v * calm) % (GW + 90)) - 45, cy = cl.y, s = cl.s;
      var sh = T(mix(cc, sky.top, 0.3));
      g.globalAlpha = wx === 'clear' ? 0.92 : 0.97;
      var puffs = [[0, 0, 16, 5], [-11, -2, 10, 5.5], [9, -3, 12, 6.5], [-2, -5, 9, 6], [18, 0, 9, 4]];
      g.fillStyle = sh; g.beginPath(); puffs.forEach(function (q) { g.ellipse(cx + q[0] * s, cy + 1.6 * s + q[1] * s, q[2] * s, q[3] * s, 0, 0, 6.2832); }); g.fill();
      g.fillStyle = cc; g.beginPath(); puffs.forEach(function (q) { g.ellipse(cx + q[0] * s, cy + q[1] * s - 0.8 * s, q[2] * s, q[3] * s * 0.92, 0, 0, 6.2832); }); g.fill();
      g.globalAlpha = 1;
    }
    var dt = this.dt || 0.033;
    if (wx === 'rain') {
      g.strokeStyle = 'rgba(214,234,255,0.85)'; g.lineWidth = 1; g.lineCap = 'round';
      this.rain.forEach(function (d) {
        d.y += d.v * dt * calm; d.x -= d.v * 0.12 * dt * calm;
        if (d.y > GH) { d.y = -6; d.x = Math.random() * GW; } if (d.x < 0) d.x += GW;
        g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - 0.7, d.y + 5); g.stroke();
      });
      this.drops.forEach(function (d) {
        if (d.hold > 0) d.hold -= dt; else d.y += d.v * dt * 4 * calm;
        if (d.y > GH) { d.y = Math.random() * 10; d.x = Math.random() * GW; d.hold = 1 + Math.random() * 5; }
        g.fillStyle = 'rgba(236,246,255,0.8)'; g.beginPath(); g.ellipse(d.x, d.y, 0.9, 1.5, 0, 0, 6.2832); g.fill();
      });
    } else if (wx === 'snow') {
      g.fillStyle = '#ffffff';
      this.snow.forEach(function (f) {
        f.y += f.v * dt * calm; if (f.y > GH) { f.y = -3; f.x = Math.random() * GW; }
        g.beginPath(); g.arc(f.x + Math.sin(t * 0.8 + f.sw) * 3, f.y, f.big ? 1.5 : 1, 0, 6.2832); g.fill();
      });
    }
    g.restore();
  };

  /* ---------- things that move in the room ---------- */
  Scene.prototype.drawStrings = function (g, t) {
    var on = lit(this.state, 'strings'), cols = ['#f6d27a', '#f0a070', '#a8c8b0', '#e8a0b0'], night = clamp((this.sky.ta - 0.1) / 0.4, 0, 1);
    g.strokeStyle = T('#5b4237'); g.lineWidth = 0.9; g.lineCap = 'round';
    for (var s = 0; s < 8; s++) {
      var x0 = s * 72, x1 = x0 + 72, ym = 27 + (s % 2) * 2;
      g.beginPath(); g.moveTo(x0, 14); g.quadraticCurveTo((x0 + x1) / 2, ym + 4, x1, 14); g.stroke();
      for (var k = 1; k <= 5; k++) {
        var u = k / 6, bx = x0 + 72 * u, by = (1 - u) * (1 - u) * 14 + 2 * (1 - u) * u * (ym + 4) + u * u * 14 + 2;
        var c = cols[(s + k) % 4], tw = 0.8 + 0.2 * Math.sin(t * 2 + s * 3 + k);
        if (on) {
          g.fillStyle = 'rgba(255,214,140,' + (0.1 + 0.2 * night).toFixed(2) + ')'; g.beginPath(); g.arc(bx, by, 4.5, 0, 6.2832); g.fill();
          g.globalAlpha = tw; g.fillStyle = T(c); g.beginPath(); g.arc(bx, by, 1.9, 0, 6.2832); g.fill(); g.globalAlpha = 1;
        } else { g.fillStyle = T(mix(c, '#6a5a4a', 0.65)); g.beginPath(); g.arc(bx, by, 1.7, 0, 6.2832); g.fill(); }
      }
    }
  };
  Scene.prototype.drawPendants = function (g, t) {
    PENDANTS.forEach(function (p, i) {
      g.strokeStyle = T(PAL.ink); g.lineWidth = 0.9; g.beginPath(); g.moveTo(p.x, 13); g.lineTo(p.x, p.h - 11); g.stroke();
      var col = i ? PAL.mustard : PAL.terra;
      g.fillStyle = T(col); g.beginPath(); g.moveTo(p.x - 13, p.h); g.quadraticCurveTo(p.x - 11, p.h - 14, p.x, p.h - 14); g.quadraticCurveTo(p.x + 11, p.h - 14, p.x + 13, p.h); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(p.x - 5, p.h - 8, 2.4, 4, 0.5, 0, 6.2832); g.fill();
      g.fillStyle = '#ffe9b0'; g.beginPath(); g.ellipse(p.x, p.h + 0.8, 7.5, 2.2, 0, 0, 6.2832); g.fill();
    });
  };
  Scene.prototype.drawFire = function (g, t) {
    var f = FIREBOX, cx = f.x + f.w / 2, base = f.y + f.h - 2;
    box(g, cx - 15, base - 5, 30, 7, '#6a4030', 3.5); box(g, cx - 11, base - 10, 23, 6, '#7a4e36', 3); ell(g, cx - 13, base - 2, 2.6, 3, '#8a5a40'); ell(g, cx + 14, base - 2, 2.6, 3, '#8a5a40');
    if (this.state.fire) {
      var fl = Math.sin(t * 9) * Math.sin(t * 5.3);
      [[0, 25, 11, '#d9663a'], [-8, 17, 8, '#e08a42'], [8, 19, 8, '#e08a42'], [0, 17, 7, '#f0b050'], [-1, 9, 4.5, '#f8dc8a']].forEach(function (q, i) {
        var h = q[1] + fl * 2.6 + Math.sin(t * 7 + i * 2) * 1.4, w = q[2], x = cx + q[0], sw = Math.sin(t * 4.5 + i) * 1.8;
        g.fillStyle = T(q[3]); g.beginPath(); g.moveTo(x, base - 3); g.quadraticCurveTo(x - w, base - h * 0.45, x + sw, base - h - 3); g.quadraticCurveTo(x + w, base - h * 0.45, x, base - 3); g.fill();
      });
    } else { ell(g, cx, base - 5, 12, 2.4, '#5a4038'); }
  };
  Scene.prototype.drawClockHands = function (g) {
    var d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
    g.strokeStyle = T(PAL.ink); g.lineCap = 'round';
    g.lineWidth = 1.9; g.beginPath(); g.moveTo(CLOCK.x, CLOCK.y); g.lineTo(CLOCK.x + Math.sin(h / 12 * 6.2832) * 10, CLOCK.y - Math.cos(h / 12 * 6.2832) * 10); g.stroke();
    g.lineWidth = 1.3; g.beginPath(); g.moveTo(CLOCK.x, CLOCK.y); g.lineTo(CLOCK.x + Math.sin(m / 60 * 6.2832) * 15, CLOCK.y - Math.cos(m / 60 * 6.2832) * 15); g.stroke();
    g.fillStyle = T('#b9694d'); g.beginPath(); g.arc(CLOCK.x, CLOCK.y, 1.7, 0, 6.2832); g.fill();
  };
  function saltLamp(g, x, y, on, t) {
    box(g, x - 8, y - 3.4, 16, 3.4, PAL.woodDk, 1.6);
    g.fillStyle = T(on ? '#f09a68' : '#c9a08a'); g.beginPath(); g.moveTo(x - 6.8, y - 3.4); g.bezierCurveTo(x - 9.4, y - 10, x - 5.6, y - 17, x - 1, y - 17.6); g.bezierCurveTo(x + 4.6, y - 18, x + 9.6, y - 10, x + 6.8, y - 3.4); g.closePath(); g.fill();
    if (on) { g.fillStyle = 'rgba(255,214,160,' + (0.55 + 0.1 * Math.sin(t * 1.7)).toFixed(2) + ')'; g.beginPath(); g.ellipse(x - 0.4, y - 9.6, 3.8, 5.4, 0, 0, 6.2832); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(x - 3.4, y - 12, 1.4, 2.6, 0.4, 0, 6.2832); g.fill();
  }
  function glassLamp(g, x, y, on) {
    box(g, x - 5, y - 2.6, 10, 2.6, PAL.woodDk, 1.3); box(g, x - 1.1, y - 13, 2.2, 11, PAL.woodDk);
    var cy = y - 13, r = 11;
    for (var i = 0; i < 6; i++) {
      var a0 = Math.PI + i * Math.PI / 6, a1 = Math.PI + (i + 1) * Math.PI / 6, col = GLASS_COLS[i];
      g.fillStyle = on ? T(col) : T(mix(col, '#4a4048', 0.62));
      g.beginPath(); g.moveTo(x, cy + 2); g.lineTo(x + Math.cos(a0) * r, cy + 2 + Math.sin(a0) * r * 0.95); g.arc(x, cy + 2, r, a0, a1); g.closePath(); g.fill();
    }
    g.strokeStyle = T(PAL.woodDk); g.lineWidth = 0.7; for (i = 0; i <= 6; i++) { var a = Math.PI + i * Math.PI / 6; g.beginPath(); g.moveTo(x, cy + 2); g.lineTo(x + Math.cos(a) * r, cy + 2 + Math.sin(a) * r); g.stroke(); }
    box(g, x - r - 0.8, cy + 1.4, r * 2 + 1.6, 2, PAL.woodDk, 1);
  }
  Scene.prototype.drawLamps = function (g, t, only) {
    var st = this.state;
    LIGHTS.forEach(function (l) {
      if ((l.id === 'glassR') !== !!only) return;
      var on = lit(st, l.id);
      if (l.kind === 'salt') saltLamp(g, l.x, l.y, on, t); else glassLamp(g, l.x, l.y, on);
    });
  };

  Scene.prototype.drawWallPlants = function (g, t) {
    [0, 1, 2, 3, 5, 6, 13, 14].forEach(function (id) { this.drawOnePlant(g, t, Pl.SLOTS[id]); }, this);
    // a little plant shelf on the chimney wall
    box(g, 62, 74, 76, 5, PAL.woodLt, 1.5); box(g, 62, 79, 76, 2, shade(PAL.wall, -0.2)); box(g, 70, 81, 4, 8, PAL.woodDk, 1); box(g, 126, 81, 4, 8, PAL.woodDk, 1);
    [['trailMocha', 76, 74, 26], ['rubberBlue', 100, 74, 28, undefined, 'sage'], ['carnGold', 124, 74, 26]].forEach(function (d) { Pl.drawDecor(d[0], d[1], d[2], d[3], this.time, d[4], d[5]); }, this);
    // more plants in the wall shelves
    [['rubberPlum', 372, 118, 26, undefined, 'teal'], ['astilbeHoney', 404, 118, 26], ['rubberCocoa', 466, 172, 26, undefined, 'mustard'], ['rosePink', 512, 172, 24], ['trailBerry', 372, 172, 24]].forEach(function (d) { Pl.drawDecor(d[0], d[1], d[2], d[3], this.time, d[4], d[5]); }, this);
    catSprite(g, 'tan', Math.floor(this.time * 2.5), TAN_CAT.x, TAN_CAT.y, CAT_SC);
    [['rubber', 34, 66, 58, undefined, 'rose'], ['carnGold', 150, 146, 38], ['trailMocha', 556, 74, 44, 8],
     ['roseTeal', 438, 172, 28], ['bouquet', 168, 146, 34], ['roseTeal', 544, 118, 26], ['carnPink', 452, 118, 30], ['astilbePlum', 546, 172, 30], ['rosePink', 328, 201, 34], ['carnPink', 194, 201, 30], ['bouquet', 66, 200, 38], ['trailBerry', 255, 58, 40, 8], ['trailMocha', 412, 46, 30, 6], ['roseSage', 478, 118, 22]].forEach(function (d) {
      if (d[0] === 'bouquet') return;
      Pl.drawDecor(d[0], d[1], d[2], d[3], t, d[4], d[5]);
    });
  };
  Scene.prototype.drawFloorPlant = function (g, t, id) {
    var p = this.state.plants[id]; if (!p || !p.unlocked) return;
    var s = Pl.SLOTS[id]; this.softShadow(g, s.x, s.y + 1, 18, 5, 0.24);
    this.drawOnePlant(g, t, s);
  };
  Scene.prototype.drawOnePlant = function (g, t, s) {
    var p = this.state.plants[s.id];
    if (!p || !p.unlocked) return;
    var bobY = 0, pu = this.pulse[s.id];
    if (pu && pu > this.time) bobY = -Math.abs(Math.sin((pu - this.time) * 8)) * 2.5;
    if (bobY) { g.save(); g.translate(0, bobY); }
    Pl.drawPlant(s, p, t);
    if (bobY) g.restore();
    var r = Pl.rectFor(s);
    if (p.health === 1) icon('drop', s.x - 3, r.y - 8 + Math.sin(t * 3), '#5aa9e6', 1.3);
    if (p.health === 2 && Math.random() < 0.012) this.emit('z', s.x + 6, r.y + 6, 1, { spread: 2 });
  };

  Scene.prototype.drawFloorLight = function (g, t) {
    var sky = this.sky, wx = this.state.weather;
    var a = clamp(1 - sky.ta * 2.2, 0, 1) * (wx === 'clear' ? 0.38 : 0.1);
    if (a < 0.01) return;
    var sh = Math.sin(((this.state.hour % 24) - 12) / 12 * Math.PI) * 60;
    g.fillStyle = 'rgba(255,226,150,' + a.toFixed(3) + ')';
    g.beginPath(); g.moveTo(216, 304); g.lineTo(312, 304); g.lineTo(350 + sh, 428); g.lineTo(166 + sh, 428); g.closePath(); g.fill();
  };

  /* the counter group: barista, the counter, and what sits on it */
  Scene.prototype.drawBarista = function (g, t) {
    var b = this.barista, wave = b.waveUntil > t;
    this.person(g, b.spec, b.cx, b.T, { t: t, chair: '#8a5a3a', bob: Math.floor(t * 4) % 6 === 0, blink: (t % 3.7) < 0.13, look: 'down', smile: true, wave: wave ? 1 : 0, cheer: 0 });
  };
  Scene.prototype.drawCounterGroup = function (g, t) {
    this.drawBarista(g, t);
    var cs = this.counterSpr; C.blit(g, cs.cv, cs.ox, cs.oy);
    var top = CNT.y;
    // espresso machine
    box(g, 362, top - 32, 38, 32, '#a9554a', 4); box(g, 362, top - 32, 38, 6, '#c9c2b8', 3); box(g, 366, top - 25, 30, 12, '#8d453d', 3);
    ell(g, 371, top - 19, 3.4, 3.4, '#e8e0d0'); ell(g, 387, top - 19, 3.4, 3.4, '#e8e0d0'); box(g, 374, top - 9, 12, 3, '#d9d0c0', 1.5);
    box(g, 368, top - 3, 26, 3, '#4a3a38', 1.5); checkerMug(g, 381, top - 3, 0.7, '#c9694a');
    var st1 = this.state.calm ? 0 : 1;
    for (var k = 0; k < 3 && st1; k++) { g.fillStyle = 'rgba(255,255,255,' + (0.5 - k * 0.14).toFixed(2) + ')'; g.beginPath(); g.arc(381 + Math.sin(t * 2 + k * 1.7) * 2.2, top - 14 - k * 5 - ((t * 6) % 3), 2.1 + k * 0.4, 0, 6.2832); g.fill(); }
    checkerMug(g, 408, top, 1, '#4f7f6a');
    // pastry case
    var cx0 = 488, cw = 60, cy0 = top - 36;
    box(g, cx0, cy0 + 28, cw, 8, PAL.woodDk, 2);
    box(g, cx0 + 1, cy0, cw - 2, 29, 'rgba(210,230,236,0.45)', 3);
    box(g, cx0 + 3, cy0 + 14, cw - 6, 1.6, 'rgba(255,255,255,0.7)');
    // croissant, donut, cake slice, muffin
    g.fillStyle = T('#d9a05a'); g.beginPath(); g.ellipse(cx0 + 12, cy0 + 12, 8, 4, -0.2, 0, 6.2832); g.fill(); g.fillStyle = T('#c0803f'); g.beginPath(); g.ellipse(cx0 + 12, cy0 + 12, 3, 4, 0.2, 0, 6.2832); g.fill();
    ell(g, cx0 + 32, cy0 + 12, 6.4, 4.2, '#e8a0b0'); ell(g, cx0 + 32, cy0 + 12, 2.2, 1.4, '#d9ccb0');
    poly(g, [[cx0 + 44, cy0 + 12], [cx0 + 57, cy0 + 12], [cx0 + 55, cy0 + 4], [cx0 + 46, cy0 + 4]], '#f0d8b0'); box(g, cx0 + 45, cy0 + 6, 11, 2, '#b9694d'); ell(g, cx0 + 50.5, cy0 + 3.4, 2, 1.4, '#d96b58');
    box(g, cx0 + 5, cy0 + 24, 10, 5, '#c9a070', 2); ell(g, cx0 + 10, cy0 + 24, 6.4, 3.4, '#d9b080'); 
    box(g, cx0 + 22, cy0 + 24, 12, 5, '#e8c8a0', 2); ell(g, cx0 + 28, cy0 + 24, 6.8, 3.6, '#f0d8b8'); ell(g, cx0 + 27, cy0 + 22, 1.4, 1.4, '#b9694d');
    box(g, cx0 + 42, cy0 + 24, 12, 5, '#d9a080', 2); ell(g, cx0 + 48, cy0 + 24, 6.8, 3.6, '#e8b898');
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(cx0 + 4, cy0 + 2); g.lineTo(cx0 + 14, cy0 + 2); g.lineTo(cx0 + 8, cy0 + 26); g.lineTo(cx0 + 2, cy0 + 26); g.closePath(); g.fill();
    this.drawLamps(g, t, true);
  };

  Scene.prototype.softShadow = function (g, x, y, rx, ry, a) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    var gr = g.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx);
    gr.addColorStop(0, 'rgba(96,52,30,' + Math.min(0.5, a * 0.75) + ')'); gr.addColorStop(1, 'rgba(96,52,30,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 6.283); g.fill();
    g.restore();
  };
  Scene.prototype.scaled = function (g, x, y, s, fn) { g.save(); g.translate(x, y); g.scale(s, s); g.translate(-x, -y); fn(); g.restore(); };
  Scene.prototype.person = function (g, spec, cx, T0, a) {
    a.S = 4; g.save(); g.translate(cx, T0); g.scale(PSC, PSC); Pe.drawPerson(spec, 0, 0, a); g.restore();
  };

  Scene.prototype.drawTableGroup = function (g, t, tb) {
    var self = this, mode = this.state.mode;
    var cheerP = (t - this.cheerAt) / 1.8; if (cheerP < 0 || cheerP > 1) cheerP = 0;
    var mine = this.people.filter(function (p) { return p.table === tb.id; }).sort(function (a, b) { return a.T - b.T; });
    var sp = this.tableSpr[tb.id];
    this.softShadow(g, tb.cx, tb.ty + 41, tb.rx + 10, 10, 0.3);
    mine.forEach(function (p) {
      var active = Math.sin(t * 0.6 + p.ph) > -0.35 && mode !== 'break';
      self.person(g, p.spec, p.cx, p.T, {
        t: t, chair: p.chair, bob: active && (Math.floor(t * 6 + p.ph * 10) % 5 === 0), blink: ((t + p.ph) % 4.1) < 0.13,
        look: mode === 'break' ? 'up' : 'down', smile: mode === 'break' || cheerP > 0 || p.waveUntil > t, cheer: cheerP, wave: p.waveUntil > t ? 1 : 0
      });
    });
    C.blit(g, sp.cv, tb.cx - sp.ax, tb.ty - sp.ay);
    mine.forEach(function (p) {
      var lx = Math.round(tb.cx + p.dx * 0.55), ly = Math.round(tb.ty + (p.dx === 0 ? -4 : 0)), k = Math.abs(Math.round(p.cx));
      self.scaled(g, lx, ly, 1.2, function () { Pe.drawLaptop(lx, ly, (Pe.Options.laptopColors[p.spec.laptop] || '#e9e4da'), ['#f4a6b8', '#7fc4a0', '#8ab8e8', '#f5c84a', '#b48ae0'][k % 5], k % 4); });
    });
    mine.forEach(function (p) {
      if (p.waveUntil > t || cheerP > 0) return;
      var O = Pe.Options, skin = T(O.skin[p.spec.skin] || O.skin[2]), sl = T(O.outfitColors[p.spec.outfitColor] || O.outfitColors[0]);
      var lx = Math.round(tb.cx + p.dx * 0.55), ly = Math.round(tb.ty + (p.dx === 0 ? -4 : 0));
      var typing = mode !== 'break' && Math.sin(t * 0.6 + p.ph) > -0.35;
      [-1, 1].forEach(function (d) {
        var hx = lx + d * 21, hy = ly + 6 + (typing ? Math.sin(t * 13 + p.ph * 3 + d) * 0.7 : 0);
        g.lineCap = 'round'; g.strokeStyle = sl; g.lineWidth = 4.6; g.beginPath(); g.moveTo(hx - d * 5, hy - 10); g.lineTo(hx - d * 1, hy - 1); g.stroke();
        g.fillStyle = skin; g.beginPath(); g.ellipse(hx, hy, 3.2, 2.5, 0, 0, 6.2832); g.fill();
      });
    });
    if (mode !== 'break') mine.forEach(function (p) {
      var cyc = (t * 0.22 + p.ph * 0.37) % 1;
      if (cyc > 0.3 || Math.sin(t * 0.6 + p.ph) <= -0.35) return;
      var env = Math.sin(cyc / 0.3 * Math.PI), bx = Math.round(p.cx + 22), by = Math.round(p.T - 60 - env * 3);
      g.save(); g.globalAlpha = Math.min(1, env * 1.6) * 0.92;
      g.fillStyle = '#fffaf0'; g.beginPath(); g.ellipse(bx, by, 9, 5, 0, 0, 6.283); g.fill();
      g.beginPath(); g.moveTo(bx - 5, by + 3); g.lineTo(bx - 9, by + 8); g.lineTo(bx - 1, by + 4); g.fill();
      for (var i = 0; i < 3; i++) { g.globalAlpha = Math.min(1, env * 1.6) * (0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - i * 1.1))); g.fillStyle = '#9a8a78'; g.beginPath(); g.arc(bx - 4.5 + i * 4.5, by, 1.3, 0, 6.283); g.fill(); }
      g.restore();
    });
    tb.items.forEach(function (it) { var ix = Math.round(tb.cx + it.ox), iy = Math.round(tb.ty + it.oy); self.scaled(g, ix, iy, 1.25, function () { drawItem(it.k, ix, iy, t); }); });
    if (tb.id === 'fr') { this.drawOnePlant(g, t, Pl.SLOTS[7]); Pl.drawDecor('rubberBlue', tb.cx + 28, tb.ty - 2, 28, t, null, 'clay'); }
    if (tb.id === 'fl') Pl.drawDecor('rubber', tb.cx - 20, tb.ty - 3, 28, t, null, 'cream');
    if (tb.id === 'back') { Pl.drawDecor('rubberPlum', tb.cx - 17, tb.ty - 3, 24, t, null, 'navy'); Pl.drawDecor('roseSage', tb.cx + 18, tb.ty - 3, 26, t); }
    if (tb.id === 'fl') this.drawOnePlant(g, t, Pl.SLOTS[15]);
  };

  Scene.prototype.updateCat = function (dt) { var c = this.cat; c.x = 304; c.y = 402; c.state = 'sit'; };

  Scene.prototype.drawParticles = function (g) {
    this.particles.forEach(function (p) {
      var a = clamp((1 - p.life / p.max) * 1.6, 0, 1);
      g.globalAlpha = a;
      if (p.kind === 'spark') icon('spark', p.x - 3, p.y - 3, p.col, 1);
      else if (p.kind === 'heart') icon('heart', p.x - 3, p.y - 3, '#d9607a', 1.1);
      else if (p.kind === 'drop') { g.fillStyle = p.col; g.beginPath(); g.ellipse(p.x, p.y, 0.9, 1.6, 0, 0, 6.2832); g.fill(); }
      else if (p.kind === 'conf') { g.fillStyle = p.col; g.fillRect(p.x, p.y, 2.4, 2.4); }
      else if (p.kind === 'leaf') icon('leaf', p.x - 3, p.y - 3, p.col, 0.8);
      else if (p.kind === 'z') { g.fillStyle = '#ffffff'; g.font = '700 7px sans-serif'; g.fillText('z', p.x, p.y); }
    });
    g.globalAlpha = 1;
  };

  Scene.prototype.drawLighting = function (g, t) {
    var sky = this.sky, st = this.state;
    var night = clamp((sky.ta - 0.1) / 0.4, 0, 1);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = mix('#ffffff', sky.tint, clamp(sky.ta * 1.1, 0, 0.85));
    g.fillRect(0, 0, W, H);
    var wxMul = { cloudy: '#dfe2e8', rain: '#c6cedb', snow: '#eaeef5' }[st.weather];
    if (wxMul) { g.fillStyle = wxMul; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = 'lighter';
    var flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3), base = 0.3 + 0.7 * night;
    function glow(x, y, r, rgb, a) {
      var gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(' + rgb + ',' + (a * 0.6).toFixed(3) + ')'); gr.addColorStop(0.5, 'rgba(' + rgb + ',' + (a * 0.22).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
    if (st.fire) glow(98, 290, 96, '255,150,70', (0.1 + 0.34 * night) * flick);
    LIGHTS.forEach(function (l) {
      if (!lit(st, l.id)) return;
      if (l.kind === 'salt') glow(l.x, l.y - 9, 34, '255,150,80', (0.34 + 0.24 * night) * (0.94 + 0.06 * Math.sin(t * 1.7 + l.x)));
      else glow(l.x, l.y - 14, 34, '255,196,130', 0.3 + 0.25 * night);
    });
    PENDANTS.forEach(function (p) { glow(p.x, p.h + 6, 46, '255,200,110', 0.4 * base); });
    glow(264, 150, 120, '255,236,170', 0.1 * (1 - night)); glow(60, 340, 70, '190,150,235', 0.06 + 0.06 * night);
    glow(this.nook.x - 16, this.nook.y - 48, 22, '255,190,110', 0.3 * base); glow(this.nook.x + 16, this.nook.y - 48, 22, '210,170,255', 0.1 + 0.08 * night);
    if (night > 0.1 && lit(st, 'strings')) { for (var x = 36; x < W; x += 72) glow(x, 24, 22, '255,214,140', 0.18 * night); }
    g.globalCompositeOperation = 'source-over';
  };

  Scene.prototype.drawOverlays = function (g, t) {
    this.people.forEach(function (p) { if (p.bubble) bubble(p.cx, p.T - 62 + Math.round(Math.sin(t * 2 + p.ph)), p.bubble.name); });
    this.drawParticles(g);
    var h = this.hover;
    if (h && h.rect) {
      var r = h.rect;
      g.save(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(91,66,55,0.45)'; rr(g, r.x - 1.5, r.y - 1.5, r.w + 3, r.h + 3, 6); g.stroke();
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.setLineDash([4, 3]); rr(g, r.x - 1.5, r.y - 1.5, r.w + 3, r.h + 3, 6); g.stroke(); g.restore();
    }
  };

  Scene.prototype.frame = function (nowMs) {
    var t = nowMs / 1000;
    if (this.last === null) this.last = t;
    var dt = clamp(t - this.last, 0, 0.1); this.last = t; this.dt = dt; this.time = t;
    var g = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W * K, H * K); g.setTransform(K, 0, 0, K, 0, 0);
    C.setCtx(g); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    this.sky = skyAt(this.state.hour);
    this.updateCat(dt); this.updateBubbles(t); this.updateParticles(dt);

    C.blit(g, this.bg, 0, 0);
    this.drawSky(g, t);
    C.blit(g, this.winFrame, 0, 0);
    this.drawFloorLight(g, t);
    this.drawStrings(g, t);
    this.drawPendants(g, t);
    this.drawFire(g, t);
    this.drawClockHands(g);
    this.drawLamps(g, t, false);
    this.drawWallPlants(g, t);

    var self = this, c = this.cat;
    var list = [
      { y: Pl.SLOTS[4].y, fn: function () { self.drawFloorPlant(g, t, 4); } },
      { y: Pl.SLOTS[8].y, fn: function () { self.drawFloorPlant(g, t, 8); } },
      { y: Pl.SLOTS[9].y, fn: function () { self.drawFloorPlant(g, t, 9); } },
      { y: Pl.SLOTS[10].y, fn: function () { self.drawFloorPlant(g, t, 10); } },
      { y: Pl.SLOTS[11].y, fn: function () { self.drawFloorPlant(g, t, 11); } },
      { y: Pl.SLOTS[12].y, fn: function () { self.drawFloorPlant(g, t, 12); } },
      { y: this.hearthPos.y, fn: function () { var p = self.hearthPos; self.scaled(g, p.x, p.y, 1.4, function () { self.drawHearthPet(g, t); }); catSprite(g, 'sleep', Math.floor(t * 2), p.x, p.y - 3, CAT_SC); } },
      { y: this.nook.y, fn: function () { var p = self.nook; self.scaled(g, p.x, p.y, 1.3, function () { self.drawNook(g, t); }); } },
      { y: CNT.y + 70, fn: function () { self.drawCounterGroup(g, t); } },
      { y: this.dogPos.y, fn: function () { var p = self.dogPos; } },
      { y: this.avoPos.y, fn: function () { var p = self.avoPos; self.scaled(g, p.x, p.y, 1.5, function () { self.drawAvocado(g, t); }); } },
      { y: c.y, fn: function () { self.softShadow(g, c.x, c.y + 2, 24, 5, 0.22); var bx = c.x, by = c.y; g.fillStyle = T('#8a5a3a'); g.beginPath(); g.ellipse(bx, by - 1, 22, 8, 0, 0, 6.2832); g.fill();
        g.fillStyle = T('#d8a47c'); g.beginPath(); g.ellipse(bx, by - 2.5, 20, 6.4, 0, 0, 6.2832); g.fill();
        g.fillStyle = T('#e9c4d6'); g.beginPath(); g.ellipse(bx, by - 2.5, 15, 4.2, 0, 0, 6.2832); g.fill();
        catSprite(g, 'sleep', Math.floor(t * 2) + 1, bx, by - 2, CAT_SC);
        g.fillStyle = T('#d8a47c'); g.beginPath(); g.ellipse(bx, by + 1, 21, 4.2, 0, 0, Math.PI); g.fill(); } }
    ];
    list.push({ y: 432, fn: function () { Pl.drawDecor('rubberCocoa', 26, 432, 78, t, null, 'teal'); } });
    list.push({ y: TOWER.y, fn: function () { self.softShadow(g, TOWER.x, TOWER.y + 1, 22, 4, 0.22); catSprite(g, 'tower', 0, TOWER.x, TOWER.y, CAT_SC); catSprite(g, 'tan', Math.floor(t * 2.5) + 2, self.dogPos.x, self.dogPos.y, CAT_SC, true); } });
    TABLES.forEach(function (tb) { list.push({ y: tb.ty + 38, fn: function () { self.drawTableGroup(g, t, tb); } }); });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (it) { it.fn(); });

    this.drawLighting(g, t);
    this.drawWatering(g, t);
    this.drawOverlays(g, t);
  };

  Cafe.Art = {
    W: W, H: H, GLASS: GLASS, TABLES: TABLES, PHASE_HOURS: PHASE_HOURS, skyAt: skyAt,
    createScene: function (canvas) { return new Scene(canvas); }
  };
})();
