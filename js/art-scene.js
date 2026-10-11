/* Little flow cafe: an angled little diorama. Two back walls, a diamond floor, a window with the sky, animals, lighting. */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});
  var C = Cafe.Core, Pe = Cafe.People, Pl = Cafe.Plants;
  var R = C.R, P = C.P, D = C.D, E = C.E, RR = C.RR, line = C.line;
  var mix = C.mix, shade = C.shade, clamp = C.clamp, lerp = C.lerp, rng = C.rng;

  /* ---------- geometry ---------- */
  var W = 480, H = 360;
  var TW = 16, TH = 8, N = 13, WH = 110, WL = N * TW;
  var OX = 240, OY = 134, SLAB = 14;
  var GLASS = { fx: 26, z0: 44, w: 104, h: 50 };

  function iso(gx, gy, z) { return [OX + (gx - gy) * TW, OY + (gx + gy) * TH - (z || 0)]; }
  // a point on a wall. fx is the flat x (reading order), z is the height
  function wallPt(side, fx, z) {
    return side === 'R' ? [OX + fx, OY + fx * 0.5 - z] : [OX - WL + fx, OY + (WL - fx) * 0.5 - z];
  }
  function wallRect(side, fx0, fx1, z0, z1) {
    var a = wallPt(side, fx0, z1), b = wallPt(side, fx1, z1), c = wallPt(side, fx0, z0), d = wallPt(side, fx1, z0);
    var x0 = Math.min(a[0], b[0], c[0], d[0]), x1 = Math.max(a[0], b[0], c[0], d[0]);
    var y0 = Math.min(a[1], b[1], c[1], d[1]), y1 = Math.max(a[1], b[1], c[1], d[1]);
    return { x: Math.floor(x0), y: Math.floor(y0), w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0) };
  }

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
  var CHAIRS = ['#c4572f', '#2f7f8a', '#d9a02a', '#7a4fb0', '#b8302f'];
  var TABLES = [
    { id: 'back', gx: 9.4, gy: 7.8, rx: 46, R: 58, ang: [222, 270, 318], cloth: 'runner',
      items: [{ k: 'cup', ox: -28, oy: 9 }, { k: 'book', ox: -8, oy: 14 }, { k: 'pastry', ox: 12, oy: 15 }, { k: 'cat', ox: 30, oy: 8 }] },
    { id: 'fl', gx: 2.6, gy: 10.4, rx: 38, R: 52, ang: [222, 270, 318], cloth: 'checks',
      items: [{ k: 'cup', ox: -18, oy: 9 }, { k: 'tea', ox: 6, oy: 12 }] },
    { id: 'fr', gx: 8.2, gy: 12.0, rx: 30, R: 40, ang: [], cloth: 'runner',
      items: [{ k: 'cup', ox: -17, oy: 9 }, { k: 'pastry', ox: 17, oy: 9 }, { k: 'book', ox: 0, oy: 14 }] }
  ];
  var TABLE_H = 22;
  var PLAYER_SEAT = { table: 'back', index: 1 };
  var NOOK = { gx: 11.4, gy: 3.4 };
  var HEARTH = { gx: 0.8, gy: 5.3 };
  var AVO = { gx: 10.5, gy: 11.8 };
  var TOM = { gx: 12.4, gy: 5.4 };
  var DOGSPOT = { gx: 6.4, gy: 11.8 };
  var WAYPOINTS = [[2.6, 1.8], [5.4, 5.2], [7.4, 5.2], [5.2, 8.0], [5.6, 9.6], [10.6, 9.8], [11.0, 8.4], [10.2, 4.0], [11.5, 11.8]];

  // where each plant lives (screen pixels)
  function placePlants() {
    var s = Pl.SLOTS, p;
    p = wallPt('R', 46, 44); s[0].x = Math.round(p[0]); s[0].y = Math.round(p[1]);
    p = wallPt('R', 78, 44); s[1].x = Math.round(p[0]); s[1].y = Math.round(p[1]);
    p = wallPt('R', 110, 44); s[2].x = Math.round(p[0]); s[2].y = Math.round(p[1]);
    p = wallPt('L', 120, 62); s[3].x = Math.round(p[0]); s[3].y = Math.round(p[1]);
    p = iso(1.1, 1.1, 0); s[4].x = Math.round(p[0]); s[4].y = Math.round(p[1] + 4);
    p = wallPt('R', 156, 70); s[5].x = Math.round(p[0]); s[5].y = Math.round(p[1]); s[5].hook = Math.round(wallPt('R', 156, 104)[1]);
    p = wallPt('L', 62, 70); s[6].x = Math.round(p[0]); s[6].y = Math.round(p[1]); s[6].hook = Math.round(wallPt('L', 62, 104)[1]);
    var tf = iso(TABLES[2].gx, TABLES[2].gy);
    s[7].x = Math.round(tf[0]); s[7].y = Math.round(tf[1] - TABLE_H + 1);
    function fl(id, gx, gy) { var q = iso(gx, gy, 0); s[id].x = Math.round(q[0]); s[id].y = Math.round(q[1] + 4); }
    fl(8, 12.3, 9.9); fl(9, 0.9, 11.6); fl(10, 0.9, 3.6); fl(11, 5.6, 12.0); fl(12, 2.6, 0.9);
    p = wallPt('R', 185, 100); s[13].x = Math.round(p[0]); s[13].y = Math.round(p[1]);
    p = wallPt('L', 25, 100); s[14].x = Math.round(p[0]); s[14].y = Math.round(p[1]);
    var tm = iso(TABLES[1].gx, TABLES[1].gy);
    s[15].x = Math.round(tm[0] + 14); s[15].y = Math.round(tm[1] - TABLE_H + 8);
  }

  /* ---------- background ---------- */
  function buildBgPattern() {
    var cv = C.makeCanvas(W, H), c = cv.getContext('2d');
    C.setCtx(c);
    var x, y, r = rng(31);
    for (y = 0; y < H; y += 36) for (x = 0; x < W; x += 36) {
      if (((x / 36) + (y / 36)) % 2 === 0) { c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(x, y, 36, 36); }
    }
    function flower(cx, cy, s, col) {
      c.fillStyle = col;
      [[0, -s], [s, 0], [0, s], [-s, 0]].forEach(function (d) { D(cx + d[0], cy + d[1], Math.max(1, Math.round(s * 0.6)), col); });
      D(cx, cy, Math.max(1, Math.round(s * 0.6)), col);
      D(cx, cy, 1, 'rgba(255,240,200,0.9)');
    }
    [[22, 24, 7], [64, 70, 5], [446, 28, 8], [410, 74, 5], [28, 318, 8], [70, 340, 5], [452, 322, 8], [414, 346, 5], [30, 170, 4], [452, 180, 4], [24, 232, 5], [458, 248, 5]].forEach(function (f) {
      flower(f[0], f[1], f[2], 'rgba(255,214,150,0.4)');
    });
    [[60, 36], [430, 330]].forEach(function (s) {
      D(s[0], s[1], 9, 'rgba(255,240,200,0.55)'); D(s[0], s[1], 6, 'rgba(255,214,150,0.55)');
    });
    return cv;
  }

  /* ---------- floor ---------- */
  function diamond(c, cx, top, col) {
    c.fillStyle = col;
    for (var dy = 0; dy < TH * 2; dy++) {
      var w = dy < TH ? (dy + 1) * 2 : (TH * 2 - dy) * 2;
      c.fillRect(cx - w, top + dy, w * 2, 1);
    }
  }
  function buildFloor() {
    var cv = C.makeCanvas(W, H), c = cv.getContext('2d');
    C.setCtx(c);
    var gx, gy, p, rr = rng(5);
    // slab sides
    var lc = '#5a3018', rc = '#7a4424';
    for (var i = 0; i < WL; i++) {
      var yL = OY + WL * 0.5 + (i >> 1) - 0; // left face from left vertex to bottom vertex
      R(OX - WL + i, OY + N * TH + (i >> 1), 1, SLAB, lc);
      R(OX - WL + i, OY + N * TH + (i >> 1), 1, 1, '#a8683a');
      R(OX + WL - 1 - i, OY + N * TH + (i >> 1), 1, SLAB, rc);
      R(OX + WL - 1 - i, OY + N * TH + (i >> 1), 1, 1, '#c27a42');
    }
    // tiles
    for (gx = 0; gx < N; gx++) for (gy = 0; gy < N; gy++) {
      p = iso(gx, gy, 0);
      var dark = (gx + gy) % 2 === 0;
      var inRug = gx >= 2 && gx < 12 && gy >= 3 && gy < 12;
      var col;
      if (inRug) {
        var edge = (gx === 2 || gx === 11 || gy === 3 || gy === 11);
        var edge2 = (gx === 3 || gx === 10 || gy === 4 || gy === 10);
        col = edge ? '#d98a2a' : (edge2 ? '#e8d8a0' : (dark ? '#2f6a3a' : '#38783f'));
      } else col = dark ? '#9a5a30' : '#a8683a';
      diamond(c, p[0], p[1], col);
    }
    // plank texture
    for (gx = 0; gx < N; gx++) for (gy = 0; gy < N; gy++) {
      p = iso(gx, gy, 0);
      if (gx >= 2 && gx < 12 && gy >= 3 && gy < 12) {
        if (((gx * 7 + gy * 3) % 3) === 0) P(p[0] - 2, p[1] + 7, 'rgba(255,230,150,0.5)');
        continue;
      }
      var ox = Math.floor(rr() * 10) - 5;
      P(p[0] + ox, p[1] + 5 + Math.floor(rr() * 6), 'rgba(120,76,44,0.28)');
      if (rr() < 0.4) R(p[0] - 6 + Math.floor(rr() * 8), p[1] + 7, 4, 1, 'rgba(255,240,215,0.35)');
    }
    // soft shadow where the floor meets the walls
    c.fillStyle = 'rgba(80,50,30,0.14)';
    for (i = 0; i < WL; i++) { c.fillRect(OX + i, OY + (i >> 1), 1, 5); c.fillRect(OX - 1 - i, OY + (i >> 1), 1, 5); }
    c.globalCompositeOperation = 'source-atop';
    var rg = c.createRadialGradient(OX, OY + 100, 20, OX, OY + 100, 230);
    rg.addColorStop(0, 'rgba(255,214,140,0.16)'); rg.addColorStop(1, 'rgba(30,12,0,0.30)');
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
    return cv;
  }

  /* ---------- walls (drawn flat, then sheared into place) ---------- */
  function ivy(x, y, len, seed, dir) {
    var r = rng(seed);
    var greens = ['#6fb36a', '#58a05c', '#8cc774', '#4a8f52'];
    for (var k = 0; k < len; k++) {
      var yy = y + k * 3 + Math.floor(r() * 2), xx = x + Math.round(Math.sin(k * 0.8 + seed) * 2) * dir;
      P(xx, yy, '#4a7a46');
      if (k % 2 === 0) {
        var col = greens[Math.floor(r() * greens.length)];
        R(xx - 3, yy, 3, 2, col); R(xx + 1, yy + 1, 3, 2, greens[Math.floor(r() * greens.length)]);
        P(xx - 3, yy, shade(col, 0.3));
      }
    }
  }

  function wallBase(c, sideLight, patternSeed) {
    var x, y;
    var base = sideLight ? '#a3b04a' : '#8f9c3e', stripe = sideLight ? '#93a13c' : '#808e33';
    R(0, 0, WL, WH, base);
    for (x = 0; x < WL; x += 14) R(x, 5, 7, WH - 5, stripe);
    var r = rng(patternSeed);
    for (y = 12; y < 78; y += 14) for (x = ((y / 14) % 2) * 7 + 3; x < WL; x += 14) {
      P(x, y, sideLight ? '#c4cf6a' : '#aab653'); P(x + 1, y, sideLight ? '#c4cf6a' : '#aab653');
    }
    // wainscot
    var wc = sideLight ? '#8a4f2a' : '#7a4224';
    R(0, 80, WL, 30, wc);
    for (x = 0; x < WL; x += 26) { R(x + 2, 84, 22, 22, shade(wc, 0.12)); R(x + 2, 84, 22, 1, shade(wc, 0.28)); R(x + 2, 105, 22, 1, shade(wc, -0.12)); R(x + 24, 84, 1, 22, shade(wc, -0.1)); }
    R(0, 77, WL, 3, '#d9b878'); R(0, 79, WL, 1, '#8a6a3a');
    R(0, 106, WL, 4, '#4a2a16'); R(0, 106, WL, 1, '#8a5a30');
    // top rim
    R(0, 0, WL, 5, sideLight ? '#2f5a26' : '#c4561f'); R(0, 0, WL, 1, sideLight ? '#4f8a3a' : '#ea7a3a'); R(0, 4, WL, 1, sideLight ? '#1f3a18' : '#8a3a12');
  }

  function drawBookshelf(x, y, w, h, seed) {
    var r = rng(seed);
    R(x, y, w, h, '#8a5a36');
    R(x + 2, y + 2, w - 4, h - 4, '#5e3b22');
    var bookC = ['#c9442f', '#e8a317', '#3f8f55', '#2f6fb5', '#8a4fb0', '#f0e0b8', '#b8481f', '#1f6f66', '#d9507a'];
    var rows = 3, rh = Math.floor((h - 12) / rows), k, bx, bw, bh, col;
    for (k = 0; k < rows; k++) {
      var top = y + 2 + k * (rh + 2), bot = top + rh;
      bx = x + 3;
      while (bx < x + w - 5) {
        bw = 2 + Math.floor(r() * 3); bh = rh - 2 - Math.floor(r() * 8); col = bookC[Math.floor(r() * bookC.length)];
        R(bx, bot - bh, bw, bh, col); R(bx, bot - bh, 1, bh, shade(col, 0.25)); R(bx + bw - 1, bot - bh, 1, bh, shade(col, -0.2));
        R(bx, bot - bh + 2, bw, 1, shade(col, -0.25));
        bx += bw;
        if (r() < 0.12) bx += 3;
      }
      R(x + 2, bot, w - 4, 2, '#a8744a'); R(x + 2, bot, w - 4, 1, '#c28d5c');
    }
    // cabinet at the bottom
    var cy = y + 2 + rows * (rh + 2);
    R(x + 2, cy, w - 4, y + h - cy - 2, '#a8744a'); R(x + 2, cy, w - 4, 1, '#c28d5c');
    R(x + Math.floor(w / 2), cy + 2, 1, y + h - cy - 6, '#7a5030');
    P(x + Math.floor(w / 2) - 2, cy + 6, '#e8c27a'); P(x + Math.floor(w / 2) + 2, cy + 6, '#e8c27a');
    // a tiny plant and a lantern on a shelf
    R(x + w - 12, y + 2 + rh - 7, 6, 5, '#d98a62'); R(x + w - 11, y + 2 + rh - 11, 4, 4, '#62b872');
  }

  function drawChalkboard(x, y, w, h) {
    RR(x, y, w, h, 2, '#8a5a36');
    R(x + 2, y + 2, w - 4, h - 4, '#2f4a3f'); R(x + 2, y + 2, w - 4, 1, '#3d5c50');
    var ch = '#f3efe0';
    D(x + 12, y + 12, 5, ch); D(x + 14, y + 11, 4, '#2f4a3f');
    function star(sx, sy) { P(sx, sy, ch); P(sx - 1, sy, ch); P(sx + 1, sy, ch); P(sx, sy - 1, ch); P(sx, sy + 1, ch); }
    star(x + 26, y + 9); star(x + 36, y + 15);
    R(x + 6, y + 24, 22, 1, ch); R(x + 6, y + 27, 14, 1, ch); R(x + 24, y + 27, 14, 1, '#e9a1ad'); R(x + 6, y + 30, 26, 1, ch);
    R(x + 4, y + h - 4, w - 8, 2, '#6e4429');
  }

  function drawMugShelf(x, y, w) {
    R(x, y, w, 3, '#8a5a36'); R(x, y, w, 1, '#a8744a');
    var cols = ['#fff5e8', '#e9a1ad', '#a8d5ba', '#f3d98a', '#bcd7f2', '#fff5e8'];
    for (var i = 0; i < 6; i++) {
      var mx = x + 4 + i * 7; R(mx, y - 6, 5, 6, cols[i]); R(mx, y - 6, 5, 1, shade(cols[i], -0.18)); P(mx + 5, y - 4, cols[i]); P(mx + 5, y - 3, cols[i]);
    }
  }

  function drawFireplaceFlat() {
    var x, y, row = 0, rr = rng(21);
    // stone chimney breast
    R(82, 5, 52, 45, '#e3c9ab');
    for (y = 5; y < 50; y += 5, row++) {
      var off = (row % 2) * 5;
      for (x = 82 - off; x < 134; x += 10) {
        var xx = Math.max(x, 82), ww = Math.min(x + 9, 134) - xx, v = rr();
        var cc = v < 0.22 ? '#c9a789' : (v < 0.4 ? '#e8d2b6' : '#d9bd9e');
        if (ww > 0) R(xx, y, ww, 4, cc);
      }
    }
    // mantel
    R(70, 48, 74, 5, '#8a5a36'); R(70, 48, 74, 2, '#a8744a'); R(72, 53, 70, 2, '#6e4429');
    // surround
    R(76, 55, 62, 51, '#d6c3a8');
    for (y = 57; y < 106; y += 6) R(76, y, 62, 1, '#bfae96');
    row = 0;
    for (y = 57; y < 106; y += 6, row++) for (x = 76 + (row % 2) * 8; x < 138; x += 16) R(x, y, 1, 6, '#bfae96');
    // opening
    RR(91, 67, 32, 39, 12, '#c9b79e');
    RR(94, 70, 26, 36, 10, '#2b1b19'); R(94, 84, 26, 22, '#2b1b19');
    // logs
    R(97, 98, 20, 5, '#6b4128'); R(97, 98, 20, 1, '#8a5a36'); D(98, 100, 2, '#a87a4c');
    R(100, 94, 14, 4, '#7d4e2e'); R(100, 94, 14, 1, '#9a6a40');
    // hearth lip
    R(86, 104, 42, 3, '#bfae96'); R(86, 104, 42, 1, '#e3d4bc');
    // clock face (hands drawn live)
    D(107, 30, 11, '#7a4f2e'); D(107, 30, 9, '#fff7e8');
    P(107, 22, '#7a4f2e'); P(107, 38, '#7a4f2e'); P(99, 30, '#7a4f2e'); P(115, 30, '#7a4f2e');
    // things on the mantel
    R(78, 41, 3, 7, '#f6ecd8'); R(84, 43, 3, 5, '#e9c7d6'); R(78, 47, 3, 1, '#e8d9bd');
    R(95, 38, 11, 10, '#7a4f2e'); R(96, 39, 9, 8, '#cfe6f2'); R(96, 44, 9, 3, '#7fae8a'); D(101, 42, 1, '#f5d98a');
  }

  function drawWindowFrame() {
    var g = C.ctx(), x, y;
    // arched top: soft corners cut out of the glass
    R(22, 12, 112, 60, '#fbf3e4');
    R(25, 15, 106, 54, '#e4cfae');
    g.clearRect(GLASS.fx, 16, GLASS.w, GLASS.h);
    // arch decoration: a little tri of frame in the top corners
    for (var k = 0; k < 6; k++) { R(GLASS.fx, 16 + k, 6 - k, 1, '#fbf3e4'); R(GLASS.fx + GLASS.w - (6 - k), 16 + k, 6 - k, 1, '#fbf3e4'); }
    [52, 78, 104].forEach(function (mx) { R(mx, 16, 3, GLASS.h, '#fbf3e4'); R(mx + 2, 16, 1, GLASS.h, '#e4cfae'); });
    R(GLASS.fx, 39, GLASS.w, 3, '#fbf3e4'); R(GLASS.fx, 41, GLASS.w, 1, '#e4cfae');
    // sill
    R(18, 66, 120, 4, '#ead2a6'); R(18, 66, 120, 1, '#f8e6c0'); R(18, 70, 120, 2, '#b98f5e');
    // curtains
    R(10, 8, 136, 2, '#8a5a36'); D(9, 9, 2, '#6e4429'); D(147, 9, 2, '#6e4429');
    function cw(yy) { return yy < 40 ? 15 : (yy < 52 ? Math.round(lerp(15, 9, (yy - 40) / 12)) : (yy < 60 ? 9 : Math.round(lerp(9, 15, (yy - 60) / 10)))); }
    for (y = 10; y < 70; y++) {
      var w = cw(y);
      for (x = 0; x < w; x++) {
        var fold = (Math.floor(x / 3) % 2 === 0), col = fold ? '#f7e6d6' : '#ecc9bd';
        R(12 + x, y, 1, 1, col); R(144 - w + x, y, 1, 1, col);
      }
    }
    R(12, 52, 9, 3, '#d98e98'); R(135, 52, 9, 3, '#d98e98');
  }

  function buildWalls() {
    var out = {};
    // right wall
    var cvR = C.makeCanvas(WL, WH), cR = cvR.getContext('2d'); C.setCtx(cR);
    wallBase(cR, true, 3);
    drawWindowFrame();
    drawBookshelf(166, 8, 38, 98, 17);
    // a framed print and a bracket for the hanging plant
    R(150, 6, 12, 2, '#6e4429'); R(154, 6, 3, 8, '#6e4429');
    ivy(14, 5, 9, 4, 1); ivy(144, 5, 7, 8, -1); ivy(206, 5, 8, 2, -1); ivy(60, 5, 3, 6, 1);
    out.R = cvR;
    // left wall (reading order: far end on the left, corner on the right)
    var cvL = C.makeCanvas(WL, WH), cL = cvL.getContext('2d'); C.setCtx(cL);
    wallBase(cL, false, 9);
    drawBookshelf(4, 8, 42, 98, 23);
    R(60, 6, 3, 2, '#6e4429'); R(55, 6, 12, 2, '#6e4429');
    drawFireplaceFlat();
    drawChalkboard(150, 28, 46, 38);
    drawMugShelf(152, 82, 42);
    ivy(5, 5, 10, 11, 1); ivy(70, 5, 5, 3, 1); ivy(140, 5, 6, 12, 1); ivy(202, 5, 12, 14, -1);
    out.L = cvL;
    ['R', 'L'].forEach(function (k) {
      var c2 = out[k].getContext('2d');
      c2.globalCompositeOperation = 'source-atop';
      var gr = c2.createLinearGradient(0, 0, 0, WH);
      gr.addColorStop(0, 'rgba(20,10,0,0.30)'); gr.addColorStop(0.35, 'rgba(20,10,0,0.0)'); gr.addColorStop(1, 'rgba(20,10,0,0.22)');
      c2.fillStyle = gr; c2.fillRect(0, 0, WL, WH);
      var gh = c2.createLinearGradient(k === 'R' ? 0 : WL, 0, k === 'R' ? WL : 0, 0);
      gh.addColorStop(0, 'rgba(255,230,160,0.10)'); gh.addColorStop(1, 'rgba(20,10,0,0.14)');
      c2.fillStyle = gh; c2.fillRect(0, 0, WL, WH);
      c2.globalCompositeOperation = 'source-over';
    });
    return out;
  }

  function strings(c, seed) {
    // wire for the string lights, drawn once
    C.setCtx(c);
    for (var x = 0; x < WL; x++) {
      var k = (x % 52) / 52;
      P(x, 6 + Math.round(5 * Math.sin(Math.PI * k)), '#7a644c');
    }
  }

  /* ---------- tables and the nook ---------- */
  function buildTable(tb) {
    var cw = tb.rx * 2 + 12, ch = tb.rx + TABLE_H + 22;
    var cv = C.makeCanvas(cw, ch), c = cv.getContext('2d');
    C.setCtx(c);
    var cx = Math.floor(cw / 2), ty = ch - 8, topY = ty - TABLE_H, rx = tb.rx, ry = Math.round(rx / 2);
    // pedestal
    E(cx, ty, 11, 4, '#6e4429'); E(cx, ty - 1, 10, 3, '#8e5c33');
    R(cx - 2, topY, 5, TABLE_H, '#8e5c33'); R(cx - 2, topY, 1, TABLE_H, '#a8723f');
    E(cx, ty - 4, 6, 2, '#8e5c33');
    // top
    var cloth = tb.cloth;
    var edge = cloth === 'checks' ? '#c4352a' : '#a8441f';
    E(cx, topY + 4, rx, ry, shade(edge, -0.12));
    E(cx, topY + 3, rx, ry, edge);
    var face = cloth === 'checks' ? '#f6ead0' : '#d9622f';
    E(cx, topY, rx, ry, face);
    // pattern
    var x, y;
    if (cloth === 'checks') {
      for (y = -ry; y <= ry; y++) for (x = -rx; x <= rx; x++) {
        var d = (x * x) / (rx * rx) + (y * y) / ((ry + 0.5) * (ry + 0.5));
        if (d <= 0.92 && (((x + 200) >> 2) + ((y + 200) >> 2)) % 2 === 0) P(cx + x, topY + y, '#d4453a');
      }
    } else {
      E(cx, topY, rx - 6, ry - 3, '#f3dfb6');
      for (x = -rx + 10; x < rx - 8; x += 9) P(cx + x, topY + 1, '#d9622f');
    }
    // soft highlight
    for (x = -rx + 8; x < -rx / 2; x++) P(cx + x, topY - Math.round(ry * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)))) + 1, 'rgba(255,255,255,0.7)');
    // scalloped drape
    return { cv: cv, ax: cx, ay: ty, topY: topY - ty };
  }

  function buildNook() {
    var cv = C.makeCanvas(64, 70), c = cv.getContext('2d');
    C.setCtx(c);
    var cx = 32, ty = 62, rx = 22, ry = 11, topY = ty - 26;
    // plum cloth to the floor with a scalloped hem
    for (var y = topY; y < ty; y++) {
      var k = (y - topY) / (ty - topY);
      var w = Math.round(rx * (1 + 0.12 * k));
      R(cx - w, y, w * 2, 1, (Math.floor((y - topY) / 3) % 2) ? '#5a2f7a' : '#6a3a8a');
    }
    E(cx, ty - 1, rx + 3, 5, '#44205f');
    for (var x = -rx; x < rx; x += 5) { D(cx + x + 2, ty - 1, 2, '#5a2f7a'); }
    var rr = rng(11);
    for (var i = 0; i < 16; i++) P(cx - 18 + Math.floor(rr() * 36), topY + 6 + Math.floor(rr() * 18), '#f5d98a');
    E(cx, topY + 2, rx, ry, '#44205f'); E(cx, topY, rx, ry, '#7a4a9a'); E(cx, topY - 1, rx - 3, ry - 3, '#9a62b8');
    // candle jar
    R(cx - 16, topY - 6, 5, 6, '#f0e0c8'); R(cx - 16, topY - 6, 5, 1, '#fff8ea');
    // crystals
    R(cx + 10, topY - 12, 3, 12, '#c9a7ff'); R(cx + 9, topY - 10, 1, 10, '#a98be0'); R(cx + 11, topY - 12, 1, 10, '#e0cfff'); P(cx + 11, topY - 13, '#c9a7ff');
    R(cx + 15, topY - 8, 3, 8, '#ffb3d9'); R(cx + 15, topY - 8, 1, 8, '#ffd6ea'); P(cx + 16, topY - 9, '#ffb3d9');
    R(cx + 6, topY - 5, 2, 5, '#a8e6cf'); P(cx + 6, topY - 6, '#a8e6cf');
    // plant
    R(cx - 6, topY - 4, 5, 4, '#d98a62'); R(cx - 6, topY - 8, 2, 4, '#62b872'); R(cx - 4, topY - 10, 2, 6, '#82c394'); R(cx - 2, topY - 7, 2, 3, '#62b872');
    return { cv: cv, ax: cx, ay: ty, topY: topY - ty };
  }

  function buildAvocado() {
    var cv = C.makeCanvas(44, 46), c = cv.getContext('2d');
    C.setCtx(c);
    var cx = 22, y, x;
    // pear shaped body: narrow on top, round at the bottom
    function wAt(yy) { var k = yy / 40; return Math.round(Math.max(yy < 1 ? 0 : 6, 21 * Math.pow(Math.sin(Math.PI * Math.pow(k, 1.5)), 0.55))); }
    for (y = 0; y < 40; y++) { var w = wAt(y); R(cx - w, 4 + y, w * 2, 1, '#4f7a3a'); }
    for (y = 1; y < 38; y++) { var w2 = wAt(y) - 2; R(cx - w2, 4 + y, w2 * 2, 1, '#6a9a4a'); }
    for (y = 3; y < 36; y++) { var w3 = wAt(y) - 4; if (w3 > 0) R(cx - w3, 4 + y, w3 * 2, 1, '#d9e69c'); }
    for (y = 6; y < 34; y++) { var w4 = wAt(y) - 6; if (w4 > 0) R(cx - w4, 4 + y, w4 * 2, 1, '#e8f0b4'); }
    // pit
    D(cx, 33, 7, '#8a5a36'); D(cx, 32, 6, '#a8744a'); R(cx - 3, 28, 3, 1, '#c28d5c'); P(cx - 4, 30, '#c28d5c');
    // soft shadow lines on the skin
    for (y = 12; y < 38; y += 4) { P(cx - wAt(y) + 1, 4 + y, '#86b062'); }
    R(cx - 18, 42, 36, 2, 'rgba(60,40,20,0.18)');
    return { cv: cv, ax: cx, ay: 44, faceY: 20 };
  }
  function buildTomato() {
    var cv = C.makeCanvas(44, 50), c = cv.getContext('2d');
    C.setCtx(c);
    var cx = 22, ty = 46, topY = 20, rx = 17, ry = 9, x, y;
    // pedestal (a little cream stool)
    E(cx, ty, 10, 4, '#6e4429'); E(cx, ty - 1, 9, 3, '#8e5c33'); R(cx - 2, topY + 3, 5, ty - topY - 3, '#8e5c33'); R(cx - 2, topY + 3, 1, ty - topY - 3, '#a8723f');
    // tomato slice: skin edge, flesh ring, inner wall, seed pockets
    E(cx, topY + 3, rx, ry, '#b53a2a');
    E(cx, topY + 1, rx, ry, '#d9482f');
    E(cx, topY, rx - 2, ry - 1, '#ef6a4c');
    E(cx, topY, rx - 4, ry - 3, '#f4876a');
    // seed pockets
    var pk = [[-8, -1], [0, -4], [8, -1], [-4, 3], [4, 3]];
    pk.forEach(function (q) { E(cx + q[0], topY + q[1], 3, 2, '#fbd9a0'); P(cx + q[0] - 1, topY + q[1], '#e8b867'); P(cx + q[0] + 1, topY + q[1] - 1, '#e8b867'); });
    // pith lines from the middle
    E(cx, topY, 3, 2, '#fbe6c4');
    [[-4, -2], [4, -2], [0, 3]].forEach(function (q) { P(cx + q[0], topY + q[1], '#fbe6c4'); P(cx + Math.round(q[0] * 1.5), topY + Math.round(q[1] * 1.3), '#fbe6c4'); });
    // highlight
    for (x = -rx + 6; x < -4; x++) P(cx + x, topY - Math.round((ry - 1) * Math.sqrt(Math.max(0, 1 - (x * x) / ((rx - 2) * (rx - 2))))) + 1, 'rgba(255,255,255,0.65)');
    // little green leaf on the edge
    R(cx + 11, topY - 7, 4, 2, '#5fa65a'); R(cx + 13, topY - 8, 3, 2, '#7fc96e'); P(cx + 12, topY - 5, '#4a8f52');
    return { cv: cv, ax: cx, ay: ty, topY: topY - ty };
  }

  /* ---------- little sprites ---------- */
  var ICONS = {
    heart: ['01010', '11111', '11111', '01110', '00100'],
    note: ['00110', '00101', '00100', '11100', '11100'],
    coffee: ['01010', '10100', '11111', '11111', '01110'],
    spark: ['00100', '00100', '11111', '00100', '00100'],
    check: ['00001', '00011', '10110', '01100', '00100'],
    leaf: ['00110', '01111', '11110', '11100', '10000'],
    drop: ['00100', '00100', '01110', '11111', '01110']
  };
  var ICON_COL = { heart: '#e8607a', note: '#7a5aa8', coffee: '#8a5a36', spark: '#f2b630', check: '#4aa66a', leaf: '#4aa150', drop: '#5aa9e6' };
  function icon(name, x, y, col) {
    var m = ICONS[name]; if (!m) return;
    var g = C.ctx(); g.fillStyle = col || ICON_COL[name] || '#444';
    for (var j = 0; j < 5; j++) for (var i = 0; i < 5; i++) if (m[j].charAt(i) === '1') g.fillRect(x + i, y + j, 1, 1);
  }
  function bubble(cx, y, name) {
    R(cx - 8, y - 11, 17, 13, '#5a4a5e');
    R(cx - 7, y - 10, 15, 11, '#ffffff');
    P(cx - 1, y + 2, '#5a4a5e'); P(cx - 1, y + 1, '#ffffff'); P(cx, y + 3, '#5a4a5e'); P(cx, y + 2, '#ffffff');
    icon(name, cx - 2, y - 7);
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

  /* ---------- the scene ---------- */
  function Scene(canvas) {
    this.canvas = canvas;
    canvas.width = W; canvas.height = H;
    this.ctx = canvas.getContext('2d');
    this.state = { hour: 12, weather: 'clear', fire: true, mode: 'idle', plants: {}, player: Pe.defaultSpec(), calm: false };
    this.time = 0; this.last = null;
    this.hover = null;
    this.particles = [];
    this.watering = null;
    this.cheerAt = -99; this.pulse = {};
    this.build();
  }

  Scene.prototype.build = function () {
    var mk = C.makeCanvas, self = this, i;
    placePlants();
    this.bgPattern = buildBgPattern();
    this.floor = buildFloor();
    this.walls = buildWalls();
    this.wire = { R: mk(WL, WH), L: mk(WL, WH) };
    strings(this.wire.R.getContext('2d'), 1); strings(this.wire.L.getContext('2d'), 2);
    this.flat = { R: mk(WL, WH), L: mk(WL, WH) };
    this.skyCv = mk(GLASS.w, GLASS.h);
    this.tableSpr = {};
    TABLES.forEach(function (tb) { self.tableSpr[tb.id] = buildTable(tb); });
    this.nookSpr = buildNook();
    this.avoSpr = buildAvocado(); this.tomSpr = buildTomato();

    // people
    var r = rng(99);
    this.people = [];
    TABLES.forEach(function (tb) {
      var ctr = iso(tb.gx, tb.gy);
      tb.cx = ctr[0]; tb.ty = ctr[1];
      tb.seats = [];
      tb.ang.forEach(function (deg, i) {
        var a = deg * Math.PI / 180;
        var dx = Math.round(tb.R * Math.cos(a)), dy = Math.round(0.5 * tb.R * Math.sin(a));
        var isPlayer = tb.id === PLAYER_SEAT.table && i === PLAYER_SEAT.index;
        var spec = isPlayer ? self.state.player : Pe.roster[tb.id][i];
        var cx = ctr[0] + dx, T = ctr[1] + dy - 8;
        tb.seats.push({ x: cx, T: T });
        self.people.push({
          id: tb.id + i, table: tb.id, cx: cx, T: T, spec: spec, isPlayer: isPlayer, ang: a,
          ph: r() * 6.28, chair: CHAIRS[(i + (tb.id === 'fr' ? 2 : 0)) % CHAIRS.length],
          bubble: null, nextBubble: 6 + r() * 14, waveUntil: 0
        });
      });
    });
    var np = iso(NOOK.gx, NOOK.gy); this.nook = { x: np[0], y: np[1] };
    var dp = iso(DOGSPOT.gx, DOGSPOT.gy); this.dogPos = { x: dp[0], y: dp[1] };
    var hp = iso(HEARTH.gx, HEARTH.gy); this.hearthPos = { x: hp[0], y: hp[1] };
    var ap = iso(AVO.gx, AVO.gy); this.avoPos = { x: ap[0], y: ap[1] };
    var tp = iso(TOM.gx, TOM.gy); this.tomPos = { x: tp[0], y: tp[1] };
    var bp = iso(BARISTA.gx, BARISTA.gy); this.baristaPos = { x: bp[0], y: bp[1] };
    this.barista = { cx: bp[0], T: bp[1] - 14, waveUntil: 0, spec: Pe.cleanSpec({ name: 'Pia', skin: 6, hair: 'bun', hairColor: 1, body: 1, outfit: 'overalls', outfitColor: 4, glasses: 'none', facial: 'none', detail: 'freckles', hairAcc: 'none', headphones: false, hearing: false, seat: 'chair' }) };
    var sg = iso(SIGN.gx, SIGN.gy); this.signPos = { x: sg[0], y: sg[1] };
    this.stools = STOOLS.map(function (q) { var o = iso(q[0], q[1]); return { x: o[0], y: o[1], col: q[2] }; });
    this.stoolY = this.stools[0].y;
    this.lamps = [];

    // sky bits
    var rs = rng(5);
    this.stars = []; for (i = 0; i < 34; i++) this.stars.push({ x: rs() * GLASS.w, y: rs() * GLASS.h * 0.6, p: rs() * 6, big: rs() < 0.15 });
    this.clouds = []; for (i = 0; i < 6; i++) this.clouds.push({ x: rs() * GLASS.w, y: 3 + rs() * 14, s: 0.5 + rs() * 0.5, v: 1.5 + rs() * 3.5 });
    this.rain = []; for (i = 0; i < 36; i++) this.rain.push({ x: rs() * GLASS.w, y: rs() * GLASS.h, v: 70 + rs() * 50 });
    this.drops = []; for (i = 0; i < 14; i++) this.drops.push({ x: rs() * GLASS.w, y: rs() * GLASS.h * 0.6, v: 1.5 + rs() * 3, hold: rs() * 5 });
    this.snow = []; for (i = 0; i < 30; i++) this.snow.push({ x: rs() * GLASS.w, y: rs() * GLASS.h, v: 8 + rs() * 10, sw: rs() * 6, big: rs() < 0.3 });
    this.motes = []; for (i = 0; i < 16; i++) this.motes.push({ x: 120 + rs() * 260, y: 150 + rs() * 170, v: 2 + rs() * 3, p: rs() * 6 });

    // the wandering cat
    var w0 = WAYPOINTS[0];
    this.cat = { gx: w0[0], gy: w0[1], x: 0, y: 0, dir: 1, state: 'walk', timer: 6, body: '#e8a458', belly: '#fff0dc', target: 1 };
    this.catPetUntil = 0;
  };

  Scene.prototype.setState = function (o) {
    for (var k in o) {
      if (k === 'player') { this.state.player = Pe.cleanSpec(o.player); this.people.forEach(function (p) { if (p.isPlayer) p.spec = this.state.player; }, this); }
      else this.state[k] = o[k];
    }
  };

  /* effects */
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

  /* hit testing in canvas pixels */
  function inRect(x, y, r) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }
  Scene.prototype.hit = function (x, y) {
    var i, st = this.state;
    for (i = 0; i < Pl.SLOTS.length; i++) {
      var s = Pl.SLOTS[i], p = st.plants[s.id];
      if (!p || !p.unlocked) continue;
      var r = Pl.rectFor(s);
      if (inRect(x, y, r)) return { type: 'plant', id: s.id, rect: r };
    }
    for (i = this.people.length - 1; i >= 0; i--) {
      var pe = this.people[i], pr = { x: pe.cx - 13, y: pe.T - 31, w: 26, h: 40 };
      if (inRect(x, y, pr)) return { type: pe.isPlayer ? 'player' : 'npc', id: pe.id, name: pe.spec.name, rect: pr };
    }
    var c = this.cat, cr = { x: c.x - 11, y: c.y - 20, w: 22, h: 22 };
    if (inRect(x, y, cr)) return { type: 'cat', id: 'cat', name: 'Biscuit', rect: cr };
    var d1 = { x: this.dogPos.x - 14, y: this.dogPos.y - 14, w: 28, h: 16 };
    if (inRect(x, y, d1)) return { type: 'dog', id: 'dog', name: 'Waffles', rect: d1 };
    var d2 = { x: this.hearthPos.x - 13, y: this.hearthPos.y - 16, w: 26, h: 16 };
    if (inRect(x, y, d2)) return { type: 'pebble', id: 'pebble', name: 'Pebble', rect: d2 };
    var av = { x: this.avoPos.x - 20, y: this.avoPos.y - 42, w: 40, h: 44 };
    if (inRect(x, y, av)) return { type: 'avocado', id: 'avocado', name: 'The avocado chair', rect: av };
    var bp = this.barista, br = { x: bp.cx - 13, y: bp.T - 32, w: 26, h: 22 };
    if (inRect(x, y, br)) return { type: 'barista', id: 'barista', name: 'Pia, your barista', rect: br };
    var cr2 = { x: Math.round(iso(CNT.x0, CNT.y1)[0]), y: Math.round(iso(CNT.x1, CNT.y0, CNT.h + 20)[1]), w: Math.round(iso(CNT.x1, CNT.y0)[0] - iso(CNT.x0, CNT.y1)[0]), h: Math.round(iso(CNT.x0, CNT.y1)[1] - iso(CNT.x1, CNT.y0, CNT.h + 20)[1]) };
    if (inRect(x, y, cr2)) return { type: 'counter', id: 'counter', rect: cr2 };
    var sgr = { x: this.signPos.x - 10, y: this.signPos.y - 28, w: 20, h: 30 };
    if (inRect(x, y, sgr)) return { type: 'sign', id: 'sign', rect: sgr };
    var nook = { x: this.nook.x - 24, y: this.nook.y - 44, w: 48, h: 48 };
    if (inRect(x, y, nook)) return { type: 'cards', id: 'cards', rect: nook };
    var fire = wallRect('L', 91, 123, 4, 38);
    if (inRect(x, y, fire)) return { type: 'fire', id: 'fire', rect: fire };
    var clock = wallRect('L', 96, 118, 68, 92);
    if (inRect(x, y, clock)) return { type: 'clock', id: 'clock', rect: clock };
    var win = wallRect('R', GLASS.fx, GLASS.fx + GLASS.w, GLASS.z0, GLASS.z0 + GLASS.h);
    if (inRect(x, y, win)) return { type: 'window', id: 'window', rect: win };
    var b1 = wallRect('R', 166, 204, 4, 100), b2 = wallRect('L', 4, 46, 4, 100);
    if (inRect(x, y, b1)) return { type: 'books', id: 'books', rect: b1 };
    if (inRect(x, y, b2)) return { type: 'books', id: 'books', rect: b2 };
    return null;
  };

  /* ---------- drawing ---------- */
  Scene.prototype.drawBackground = function (g) {
    var sky = skyAt(this.state.hour), i;
    this.sky = sky;
    var a = mix(sky.top, '#e0792e', 0.62), b = mix(sky.bot, '#f0a24a', 0.6);
    if (sky.ta > 0.3) { a = mix(sky.top, '#4a2a6a', 0.55); b = mix(sky.bot, '#6a3a78', 0.5); }
    else if (sky.ta > 0.12) { a = mix(a, '#a8483a', 0.35); b = mix(b, '#d9783a', 0.3); }
    var bands = 24, bh = Math.ceil(H / bands);
    for (i = 0; i < bands; i++) { g.fillStyle = mix(a, b, i / (bands - 1)); g.fillRect(0, i * bh, W, bh); }
    g.drawImage(this.bgPattern, 0, 0);
  };

  Scene.prototype.drawSkyTo = function (t) {
    var g = this.skyCv.getContext('2d'), GW = GLASS.w, GH = GLASS.h;
    C.setCtx(g);
    g.clearRect(0, 0, GW, GH);
    var st = this.state, h = st.hour, sky = skyAt(h), wx = st.weather;
    var top = sky.top, bot = sky.bot;
    if (wx === 'cloudy') { top = mix(top, '#9aa4b0', 0.5); bot = mix(bot, '#b9c0c9', 0.5); }
    else if (wx === 'rain') { top = mix(top, '#7c8796', 0.62); bot = mix(bot, '#98a2b0', 0.62); }
    else if (wx === 'snow') { top = mix(top, '#c4cfdb', 0.45); bot = mix(bot, '#dde5ee', 0.45); }
    var y, k;
    for (y = 0; y < GH; y += 2) R(0, y, GW, 2, mix(top, bot, y / (GH - 1)));
    var night = clamp((sky.ta - 0.1) / 0.4, 0, 1);
    var sa = clamp(sky.star * (wx === 'clear' ? 1 : wx === 'snow' ? 0.3 : 0.1), 0, 1);
    if (sa > 0.05) {
      this.stars.forEach(function (s) {
        var tw = 0.5 + 0.5 * Math.sin(t * 1.6 + s.p);
        g.fillStyle = 'rgba(255,255,240,' + (sa * (0.4 + 0.6 * tw)).toFixed(2) + ')';
        g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
        if (s.big && tw > 0.7) { g.fillRect(Math.round(s.x) - 1, Math.round(s.y), 3, 1); g.fillRect(Math.round(s.x), Math.round(s.y) - 1, 1, 3); }
      });
    }
    var hh = ((h % 24) + 24) % 24, dim = wx === 'clear' ? 1 : 0.45;
    if (hh >= 6 && hh <= 19.6) {
      var p = (hh - 6) / 13.6, sx = 9 + p * (GW - 18), sy = GH - 10 - Math.sin(p * Math.PI) * (GH * 0.62);
      var low = 1 - Math.sin(p * Math.PI), sc = mix('#fff3b0', '#ff9a5a', clamp(low * 1.4, 0, 1));
      g.globalAlpha = 0.25 * dim; D(sx, sy, 8, sc); g.globalAlpha = 0.5 * dim; D(sx, sy, 6, sc); g.globalAlpha = dim; D(sx, sy, 4, sc); g.globalAlpha = 1;
    }
    if (hh >= 18.8 || hh <= 6.7) {
      var mp = clamp(((hh + 24 - 18.8) % 24) / 11.9, 0, 1), mx = 9 + mp * (GW - 18), my = GH - 12 - Math.sin(mp * Math.PI) * (GH * 0.55);
      g.globalAlpha = dim;
      D(mx, my, 6, 'rgba(255,246,214,0.25)'); D(mx, my, 4, '#fff6d6'); D(mx + 2, my - 1, 3, mix(sky.top, sky.bot, 0.3));
      g.globalAlpha = 1;
    }
    var far = mix('#a9c9a6', '#1d2340', night * 0.7), near = mix('#86b68a', '#1d2340', night * 0.75), tree = mix('#5b8f6a', '#141a30', night * 0.75);
    if (wx !== 'clear') { far = mix(far, '#9aa4b0', 0.35); near = mix(near, '#8a96a2', 0.3); }
    function yf(x) { return Math.round(GH * 0.66 + 2.5 * Math.sin(x * 0.07) + 1.5 * Math.sin(x * 0.17 + 1)); }
    function yn(x) { return Math.round(GH * 0.8 + 2 * Math.sin(x * 0.06 + 2) + 1.5 * Math.sin(x * 0.15)); }
    var gx;
    for (gx = 0; gx < GW; gx++) R(gx, yf(gx), 1, GH - yf(gx), far);
    var lx = Math.round(GW * 0.76), ly = yf(lx);
    R(lx, ly - 9, 3, 9, mix('#f6f2ea', '#1d2340', night * 0.7)); R(lx, ly - 6, 3, 1, mix('#d96c5f', '#1d2340', night * 0.7)); R(lx, ly - 3, 3, 1, mix('#d96c5f', '#1d2340', night * 0.7));
    R(lx - 1, ly - 10, 5, 1, mix('#444452', '#14182a', night * 0.5));
    var beacon = night > 0.3 && Math.sin(t * 1.4) > 0.2;
    R(lx, ly - 12, 3, 2, beacon ? '#fff3a8' : mix('#bcb6a0', '#3a3a4a', night));
    for (gx = 0; gx < GW; gx++) R(gx, yn(gx), 1, GH - yn(gx), near);
    var hx0 = Math.round(GW * 0.2), hy0 = yn(hx0);
    R(hx0, hy0 - 5, 8, 6, mix('#e8c9a8', '#1d2340', night * 0.7));
    R(hx0 - 1, hy0 - 7, 10, 2, mix('#c97a5a', '#1d2340', night * 0.7)); R(hx0 + 1, hy0 - 8, 6, 1, mix('#c97a5a', '#1d2340', night * 0.7));
    R(hx0 + 5, hy0 - 4, 2, 2, night > 0.25 ? '#ffd27a' : mix('#cfe3f0', '#5a6a80', night));
    [0.05, 0.12, 0.4, 0.5, 0.6, 0.88, 0.94].forEach(function (f, ii) {
      var px = Math.round(GW * f), py = yn(px), ph = 6 + (ii % 3) * 2;
      for (k = 0; k < ph; k++) { var w = 1 + Math.floor(k * 0.5); R(px - Math.floor(w / 2), py - ph + k, w, 1, tree); }
      R(px, py, 1, 2, mix('#6e4429', '#14182a', night * 0.7));
    });
    if (wx === 'snow') R(0, GH - 3, GW, 3, 'rgba(255,255,255,0.7)');
    var cc = mix('#ffffff', sky.bot, 0.25);
    if (wx === 'cloudy') cc = '#d4d9df'; else if (wx === 'rain') cc = '#a3acb8'; else if (wx === 'snow') cc = '#e6ebf1';
    cc = mix(cc, '#2a2a4a', night * 0.65);
    var count = wx === 'clear' ? 2 : 6;
    for (var ci = 0; ci < count; ci++) {
      var cl = this.clouds[ci];
      var cx = ((cl.x + t * cl.v * (st.calm ? 0.3 : 1)) % (GW + 36)) - 18;
      var cy = cl.y + (wx === 'clear' ? 0 : 2), s = cl.s;
      g.globalAlpha = wx === 'clear' ? 0.85 : 0.95;
      E(cx, cy, 9 * s, 3 * s, cc); E(cx - 5 * s, cy - 2, 5 * s, 3 * s, cc); E(cx + 4 * s, cy - 3, 6 * s, 4 * s, cc);
      g.globalAlpha = 1;
    }
    var dt = this.dt || 0.033, calm = st.calm ? 0.35 : 1;
    if (wx === 'rain') {
      g.fillStyle = 'rgba(214,234,255,0.85)';
      this.rain.forEach(function (d) {
        d.y += d.v * dt * calm; d.x -= d.v * 0.12 * dt * calm;
        if (d.y > GH) { d.y = -4; d.x = Math.random() * GW; }
        if (d.x < 0) d.x += GW;
        g.fillRect(Math.round(d.x), Math.round(d.y), 1, 3);
      });
      this.drops.forEach(function (d) {
        if (d.hold > 0) d.hold -= dt; else d.y += d.v * dt * 4 * calm;
        if (d.y > GH) { d.y = Math.random() * 10; d.x = Math.random() * GW; d.hold = 1 + Math.random() * 5; }
        g.fillStyle = 'rgba(236,246,255,0.75)'; g.fillRect(Math.round(d.x), Math.round(d.y), 1, 2);
        g.fillStyle = 'rgba(236,246,255,0.3)'; g.fillRect(Math.round(d.x), Math.round(d.y) - 3, 1, 3);
      });
    } else if (wx === 'snow') {
      g.fillStyle = '#ffffff';
      this.snow.forEach(function (f) {
        f.y += f.v * dt * calm;
        if (f.y > GH) { f.y = -3; f.x = Math.random() * GW; }
        var sx = f.x + Math.sin(t * 0.8 + f.sw) * 3;
        g.fillRect(Math.round(sx), Math.round(f.y), f.big ? 2 : 1, f.big ? 2 : 1);
      });
    }
  };

  // lay a flat wall canvas onto the scene, one column at a time
  function shear(g, flat, side) {
    var c;
    if (side === 'R') {
      for (c = 0; c < WL; c++) g.drawImage(flat, c, 0, 1, WH, OX + c, OY - WH + (c >> 1), 1, WH);
    } else {
      for (c = 0; c < WL; c++) g.drawImage(flat, c, 0, 1, WH, OX - WL + c, OY - WH + ((WL - 1 - c) >> 1), 1, WH);
    }
  }

  Scene.prototype.drawWalls = function (g, t) {
    var st = this.state, i, x;
    this.drawSkyTo(t);

    // right wall: sky first, then the wall with its window hole on top
    var fR = this.flat.R.getContext('2d');
    C.setCtx(fR);
    fR.clearRect(0, 0, WL, WH);
    fR.drawImage(this.skyCv, GLASS.fx, 16);
    fR.drawImage(this.walls.R, 0, 0);
    fR.drawImage(this.wire.R, 0, 0);
    this.drawBulbs(fR, t, 0);
    shear(g, this.flat.R, 'R');

    // left wall
    var fL = this.flat.L.getContext('2d');
    C.setCtx(fL);
    fL.clearRect(0, 0, WL, WH);
    fL.drawImage(this.walls.L, 0, 0);
    this.drawFireFlat(fL, t);
    this.drawClockFlat(fL);
    fL.drawImage(this.wire.L, 0, 0);
    this.drawBulbs(fL, t, 7);
    shear(g, this.flat.L, 'L');
    C.setCtx(g);
  };

  Scene.prototype.drawBulbs = function (c, t, seed) {
    var cols = ['#ffd27a', '#ffb3c1', '#b9e6c9', '#bcd4ff'];
    for (var x = 4, i = 0; x < WL; x += 9, i++) {
      var k = (x % 52) / 52, yy = 6 + Math.round(5 * Math.sin(Math.PI * k)) + 1;
      var tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7 + seed);
      var col = mix(cols[(i + seed) % 4], '#7a644c', 0.45 * (1 - tw));
      R(x, yy, 2, 3, col);
    }
  };

  Scene.prototype.drawFireFlat = function (c, t) {
    var on = this.state.fire, i;
    if (!on) {
      P(100, 103, '#7a2e1c'); P(107, 102, '#5a2218'); P(112, 103, '#7a2e1c'); P(104, 101, '#4a1c14');
      if (Math.sin(t * 1.3) > 0.4) P(108, 103, '#a8401f');
      return;
    }
    for (i = 0; i < 5; i++) {
      var bx = 98 + i * 4;
      var h1 = 9 + 4 * Math.sin(t * 7 + i * 2.1) + 2 * Math.sin(t * 11 + i), h = Math.round(h1 - Math.abs(i - 2) * 1.2);
      flameShape(bx, 98, h, '#e8552a', 5);
      flameShape(bx, 98, Math.round(h * 0.78), '#f59a2a', 3);
      flameShape(bx, 98, Math.round(h * 0.5), '#ffd96a', 1);
    }
    R(98, 96, 16, 2, '#ffbe5a'); R(101, 95, 10, 1, '#ffd96a');
    var fl = Math.sin(t * 9) > 0 ? 1 : 0;
    R(79, 40 - fl, 1, 2 + fl, '#ffd96a'); P(79, 39 - fl, '#ff9a3a');
    R(85, 42 - fl, 1, 2 + fl, '#ffd96a'); P(85, 41 - fl, '#ff9a3a');
  };

  Scene.prototype.drawClockFlat = function (c) {
    var hv = ((this.state.hour % 24) + 24) % 24, hr = Math.floor(hv) % 12, mn = (hv % 1) * 60;
    var ha = (hr + mn / 60) / 12 * 6.283 - 1.5708, ma = mn / 60 * 6.283 - 1.5708;
    line(107, 30, 107 + Math.cos(ha) * 4, 30 + Math.sin(ha) * 4, '#5a3b2b');
    line(107, 30, 107 + Math.cos(ma) * 6, 30 + Math.sin(ma) * 6, '#7a4f2e');
    P(107, 30, '#d96c5f');
  };

  Scene.prototype.drawFloorLight = function (g, t) {
    var sky = this.sky, st = this.state;
    var day = clamp(1 - (sky.ta - 0.04) / 0.2, 0, 1);
    var kind = st.weather === 'clear' ? 1 : (st.weather === 'cloudy' ? 0.35 : 0.15);
    var a = 0.17 * day * kind;
    if (a < 0.01) return;
    g.fillStyle = mix('#fff6dc', sky.tint, 0.5); g.globalAlpha = a;
    var sway = Math.sin(t * 0.3) * 0.15;
    [[1.7, 3.3], [3.7, 5.2], [5.6, 7.1], [7.5, 9.1]].forEach(function (b) {
      var p1 = iso(b[0], 0.1), p2 = iso(b[1], 0.1), p3 = iso(b[1] + 2.4 + sway, 7.2), p4 = iso(b[0] + 2.4 + sway, 7.2);
      g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.lineTo(p3[0], p3[1]); g.lineTo(p4[0], p4[1]); g.closePath(); g.fill();
    });
    g.globalAlpha = 1;
    var dt = this.dt || 0.033;
    g.fillStyle = 'rgba(255,250,230,' + (0.75 * day * kind).toFixed(2) + ')';
    this.motes.forEach(function (m) {
      m.y -= m.v * dt * 0.5; m.x += Math.sin(t * 0.6 + m.p) * 0.12;
      if (m.y < 140) { m.y = 300; m.x = 120 + Math.random() * 260; }
      g.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    });
  };

  Scene.prototype.drawWallPlants = function (g, t) {
    var st = this.state;
    [0, 1, 2, 3, 5, 6, 13, 14].forEach(function (id) { this.drawOnePlant(g, t, Pl.SLOTS[id]); }, this);
  };
  Scene.prototype.drawFloorPlant = function (g, t, id) {
    var p = this.state.plants[id]; if (!p || !p.unlocked) return;
    var s = Pl.SLOTS[id]; this.softShadow(g, s.x, s.y, 14, 5, 0.22);
    this.drawOnePlant(g, t, s);
  };
  Scene.prototype.drawOnePlant = function (g, t, s) {
    var p = this.state.plants[s.id];
    if (!p || !p.unlocked) return;
    var bobY = 0, pu = this.pulse[s.id];
    if (pu && pu > this.time) bobY = -Math.round(Math.abs(Math.sin((pu - this.time) * 8)) * 2);
    if (bobY) { g.save(); g.translate(0, bobY); }
    Pl.drawPlant(s, p, t);
    if (bobY) g.restore();
    var r = Pl.rectFor(s);
    if (p.health === 1) icon('drop', s.x - 2, r.y - 6 + Math.round(Math.sin(t * 3)), '#5aa9e6');
    if (p.health === 2 && Math.random() < 0.012) this.emit('z', s.x + 4, r.y + 6, 1, { spread: 2 });
  };

  /* ---------- the cafe: bar, display case, barista, stools, awning, sign ---------- */
  var CNT = { x0: 3.4, x1: 9.2, y0: 1.7, y1: 2.9, h: 26 };
  var BARISTA = { gx: 6.4, gy: 0.9 };
  var STOOLS = [[4.2, 3.7, '#c4572f'], [5.5, 3.7, '#2f7f8a'], [6.8, 3.7, '#d9a02a']];
  var SIGN = { gx: 2.9, gy: 3.2 };

  function poly(g, pts, col) { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
  function rgbaLine(g, a, b, col) { g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(a[0]) + 0.5, Math.round(a[1]) + 0.5); g.lineTo(Math.round(b[0]) + 0.5, Math.round(b[1]) + 0.5); g.stroke(); }

  function pastry(kind, x, y) {
    x = Math.round(x); y = Math.round(y);
    if (kind === 0) { E(x, y - 2, 3, 2, '#e0a050'); E(x, y - 3, 3, 2, '#f48ab0'); P(x, y - 3, '#7a4a2a'); P(x - 2, y - 4, '#fff'); P(x + 2, y - 3, '#ffe27a'); }
    else if (kind === 1) { R(x - 2, y - 3, 5, 3, '#e6c49a'); R(x - 2, y - 3, 5, 1, '#c89a68'); E(x, y - 5, 3, 2, '#f8b4cc'); P(x, y - 7, '#d83a4a'); }
    else if (kind === 2) { E(x, y - 2, 4, 2, '#e0a040'); line(x - 2, y - 3, x - 2, y - 1, '#b87820'); line(x, y - 4, x, y - 1, '#b87820'); line(x + 2, y - 3, x + 2, y - 1, '#b87820'); }
    else if (kind === 3) { E(x, y - 2, 3, 2, '#c8883a'); P(x - 1, y - 3, '#5a3418'); P(x + 1, y - 2, '#5a3418'); }
    else { E(x, y - 2, 3, 1.5, '#f6b0c8'); R(x - 2, y - 2, 5, 1, '#fff4e4'); E(x, y - 1, 3, 1, '#f6b0c8'); }
  }

  Scene.prototype.drawCounter = function (g, t) {
    var k = CNT, i, q, x, y;
    var A = iso(k.x0, k.y0, k.h), B = iso(k.x1, k.y0, k.h), Cc = iso(k.x1, k.y1, k.h), Dd = iso(k.x0, k.y1, k.h);
    var D0 = iso(k.x0, k.y1, 0), C0 = iso(k.x1, k.y1, 0), B0 = iso(k.x1, k.y0, 0);
    this.softShadow(g, (D0[0] + C0[0]) / 2 - 6, (D0[1] + C0[1]) / 2 + 3, 98, 10, 0.24);
    // body: wood with teal tile panels and brass kick rail
    poly(g, [Dd, Cc, C0, D0], '#9a5228');
    poly(g, [Cc, B, B0, C0], '#74391b');
    var n = 7;
    for (i = 0; i < n; i++) {
      var f0 = k.x0 + (k.x1 - k.x0) * (i + 0.1) / n, f1 = k.x0 + (k.x1 - k.x0) * (i + 0.9) / n;
      poly(g, [iso(f0, k.y1, k.h - 3), iso(f1, k.y1, k.h - 3), iso(f1, k.y1, 6), iso(f0, k.y1, 6)], '#e8d8b8');
      poly(g, [iso(f0 + 0.05, k.y1, k.h - 5), iso(f1 - 0.05, k.y1, k.h - 5), iso(f1 - 0.05, k.y1, 8), iso(f0 + 0.05, k.y1, 8)], (i % 2) ? '#2f7f8a' : '#3a9aa6');
      var m1 = iso((f0 + f1) / 2, k.y1, k.h - 8); R(Math.round(m1[0]) - 1, Math.round(m1[1]), 2, 2, 'rgba(255,255,255,0.35)');
    }
    rgbaLine(g, iso(k.x0, k.y1, 4), iso(k.x1, k.y1, 4), '#e8b84a');
    rgbaLine(g, iso(k.x0, k.y1, 3), iso(k.x1, k.y1, 3), '#a8782a');
    // butcher block top with a lip
    poly(g, [A, B, Cc, Dd], '#f3e3c0');
    poly(g, [Dd, Cc, [Cc[0], Cc[1] + 2], [Dd[0], Dd[1] + 2]], '#dcbf88');
    poly(g, [Cc, B, [B[0], B[1] + 2], [Cc[0], Cc[1] + 2]], '#b8965a');
    var top = k.h, gy = 2.3;
    function at(gx, y2, z) { return iso(gx, y2, top + (z || 0)); }

    // pastry display case on the left end
    var cx0 = 3.55, cx1 = 5.35, cy0 = 1.95, cy1 = 2.75, cz = 16;
    var shelves = [1, 8];
    [0, 1].forEach(function (row) {
      var z = shelves[row];
      for (i = 0; i < 3; i++) { q = at(cx0 + 0.35 + i * 0.55, gy, z); pastry((row * 3 + i + 1) % 5, q[0], q[1]); }
    });
    // glass: back panel, then front and side with bright edges
    poly(g, [at(cx0, cy0, 0), at(cx1, cy0, 0), at(cx1, cy0, cz), at(cx0, cy0, cz)], 'rgba(255,248,230,0.35)');
    shelves.forEach(function (z) { poly(g, [at(cx0, cy0, z), at(cx1, cy0, z), at(cx1, cy1, z), at(cx0, cy1, z)], 'rgba(255,255,255,0.28)'); });
    poly(g, [at(cx0, cy1, 0), at(cx1, cy1, 0), at(cx1, cy1, cz), at(cx0, cy1, cz)], 'rgba(190,232,244,0.26)');
    poly(g, [at(cx1, cy0, 0), at(cx1, cy1, 0), at(cx1, cy1, cz), at(cx1, cy0, cz)], 'rgba(150,208,228,0.30)');
    poly(g, [at(cx0, cy0, cz), at(cx1, cy0, cz), at(cx1, cy1, cz), at(cx0, cy1, cz)], 'rgba(255,255,255,0.22)');
    var fr = 'rgba(255,255,255,0.9)', fg = '#e8b84a';
    rgbaLine(g, at(cx0, cy1, cz), at(cx1, cy1, cz), fr); rgbaLine(g, at(cx1, cy1, cz), at(cx1, cy0, cz), fr);
    rgbaLine(g, at(cx0, cy1, 0), at(cx0, cy1, cz), fr); rgbaLine(g, at(cx1, cy1, 0), at(cx1, cy1, cz), fr); rgbaLine(g, at(cx1, cy0, 0), at(cx1, cy0, cz), fr);
    rgbaLine(g, at(cx0, cy1, 0), at(cx1, cy1, 0), fg); rgbaLine(g, at(cx1, cy1, 0), at(cx1, cy0, 0), fg);
    q = at(cx0 + 0.3, cy1, cz - 4); R(Math.round(q[0]), Math.round(q[1]) - 3, 3, 1, 'rgba(255,255,255,0.8)');
    // tiny price tag
    q = at(cx1 - 0.15, cy1, 3); R(Math.round(q[0]) - 2, Math.round(q[1]) - 1, 4, 3, '#fff4e4'); P(Math.round(q[0]), Math.round(q[1]), '#c4302f');

    // grinder with beans
    q = at(5.75, 1.95); x = Math.round(q[0]); y = Math.round(q[1]);
    R(x - 4, y - 14, 8, 14, '#3a3a46'); R(x - 4, y - 14, 8, 2, '#5a5a6a'); R(x - 3, y - 20, 6, 6, '#7a4a2a'); R(x - 3, y - 20, 6, 1, '#a8703a'); R(x - 2, y - 5, 4, 3, '#b8bcc8');

    // cake dome
    q = at(5.95, gy); x = Math.round(q[0]); y = Math.round(q[1]);
    E(x, y + 1, 8, 3, '#e4dccb'); R(x - 5, y - 5, 11, 6, '#e85a8a'); R(x - 5, y - 7, 11, 2, '#fff1dc'); R(x - 5, y - 3, 11, 1, '#fff1dc');
    R(x - 2, y - 10, 4, 3, '#c4301f'); D(x, y - 11, 1, '#2f8a3f');
    g.fillStyle = 'rgba(210,240,250,0.35)'; g.beginPath(); g.ellipse(x, y - 4, 8, 9, 0, Math.PI, 0); g.fill();
    D(x - 4, y - 9, 1, 'rgba(255,255,255,0.9)');

    // register
    q = at(7.3, 2.7); x = Math.round(q[0]); y = Math.round(q[1]);
    R(x - 5, y - 5, 10, 5, '#5a5a6a'); R(x - 5, y - 5, 10, 1, '#7a7a8a'); R(x - 4, y - 11, 8, 6, '#3a3a4a'); R(x - 3, y - 10, 6, 3, '#9ae0b8'); R(x - 3, y - 6, 2, 1, '#e8d27a'); R(x + 1, y - 6, 2, 1, '#e8d27a');

    // espresso machine
    q = at(8.75, 2.0); x = Math.round(q[0]); y = Math.round(q[1]);
    R(x - 9, y - 19, 18, 19, '#c4302f'); R(x - 9, y - 19, 18, 3, '#e85a4a'); R(x - 9, y - 3, 18, 3, '#8a2020');
    R(x - 8, y - 16, 1, 12, '#e06050'); R(x + 8, y - 16, 1, 12, '#9a2a24');
    R(x - 7, y - 21, 14, 2, '#d8d8e0'); R(x - 5, y - 22, 10, 1, '#f2f2f6');
    D(x - 4, y - 12, 2, '#fff1dc'); P(x - 4, y - 12, '#3a3a3a'); P(x - 4, y - 13, '#c4302f');
    R(x + 1, y - 13, 2, 2, '#f6d870'); R(x + 4, y - 13, 2, 2, '#7ad08a');
    R(x - 3, y - 9, 6, 2, '#b8bcc8'); R(x - 1, y - 7, 2, 3, '#b8bcc8');
    R(x - 3, y - 3, 6, 3, '#fff1dc'); R(x - 3, y - 3, 6, 1, '#7a4a2a'); R(x + 3, y - 2, 2, 1, '#fff1dc');
    var sp = Math.sin(t * 2.2);
    D(x + Math.round(sp * 1.5), y - 25 - ((t * 6) % 6 | 0), 2, 'rgba(255,255,255,0.45)');
    D(x - 3 + Math.round(sp), y - 28 - ((t * 5 + 3) % 6 | 0), 1, 'rgba(255,255,255,0.35)');

    // stack of cups, teapot, tea tins, tip jar
    q = at(5.5, 2.85); x = Math.round(q[0]); y = Math.round(q[1]);
    R(x - 3, y - 4, 6, 4, '#fff1dc'); R(x - 3, y - 7, 6, 3, '#f4a8c0'); R(x - 3, y - 9, 6, 2, '#fff1dc'); R(x - 3, y - 4, 6, 1, '#d9c7a0');
    q = at(4.0, 2.95, 0); // saucer near the case
    q = at(8.15, 2.75); x = Math.round(q[0]); y = Math.round(q[1]);
    E(x, y - 5, 5, 4, '#2f7f8a'); R(x - 3, y - 11, 6, 2, '#3c98a4'); D(x, y - 12, 1, '#f6e8c8'); R(x + 4, y - 7, 4, 2, '#2f7f8a'); R(x - 8, y - 7, 3, 4, '#2f7f8a');
    q = at(6.7, 2.85); x = Math.round(q[0]); y = Math.round(q[1]);
    R(x - 3, y - 7, 6, 7, '#d9a02a'); R(x - 3, y - 7, 6, 1, '#f0c850'); R(x - 4, y - 5, 1, 3, '#7a4fb0'); R(x + 3, y - 6, 1, 6, '#7a4fb0');
    q = at(9.0, 2.75); x = Math.round(q[0]); y = Math.round(q[1]);
    R(x - 3, y - 8, 7, 8, 'rgba(210,240,250,0.5)'); R(x - 3, y - 8, 7, 1, '#e8b84a'); R(x - 2, y - 3, 5, 3, '#f0c850'); P(x, y - 4, '#f0c850'); P(x - 1, y - 5, '#d9a02a');
  };

  Scene.prototype.drawBarista = function (g, t) {
    var b = this.barista, wave = b.waveUntil > t;
    Pe.drawPerson(b.spec, b.cx, b.T, {
      t: t, chair: '#8a5a3a', bob: Math.floor(t * 4) % 6 === 0,
      blink: (t % 3.7) < 0.13, look: 'down', smile: true, wave: wave ? 1 : 0, cheer: 0
    });
    // little apron strap peeking out under the counter line is covered by the bar itself
  };

  Scene.prototype.drawStool = function (g, t, st) {
    var x = Math.round(st.x), y = Math.round(st.y), c = st.col;
    E(x, y + 1, 7, 2, 'rgba(30,14,6,0.28)');
    line(x - 4, y - 11, x - 5, y, '#5a3e28'); line(x + 4, y - 11, x + 5, y, '#5a3e28'); line(x, y - 10, x, y, '#6a4a30');
    E(x, y - 5, 5, 2, 'rgba(0,0,0,0)'); R(x - 4, y - 5, 9, 1, '#d8b04a');
    E(x, y - 12, 7, 3, shade(c, -0.25)); E(x, y - 13, 7, 3, c); E(x - 1, y - 14, 4, 1.5, shade(c, 0.3));
  };

  Scene.prototype.drawSign = function (g, t) {
    var p = this.signPos, x = Math.round(p.x), y = Math.round(p.y);
    this.softShadow(g, x, y + 1, 12, 3, 0.2);
    line(x - 9, y, x - 7, y - 24, '#7a5230'); line(x + 9, y, x + 7, y - 24, '#7a5230');
    R(x - 9, y - 26, 18, 2, '#9a6a3a');
    poly(g, [[x - 8, y - 24], [x + 8, y - 24], [x + 9, y - 2], [x - 9, y - 2]], '#8a5a2e');
    poly(g, [[x - 7, y - 23], [x + 7, y - 23], [x + 8, y - 3], [x - 8, y - 3]], '#2f4a3e');
    var chalk = '#f4efe0', X0 = x - 6, Y0 = y - 21;
    var L = { C: ['111', '100', '100', '100', '111'], A: ['010', '101', '111', '101', '101'], F: ['111', '100', '110', '100', '100'], E: ['111', '100', '110', '100', '111'] };
    'CAFE'.split('').forEach(function (ch, i) { L[ch].forEach(function (row, ry) { for (var rx = 0; rx < 3; rx++) if (row.charAt(rx) === '1') P(X0 + i * 4 + rx - 0, Y0 + ry, chalk); }); });
    R(x - 6, y - 13, 7, 1, 'rgba(244,239,224,0.7)'); R(x + 3, y - 13, 3, 1, 'rgba(244,239,224,0.7)');
    R(x - 6, y - 10, 9, 1, 'rgba(244,239,224,0.7)'); R(x + 4, y - 10, 2, 1, 'rgba(244,239,224,0.7)');
    R(x - 6, y - 7, 6, 1, 'rgba(244,239,224,0.7)'); R(x + 4, y - 7, 2, 1, 'rgba(244,239,224,0.7)');
    P(x, y - 5, '#f4a8c0'); P(x - 1, y - 6, '#f4a8c0'); P(x + 1, y - 6, '#f4a8c0');
  };

  // a striped awning over the window, with pendant lamps hanging from its edge
  Scene.prototype.drawAwning = function (g, t) {
    var fx0 = 20, fx1 = 138, zt = 108, zb = 91, off = [-9, 5], n = 9, i;
    function wp(fx, z, o) { var q = wallPt('R', fx, z); return [q[0] + (o ? off[0] : 0), q[1] + (o ? off[1] : 0)]; }
    // soft shade the awning throws on the wall
    poly(g, [wp(fx0, zb - 2, false), wp(fx1, zb - 2, false), wp(fx1, zb - 9, false), wp(fx0, zb - 9, false)], 'rgba(40,20,10,0.12)');
    var step = (fx1 - fx0) / n;
    for (i = 0; i < n; i++) {
      var a = fx0 + i * step, b = a + step, col = (i % 2) ? '#fff3dc' : '#d9402f', dk = (i % 2) ? '#e8d6b0' : '#a82a20';
      poly(g, [wp(a, zt, false), wp(b, zt, false), wp(b, zb, true), wp(a, zb, true)], col);
      poly(g, [wp(a, zt, false), wp(b, zt, false), wp(b, zt - 3, false), wp(a, zt - 3, false)], dk);
      var m = wp((a + b) / 2, zb, true);
      g.fillStyle = col; g.beginPath(); g.ellipse(Math.round(m[0]), Math.round(m[1]) + 1, step * 0.5, 3, 0, 0, Math.PI); g.fill();
      g.fillStyle = dk; g.beginPath(); g.ellipse(Math.round(m[0]), Math.round(m[1]) + 3, step * 0.5, 1.2, 0, 0, Math.PI); g.fill();
    }
    rgbaLine(g, wp(fx0, zb, true), wp(fx1, zb, true), 'rgba(90,30,20,0.5)');
    // pendant lamps
    this.lamps = [];
    [44, 78, 112].forEach(function (fx, li) {
      var q = wp(fx, zb - 2, true), x = Math.round(q[0]), y = Math.round(q[1]) + 2, drop = 12 + (li % 2) * 3 + Math.round(Math.sin(t * 1.3 + li) * 0.5);
      R(x, y, 1, drop, '#3a2a20');
      poly(g, [[x - 5, y + drop + 5], [x + 6, y + drop + 5], [x + 3, y + drop], [x - 2, y + drop]], '#e8b84a');
      R(x - 5, y + drop + 5, 11, 1, '#a8782a'); R(x - 3, y + drop + 6, 7, 2, '#fff1b8'); R(x - 2, y + drop + 1, 2, 3, 'rgba(255,255,255,0.45)');
      this.lamps.push([x, y + drop + 8]);
    }, this);
  };

  Scene.prototype.drawNook = function (g, t) {
    var n = this.nookSpr, x = this.nook.x, y = this.nook.y;
    g.drawImage(n.cv, x - n.ax, y - n.ay);
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
    if (Math.sin(t * 2.2) > 0.85) { P(x + 12, topY - 16, '#ffffff'); P(x + 11, topY - 15, '#ffffff'); P(x + 13, topY - 15, '#ffffff'); }
    if (Math.random() < 0.02) this.emit('spark', x + 13, topY - 14, 1, { spread: 4, speed: 8, life: 1 });
  };

  Scene.prototype.drawHearthPet = function (g, t) {
    var hp = this.hearthPos, cx = hp.x, cy = hp.y, b2 = Math.sin(t * 1.7) > 0 ? 1 : 0;
    // stone hearth slab and a cushion
    E(cx, cy + 2, 26, 8, '#cdbba0'); E(cx, cy + 1, 26, 8, '#e3d4bc');
    E(cx, cy, 14, 5, '#d98a8a'); E(cx, cy - 1, 14, 5, '#e9a5a5');
    E(cx - 1, cy - 5, 7, 3 + b2, '#9aa0ad'); R(cx - 5, cy - 7, 1, 3, '#7c8290'); R(cx - 2, cy - 7, 1, 3, '#7c8290');
    R(cx + 4, cy - 9, 6, 5, '#9aa0ad'); P(cx + 4, cy - 10, '#9aa0ad'); P(cx + 9, cy - 10, '#9aa0ad'); P(cx + 6, cy - 7, '#5a5f6c'); P(cx + 8, cy - 7, '#5a5f6c');
    R(cx - 9, cy - 3, 4, 2, '#9aa0ad');
    if (Math.random() < 0.006) this.emit('z', cx + 10, cy - 12, 1, { spread: 2 });
  };
  Scene.prototype.drawAvocado = function (g, t) {
    var a = this.avoSpr, x = this.avoPos.x, y = this.avoPos.y;
    var sq = Math.sin(t * 1.3) > 0.5 ? 1 : 0;
    g.drawImage(a.cv, x - a.ax, y - a.ay + sq);
    var fy = y - a.ay + a.faceY + sq;
    var blink = ((t * 0.9) % 4.3) < 0.14;
    if (this.avoJoy && this.avoJoy > t) { P(x - 6, fy, '#2a1f2a'); P(x - 5, fy - 1, '#2a1f2a'); P(x - 4, fy, '#2a1f2a'); P(x + 4, fy, '#2a1f2a'); P(x + 5, fy - 1, '#2a1f2a'); P(x + 6, fy, '#2a1f2a'); }
    else if (blink) { R(x - 6, fy + 1, 3, 1, '#2a1f2a'); R(x + 4, fy + 1, 3, 1, '#2a1f2a'); }
    else { R(x - 6, fy - 1, 2, 3, '#2a1f2a'); R(x + 4, fy - 1, 2, 3, '#2a1f2a'); P(x - 6, fy - 1, '#ffffff'); P(x + 4, fy - 1, '#ffffff'); }
    R(x - 10, fy + 3, 3, 2, '#f4a0a8'); R(x + 8, fy + 3, 3, 2, '#f4a0a8');
    R(x - 2, fy + 4, 5, 1, '#8a3a3a'); P(x - 3, fy + 3, '#8a3a3a'); P(x + 3, fy + 3, '#8a3a3a'); R(x - 1, fy + 5, 3, 1, '#c85a62');
  };
  Scene.prototype.drawTomato = function (g, t) {
    var a = this.tomSpr, x = this.tomPos.x, y = this.tomPos.y;
    g.drawImage(a.cv, x - a.ax, y - a.ay);
    // a little mug of tea on it
    var by = y + a.topY - 2;
    R(x + 1, by - 5, 5, 5, '#fff5e8'); R(x + 1, by - 5, 5, 1, '#7a4a2a'); P(x + 6, by - 4, '#fff5e8'); P(x + 7, by - 3, '#fff5e8');
    for (var k = 0; k < 3; k++) { g.fillStyle = 'rgba(255,255,255,' + (0.55 - k * 0.15) + ')'; g.fillRect(Math.round(x + 3 + Math.sin(t * 2 + k)), by - 7 - k * 2, 1, 1); }
  };

  Scene.prototype.drawDog = function (g, t) {
    var x = this.dogPos.x, y = this.dogPos.y, br = Math.sin(t * 1.4) > 0.2 ? 1 : 0;
    E(x, y + 1, 14, 4, 'rgba(90,60,40,0.18)');
    R(x - 8, y - 5 - br, 15, 5 + br, '#d8a878'); R(x - 8, y - 5 - br, 15, 1, '#e8bd90');
    R(x + 5, y - 6, 6, 6, '#d8a878'); R(x + 9, y - 6, 3, 5, '#8a5a36'); R(x + 10, y - 3, 1, 1, '#2a1f2a'); R(x + 7, y - 3, 1, 1, '#5a3b2b');
    R(x - 10, y - 4, 3, 2, '#d8a878'); R(x - 4, y - 5 - br, 3, 2, '#fff0dc');
    if (Math.random() < 0.004) this.emit('z', x + 10, y - 10, 1, { spread: 2 });
  };

  Scene.prototype.softShadow = function (g, x, y, rx, ry, a) {
    g.save(); g.fillStyle = 'rgba(30,14,6,' + a + ')';
    for (var i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x, y, rx * (1 - i * 0.12), ry * (1 - i * 0.12), 0, 0, 6.283); g.globalAlpha = 0.5; g.fill(); }
    g.restore();
  };
  Scene.prototype.drawTableGroup = function (g, t, tb) {
    var self = this, mode = this.state.mode;
    var cheerP = (t - this.cheerAt) / 1.8; if (cheerP < 0 || cheerP > 1) cheerP = 0;
    var mine = this.people.filter(function (p) { return p.table === tb.id; }).sort(function (a, b) { return a.T - b.T; });
    mine.forEach(function (p) {
      var active = Math.sin(t * 0.6 + p.ph) > -0.35 && mode !== 'break';
      Pe.drawPerson(p.spec, p.cx, p.T, {
        t: t, chair: p.chair,
        bob: active && (Math.floor(t * 6 + p.ph * 10) % 5 === 0),
        blink: ((t + p.ph) % 4.1) < 0.13,
        look: mode === 'break' ? 'up' : 'down',
        smile: mode === 'break' || cheerP > 0 || p.waveUntil > t,
        cheer: cheerP, wave: p.waveUntil > t ? 1 : 0
      });
    });
    var sp = this.tableSpr[tb.id];
    this.softShadow(g, tb.cx, tb.ty + 1, tb.rx + 8, tb.rx * 0.5 + 4, 0.26);
    g.drawImage(sp.cv, tb.cx - sp.ax, tb.ty - sp.ay);
    var topY = tb.ty - TABLE_H;
    mine.forEach(function (p) {
      var rho = tb.rx * 0.5;
      var lx = Math.round(tb.cx + rho * Math.cos(p.ang)), ly = Math.round(topY + 0.5 * rho * Math.sin(p.ang) + 5);
      var k = Math.abs(Math.round(p.cx));
      Pe.drawLaptop(lx, ly, ['#e9e4da', '#dfe3ea', '#f0e2e2', '#e4ece0'][k % 4], ['#f4a6b8', '#a8d5ba', '#bcd7f2', '#f5d98a', '#c9a7ff'][k % 5]);
    });
    tb.items.forEach(function (it) { drawItem(it.k, Math.round(tb.cx + it.ox), Math.round(topY + it.oy), t); });
    if (tb.id === 'fr') this.drawOnePlant(g, t, Pl.SLOTS[7]);
    if (tb.id === 'fl') this.drawOnePlant(g, t, Pl.SLOTS[15]);
  };

  Scene.prototype.updateCat = function (dt) {
    var c = this.cat, wp = WAYPOINTS[c.target % WAYPOINTS.length];
    c.timer -= dt;
    if (c.state === 'walk') {
      var dx = wp[0] - c.gx, dy = wp[1] - c.gy, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.15) {
        c.target = Math.floor(Math.random() * WAYPOINTS.length);
        var r = Math.random();
        c.state = r < 0.45 ? 'sit' : (r < 0.75 ? 'groom' : 'loaf'); c.timer = 3 + Math.random() * 5;
      } else {
        var sp = 1.05 * dt;
        c.gx += dx / d * sp; c.gy += dy / d * sp;
        var sdx = dx - dy;
        if (Math.abs(sdx) > 0.05) c.dir = sdx > 0 ? 1 : -1;
      }
    } else if (c.timer <= 0) {
      c.state = 'walk';
    }
    var p = iso(c.gx, c.gy); c.x = p[0]; c.y = p[1];
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

  Scene.prototype.drawParticles = function (g) {
    this.particles.forEach(function (p) {
      var a = clamp((1 - p.life / p.max) * 1.6, 0, 1);
      g.globalAlpha = a;
      var x = Math.round(p.x), y = Math.round(p.y);
      if (p.kind === 'spark') { g.fillStyle = p.col; g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); }
      else if (p.kind === 'heart') icon('heart', x - 2, y - 2, '#e8607a');
      else if (p.kind === 'drop') { g.fillStyle = p.col; g.fillRect(x, y, 1, 2); }
      else if (p.kind === 'conf') { g.fillStyle = p.col; g.fillRect(x, y, 2, 2); }
      else if (p.kind === 'leaf') { g.fillStyle = p.col; g.fillRect(x, y, 2, 1); g.fillRect(x + 1, y + 1, 1, 1); }
      else if (p.kind === 'z') { g.fillStyle = '#ffffff'; g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x, y + 2, 3, 1); }
    });
    g.globalAlpha = 1;
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

  Scene.prototype.drawLighting = function (g, t) {
    var sky = this.sky, st = this.state;
    var night = clamp((sky.ta - 0.1) / 0.4, 0, 1);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = mix('#ffffff', sky.tint, clamp(sky.ta * 1.25, 0, 0.9));
    g.fillRect(0, 0, W, H);
    var wxMul = { cloudy: '#d8dde5', rain: '#bcc6d6', snow: '#e6ecf5' }[st.weather];
    if (wxMul) { g.fillStyle = wxMul; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = 'lighter';
    var flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3);
    var base = 0.25 + 0.75 * night;
    function glow(x, y, r, rgb, a) {
      for (var i = 0; i < 6; i++) D(x, y, Math.round(r * (1 - i * 0.15)), 'rgba(' + rgb + ',' + (a * 0.16).toFixed(3) + ')');
    }
    var fp = wallPt('L', 107, 22);
    if (st.fire) glow(fp[0], fp[1], 60, '255,150,70', (0.07 + 0.36 * night) * flick);
    (this.lamps || []).forEach(function (l) { glow(l[0], l[1], 20, '255,200,120', 0.34 * base); });
    var c1 = wallPt('L', 79, 44), c2 = wallPt('L', 85, 46);
    glow(c1[0], c1[1], 9, '255,190,110', 0.28 * base); glow(c2[0], c2[1], 9, '255,190,110', 0.28 * base);
    glow(this.nook.x - 14, this.nook.y - 36, 14, '255,190,110', 0.3 * base);
    glow(this.nook.x + 12, this.nook.y - 36, 14, '210,170,255', 0.10 + 0.08 * night);
    // string lights glow
    if (night > 0.1) {
      for (var x = 4, i = 0; x < WL; x += 27, i++) {
        var yy = 6 + Math.round(5 * Math.sin(Math.PI * ((x % 52) / 52))) + 2;
        var pr = wallPt('R', x, WH - yy), pl = wallPt('L', x, WH - yy);
        glow(pr[0], pr[1], 10, '255,214,140', 0.2 * night); glow(pl[0], pl[1], 10, '255,214,140', 0.2 * night);
      }
      this.people.forEach(function (p) { glow(p.cx, p.T - 14, 14, '190,215,255', 0.12 * night); });
    }
    g.globalCompositeOperation = 'source-over';
  };

  Scene.prototype.drawOverlays = function (g, t) {
    this.people.forEach(function (p) {
      if (p.bubble) bubble(p.cx, p.T - 33 + Math.round(Math.sin(t * 2 + p.ph)), p.bubble.name);
    });
    this.drawParticles(g);
    var h = this.hover;
    if (h && h.rect) {
      var r = h.rect;
      [[r.x, r.y, 1, 1], [r.x + r.w - 1, r.y, -1, 1], [r.x, r.y + r.h - 1, 1, -1], [r.x + r.w - 1, r.y + r.h - 1, -1, -1]].forEach(function (q) {
        var x = q[0], y = q[1], sx = q[2], sy = q[3];
        g.fillStyle = 'rgba(90,74,94,0.6)';
        g.fillRect(sx > 0 ? x - 1 : x - 3, y - (sy > 0 ? 1 : 0), 5, 1);
        g.fillStyle = '#ffffff';
        g.fillRect(sx > 0 ? x : x - 3, y, 4, 1);
        g.fillRect(x, sy > 0 ? y : y - 3, 1, 4);
      });
    }
  };

  /* soft finishing: contact shadows where walls meet the floor, a gentle bloom, and a warm vignette */
  Scene.prototype.drawAO = function (g) {
    var d = 15;
    function strip(p0, p1, dx, dy) {
      var gr = g.createLinearGradient(p0[0], p0[1], p0[0] + dx, p0[1] + dy);
      gr.addColorStop(0, 'rgba(40,18,8,0.30)'); gr.addColorStop(1, 'rgba(40,18,8,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p1[0] + dx, p1[1] + dy); g.lineTo(p0[0] + dx, p0[1] + dy); g.closePath(); g.fill();
    }
    // right wall base runs along gy = 0, the floor lies toward +gy (down-left). left wall base runs along gx = 0 (down-right)
    strip(iso(0, 0), iso(N, 0), -d * 0.9, d * 0.5);
    strip(iso(0, 0), iso(0, N), d * 0.9, d * 0.5);
  };
  Scene.prototype.drawFinish = function (g) {
    if (!this.bloomCv) { this.bloomCv = C.makeCanvas(120, 90); }
    var bc = this.bloomCv, bg = bc.getContext('2d');
    bg.imageSmoothingEnabled = true;
    bg.clearRect(0, 0, 120, 90); bg.drawImage(g.canvas, 0, 0, 120, 90);
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.16;
    g.drawImage(bc, 0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    var vg = g.createRadialGradient(W / 2, H * 0.52, H * 0.34, W / 2, H * 0.52, H * 0.82);
    vg.addColorStop(0, 'rgba(60,24,10,0)'); vg.addColorStop(1, 'rgba(60,24,10,0.30)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    g.restore();
    C.setCtx(g);
  };

  Scene.prototype.frame = function (nowMs) {
    var t = nowMs / 1000;
    if (this.last === null) this.last = t;
    var dt = clamp(t - this.last, 0, 0.1); this.last = t; this.dt = dt; this.time = t;
    var g = this.ctx;
    C.setCtx(g);
    g.clearRect(0, 0, W, H);
    this.updateCat(dt); this.updateBubbles(t); this.updateParticles(dt);

    this.drawBackground(g);
    g.drawImage(this.floor, 0, 0);
    this.drawWalls(g, t);
    C.setCtx(g);
    this.drawAwning(g, t);
    this.drawAO(g);
    this.drawFloorLight(g, t);
    this.drawWallPlants(g, t);

    var self = this, c = this.cat;
    var list = [
      { y: Pl.SLOTS[4].y, fn: function () { self.drawFloorPlant(g, t, 4); } },
      { y: Pl.SLOTS[8].y, fn: function () { self.drawFloorPlant(g, t, 8); } },
      { y: Pl.SLOTS[9].y, fn: function () { self.drawFloorPlant(g, t, 9); } },
      { y: Pl.SLOTS[10].y, fn: function () { self.drawFloorPlant(g, t, 10); } },
      { y: Pl.SLOTS[11].y, fn: function () { self.drawFloorPlant(g, t, 11); } },
      { y: Pl.SLOTS[12].y, fn: function () { self.drawFloorPlant(g, t, 12); } },
      { y: this.hearthPos.y, fn: function () { self.drawHearthPet(g, t); } },
      { y: this.nook.y, fn: function () { self.drawNook(g, t); } },
      { y: iso(CNT.x1, CNT.y1)[1], fn: function () { self.drawCounter(g, t); } },
      { y: this.baristaPos.y, fn: function () { self.drawBarista(g, t); } },
      { y: this.signPos.y, fn: function () { self.drawSign(g, t); } },
      { y: this.stoolY, fn: function () { self.stools.forEach(function (st) { self.drawStool(g, t, st); }); } },
      { y: this.dogPos.y, fn: function () { self.drawDog(g, t); } },
      { y: this.avoPos.y, fn: function () { self.drawAvocado(g, t); } },
      { y: c.y, fn: function () { E(c.x, c.y, 8, 2, 'rgba(90,60,40,0.18)'); drawCat(Math.round(c.x), Math.round(c.y), c.dir, c.state, t, c.body, c.belly); } }
    ];
    TABLES.forEach(function (tb) { list.push({ y: tb.ty, fn: function () { self.drawTableGroup(g, t, tb); } }); });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (it) { it.fn(); });

    this.drawLighting(g, t);
    this.drawWatering(g, t);
    this.drawOverlays(g, t);
    this.drawFinish(g);
  };

  Cafe.Art = {
    W: W, H: H, GLASS: GLASS, TABLES: TABLES, PHASE_HOURS: PHASE_HOURS, skyAt: skyAt,
    createScene: function (canvas) { return new Scene(canvas); }
  };
})();
