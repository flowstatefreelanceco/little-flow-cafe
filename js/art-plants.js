/* Little flow cafe: the plants. Each plant is drawn from code so it can grow, droop, and perk back up. */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});
  var C = Cafe.Core;
  var R = C.R, P = C.P, E = C.E, line = C.line, shade = C.shade, mix = C.mix;

  var SLOTS = [
    { id: 0, kind: 'sill', x: 134, y: 94, type: 'succulent', name: 'Sunny', pot: '#c4572f', bloom: '#ff6a8a' },
    { id: 1, kind: 'sill', x: 192, y: 94, type: 'monstera', name: 'Monty', pot: '#d9a02a' },
    { id: 2, kind: 'sill', x: 250, y: 94, type: 'flower', name: 'Petal', pot: '#7a4fb0', bloom: '#ff6a9a', center: '#ffc61a' },
    { id: 3, kind: 'mantel', x: 310, y: 64, type: 'cactus', name: 'Spike', pot: '#2f7f8a', bloom: '#ff6a9a' },
    { id: 4, kind: 'floor', x: 109, y: 136, type: 'snake', name: 'Sir Snakes', pot: '#c4572f' },
    { id: 5, kind: 'hang', x: 100, y: 25, type: 'pothos', name: 'Piper', pot: '#d9a02a' },
    { id: 6, kind: 'hang', x: 284, y: 25, type: 'fern', name: 'Fernando', pot: '#c4572f' },
    { id: 7, kind: 'table', x: 64, y: 187, type: 'flower', name: 'Daisy', pot: '#d9a02a', bloom: '#fff3c4', center: '#f0a93a' },
    { id: 8, kind: 'floor', x: 0, y: 0, type: 'monstera', name: 'Big Bertha', pot: '#c4572f' },
    { id: 9, kind: 'floor', x: 0, y: 0, type: 'fern', name: 'Frida', pot: '#2f7f8a' },
    { id: 10, kind: 'floor', x: 0, y: 0, type: 'flower', name: 'Marigold', pot: '#d98a2a', bloom: '#ff9a2a', center: '#7a3a1a' },
    { id: 11, kind: 'floor', x: 0, y: 0, type: 'snake', name: 'Slim', pot: '#8a5a8f' },
    { id: 12, kind: 'floor', x: 0, y: 0, type: 'fern', name: 'Fiona', pot: '#d9a02a' },
    { id: 13, kind: 'mantel', x: 0, y: 0, type: 'succulent', name: 'Jade', pot: '#c4572f', bloom: '#ff6a8a' },
    { id: 14, kind: 'mantel', x: 0, y: 0, type: 'cactus', name: 'Prickles', pot: '#2f7f8a', bloom: '#ff6a8a' },
    { id: 15, kind: 'table', x: 0, y: 0, type: 'flower', name: 'Buttercup', pot: '#d9a02a', bloom: '#ffd23a', center: '#c8501a' }
  ];
  var UNLOCK_ORDER = [1, 0, 2, 7, 4, 3, 5, 6, 8, 12, 9, 10, 11, 13, 14, 15];
  var POT = {
    sill: { w: 9, h: 7 }, mantel: { w: 8, h: 6 }, floor: { w: 13, h: 11 }, hang: { w: 10, h: 7 }, table: { w: 9, h: 7 }
  };
  var BASE = {
    succulent: ['#8fd08a', '#4fae6a', '#2f8050'],
    cactus: ['#5fbf72', '#2f9a55', '#1f7040'],
    monstera: ['#3fb560', '#1f9448', '#146a35'],
    fern: ['#6ccf55', '#3fae48', '#238035'],
    flower: ['#5fc050', '#34a043', '#1f7a35'],
    snake: ['#4fb868', '#238f48', '#146a35'],
    pothos: ['#8ad640', '#4fb842', '#2f8f35'],
    calla: ['#4fc060', '#2a9a4a', '#16703a'],
    oxalis: ['#c26aa8', '#8f3a80', '#5e2058'],
    spider: ['#7ed455', '#4fb040', '#2f8035'],
    hydrangea: ['#5fc060', '#34a046', '#1f7a38'],
    aloe: ['#7fd080', '#3fa868', '#26805a'],
    rubber: ['#4aa860', '#2a7a45', '#164c2c'],
    fittonia: ['#58b858', '#2f8f45', '#1f6a35'],
    barrel: ['#5fbf72', '#2f9a55', '#1f7040'],
    morning: ['#8ad640', '#4fb842', '#2f8f35'],
    boba: ['#f0b896', '#d89a7a', '#a8704a'],
    sushi: ['#fffaf0', '#f4863a', '#2a2a34']
  };

  function colors(type, health) {
    var b = BASE[type] || BASE.fern;
    function f(c) {
      if (health === 1) return mix(c, '#d6c95a', 0.33);
      if (health >= 2) return mix(c, '#a38a58', 0.72);
      return c;
    }
    return { a: f(b[0]), b: f(b[1]), c: f(b[2]) };
  }

  var FLOOR_SCALE = 1.4;
  function rectFor(slot) {
    var x = slot.x, y = slot.y;
    if (slot.kind === 'floor') return { x: Math.round(x - 12 * FLOOR_SCALE), y: Math.round(y - 44 * FLOOR_SCALE), w: Math.round(24 * FLOOR_SCALE), h: Math.round(44 * FLOOR_SCALE) };
    if (slot.kind === 'hang') return { x: x - 11, y: y - 10, w: 22, h: 46 };
    return { x: x - 11, y: y - 32, w: 22, h: 32 };
  }

  function drawPot(slot, x, y) {
    var d = POT[slot.kind];
    var w = d.w, h = d.h;
    var pc = slot.pot, pd = shade(pc, -0.2), pl = shade(pc, 0.2);
    var top = y - h;
    var x0 = x - Math.floor(w / 2);
    R(x0, top, w, 2, pl);
    R(x0 + 1, top, w - 2, 1, '#5a3a24');
    R(x0 + 1, top + 2, w - 2, h - 4, pc);
    if (h >= 6) R(x0 + 1, top + 3, w - 2, 1, shade(pc, 0.12));
    R(x0 + 2, y - 2, w - 4, 2, pd);
    R(x0 + w - 3, top + 2, 1, h - 4, pd);
    R(x0 + 1, top + 2, 1, h - 5, pl);
    if (slot.kind === 'hang') {
      var cord = '#e3d2ab';
      var hk = slot.hook || 0; R(x, hk, 1, Math.max(0, top - 14 - hk), cord);
      line(x - 4, top, x, top - 14, cord);
      line(x + 4, top, x, top - 14, cord);
      P(x - 4, top, shade(cord, -0.2)); P(x + 4, top, shade(cord, -0.2));
    }
    return top;
  }

  function succulent(x, ay, st, c, dr, t, slot) {
    var d = Math.round(dr * 2);
    if (st === 0) { R(x - 1, ay - 2, 3, 2, c.b); P(x, ay - 3, c.a); return; }
    if (st === 1) { R(x - 3, ay - 3 + d, 7, 3, c.b); R(x - 2, ay - 5 + d, 5, 2, c.a); P(x, ay - 6 + d, c.a); return; }
    R(x - 5, ay - 4 + d, 11, 4, c.b);
    R(x - 4, ay - 7 + d, 9, 3, c.a);
    R(x - 2, ay - 9 + d, 5, 2, c.a);
    P(x, ay - 10 + d, shade(c.a, 0.25));
    R(x - 4, ay - 4, 1, 3, c.c); R(x + 4, ay - 4, 1, 3, c.c);
    if (dr < 0.5) { P(x - 5, ay - 4 + d, '#e89aa8'); P(x + 5, ay - 4 + d, '#e89aa8'); P(x - 4, ay - 7 + d, '#e89aa8'); P(x + 4, ay - 7 + d, '#e89aa8'); }
    if (st >= 3) {
      var bl = dr > 0.8 ? '#b39a7a' : slot.bloom;
      R(x, ay - 17 + d, 1, 8, c.c);
      R(x - 2, ay - 20 + d, 5, 3, bl); P(x, ay - 21 + d, shade(bl, 0.3)); P(x, ay - 19 + d, '#f5c443');
    }
  }

  function cactus(x, ay, st, c, dr, t, slot) {
    if (st === 0) { R(x - 2, ay - 4, 5, 4, c.b); R(x - 1, ay - 5, 3, 1, c.b); R(x - 2, ay - 4, 1, 4, c.a); return; }
    var h = [0, 9, 13, 16][st];
    var lean = dr > 0.5 ? 1 : 0;
    R(x - 3, ay - h + 2, 7, h - 2, c.b);
    R(x - 2, ay - h + 1, 5, 1, c.b);
    R(x - 1 + lean, ay - h, 3, 1, c.b);
    R(x - 3, ay - h + 2, 1, h - 2, c.a);
    R(x + 3, ay - h + 2, 1, h - 2, c.c);
    for (var k = 2; k < h - 1; k += 3) { P(x - 1, ay - k, c.a); P(x + 1, ay - k - 1, c.a); }
    if (st >= 2) { R(x - 8, ay - 9, 5, 2, c.b); R(x - 8, ay - 12, 2, 4, c.b); P(x - 8, ay - 12, c.a); }
    if (st >= 3) { R(x + 4, ay - 8, 5, 2, c.b); R(x + 7, ay - 11, 2, 4, c.b); P(x + 7, ay - 11, c.a); }
    if (st >= 3) {
      var bl = dr > 0.8 ? '#b39a7a' : slot.bloom;
      R(x - 1, ay - h - 2, 3, 2, bl); P(x, ay - h - 3, '#f5c443');
    }
  }

  function monstera(x, ay, st, c, dr, t, slot) {
    var layouts = [
      [[0, -8]],
      [[-5, -8], [5, -11]],
      [[-6, -7], [0, -13], [6, -9]],
      [[-8, -6], [-4, -14], [2, -19], [8, -12], [9, -5]]
    ];
    var L = layouts[st];
    var sz = st === 3 ? 4 : 3;
    for (var i = 0; i < L.length; i++) {
      var lx = x + L[i][0] + (dr > 0.3 ? Math.sign(L[i][0] || 1) * Math.round(dr * 2) : 0);
      var ly = ay + L[i][1] + Math.round(dr * 5) + Math.round(Math.sin(t * 1.2 + i) * 0.6);
      line(x, ay - 1, lx, ly + sz, c.c);
      E(lx, ly, sz + 1, sz, c.b);
      E(lx, ly - 1, sz, Math.max(1, sz - 1), c.a);
      P(lx, ly, c.c); P(lx + 1, ly + 1, c.c); P(lx - 2, ly + 1, c.c); P(lx + 2, ly - 1, c.c);
    }
  }

  function fern(x, ay, st, c, dr, t, slot) {
    var n = [3, 4, 6, 8][st], len = [6, 9, 12, 15][st];
    var hang = slot.kind === 'hang';
    for (var i = 0; i < n; i++) {
      var a = (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2.5);
      if (hang) a = (i / (n - 1) - 0.5) * 3.0;
      for (var k = 1; k <= len; k++) {
        var gx = Math.sin(a) * k * 0.95;
        var gy = -Math.cos(a) * k * 0.95 + k * k * (hang ? 0.08 : (0.022 + 0.035 * dr));
        var sw = Math.sin(t * 1.3 + i) * 0.4 * (k / len);
        var px = x + gx + sw, py = ay + gy;
        P(px, py, (k % 2) ? c.b : c.a);
        if (k % 2 === 0 && k > 2) { P(px - 1, py + 1, c.b); P(px + 1, py + 1, c.b); }
      }
    }
    R(x - 1, ay - 2, 3, 2, c.c);
  }

  function flower(x, ay, st, c, dr, t, slot) {
    if (st === 0) { R(x, ay - 4, 1, 4, c.b); R(x - 2, ay - 5, 2, 1, c.a); R(x + 1, ay - 6, 2, 1, c.a); return; }
    var n = [1, 1, 2, 3][st];
    var hs = [4, 8, 12, 15][st];
    var offs = n === 1 ? [0] : (n === 2 ? [-3, 3] : [-5, 0, 5]);
    for (var i = 0; i < n; i++) {
      var ox = offs[i];
      var sh = hs - (i % 2) * 3;
      var topx = x + ox + Math.round(dr * (ox >= 0 ? 2 : -2));
      var topy = ay - sh + Math.round(dr * 3);
      line(x, ay - 1, topx, topy + 1, c.b);
      P(topx - 1, Math.round((ay + topy) / 2), c.a); P(topx + 1, Math.round((ay + topy) / 2) + 1, c.a);
      var bl = dr > 0.8 ? '#b9a27c' : slot.bloom;
      if (st === 1) {
        R(topx - 1, topy - 1, 3, 3, bl); P(topx, topy - 2, c.b);
      } else {
        R(topx - 2, topy - 1, 5, 3, bl); R(topx - 1, topy - 2, 3, 5, bl);
        P(topx, topy, dr > 0.8 ? '#8a7448' : (slot.center || '#f5c443'));
      }
    }
  }

  function snake(x, ay, st, c, dr, t, slot) {
    var defs = [
      [[0, 9]],
      [[-4, 10], [0, 14]],
      [[-4, 13], [4, 12], [0, 18]],
      [[-8, 10], [8, 9], [-4, 16], [4, 15], [0, 22]]
    ][st];
    for (var i = 0; i < defs.length; i++) {
      var dx = defs[i][0], h = defs[i][1];
      for (var j = 0; j < h; j++) {
        var w = j > h - 4 ? 1 : (j > h - 8 ? 2 : 3);
        var shift = (j > h - 6) ? Math.round(dr * (dx < 0 ? -1 : 1) * (j - (h - 6)) * 0.5) : 0;
        var xx = x + dx + shift - Math.floor(w / 2);
        R(xx, ay - 1 - j, w, 1, (j % 4 === 0) ? c.c : c.b);
        if (dr < 0.5) P(xx, ay - 1 - j, '#d6e28a');
      }
    }
  }

  function pothos(x, ay, st, c, dr, t, slot) {
    var nv = [2, 3, 4, 5][st];
    var base = [5, 9, 15, 22][st];
    R(x - 4, ay - 3, 9, 3, c.b); R(x - 3, ay - 4, 7, 2, c.a);
    for (var v = 0; v < nv; v++) {
      var vx = x - 4 + Math.round(v * (8 / Math.max(1, nv - 1)));
      var L = Math.round(base * (0.7 + 0.3 * ((v * 37) % 5) / 4) * (1 - 0.3 * dr));
      for (var k = 0; k < L; k++) {
        var yy = ay + 1 + k;
        var xx = vx + Math.round(Math.sin(t * 1.4 + v + k * 0.15) * (0.4 + k * 0.04) * (dr < 0.5 ? 1 : 0.3));
        P(xx, yy, c.c);
        if (k % 4 === 2) { R(xx - 1, yy, 3, 2, c.b); P(xx, yy + 2, c.b); P(xx - 1, yy, c.a); }
      }
    }
  }

  function calla(x, ay, st, c, dr, t, slot) {
    var L = [[[-5, -5]], [[-6, -5], [5, -6]], [[-7, -5], [0, -9], [7, -6]], [[-9, -5], [-4, -10], [3, -12], [9, -6], [0, -7]]][st];
    var i;
    for (i = 0; i < L.length; i++) {
      var lx = x + L[i][0] + Math.round(dr * Math.sign(L[i][0] || 1) * 2), ly = ay + L[i][1] + Math.round(dr * 4);
      line(x, ay - 1, lx, ly, c.c);
      E(lx, ly - 2, 3, 5, c.b); E(lx, ly - 3, 2, 4, c.a); line(lx, ly + 1, lx, ly - 6, c.c);
    }
    if (st >= 2) {
      var n = st - 1;
      for (i = 0; i < n; i++) {
        var tx = x + (i - (n - 1) / 2) * 6 + Math.round(dr * (i ? 2 : -2)), ty = ay - 15 - i * 2 + Math.round(dr * 5);
        line(x, ay - 1, tx, ty + 3, c.b);
        var wh = dr > 0.8 ? '#d8c9a8' : '#fffaf0';
        E(tx, ty, 3, 4, wh); E(tx - 1, ty - 1, 1, 3, shade(wh, 0.12)); R(tx + 1, ty - 1, 1, 4, shade(wh, -0.12));
        P(tx, ty + 1, dr > 0.8 ? '#8a7448' : '#f5c443'); P(tx, ty, dr > 0.8 ? '#8a7448' : '#f5c443');
      }
    }
  }

  function oxalis(x, ay, st, c, dr, t, slot) {
    var n = [2, 4, 7, 10][st], i;
    for (i = 0; i < n; i++) {
      var px = x + Math.round(((i * 7) % 11 - 5) * 0.9), py = ay - 3 - (i % 3) * 2 + Math.round(dr * 3);
      line(px, py + 3, x, ay - 1, c.c);
      E(px - 2, py, 2, 2, c.b); E(px + 2, py, 2, 2, c.b); E(px, py - 2, 2, 2, c.a);
      P(px, py, c.c);
    }
    if (st >= 3 && dr < 0.5) { P(x - 4, ay - 12, '#ffd9ec'); P(x + 3, ay - 13, '#ffd9ec'); P(x + 6, ay - 10, '#ffd9ec'); P(x - 1, ay - 14, '#ffd9ec'); }
  }

  function spider(x, ay, st, c, dr, t, slot) {
    var n = [3, 5, 7, 9][st], len = [7, 10, 13, 16][st], hang = slot.kind === 'hang', i, k;
    for (i = 0; i < n; i++) {
      var a = (i / (n - 1) - 0.5) * 2.6, ex = 0, ey = 0;
      for (k = 1; k <= len; k++) {
        var px = x + Math.sin(a) * k * 0.95 + Math.sin(t * 1.1 + i) * 0.3 * (k / len);
        var py = ay - Math.cos(a) * k * 0.6 + k * k * ((hang ? 0.07 : 0.03) + 0.03 * dr);
        P(px, py, (k % 3 === 0) ? '#f1f0b8' : c.b); P(px, py + 1, c.a);
        ex = px; ey = py;
      }
      if (st >= 3 && (i === 0 || i === n - 1)) { var dir = i ? 1 : -1; line(ex, ey, ex + dir, ey + 3, c.c); P(ex + dir, ey + 4, c.a); P(ex + dir - 1, ey + 4, c.b); P(ex + dir + 1, ey + 4, c.b); P(ex + dir, ey + 5, c.b); }
    }
    R(x - 1, ay - 2, 3, 2, c.c);
  }

  function hydrangea(x, ay, st, c, dr, t, slot) {
    E(x - 4, ay - 3, 4, 3, c.b); E(x + 4, ay - 3, 4, 3, c.b); E(x, ay - 4, 4, 3, c.a);
    var spots = [[0, -12, 5], [-6, -8, 4], [6, -9, 4]];
    var n = [0, 1, 2, 3][st], bl = dr > 0.8 ? '#b9a79a' : (slot.bloom || '#7ab8f0'), i;
    for (i = 0; i < n; i++) {
      var q = spots[i], bx = x + q[0], by = ay + q[1] + Math.round(dr * 4), r = (st === 1 ? 3 : q[2]);
      line(x, ay - 1, bx, by + r, c.c);
      E(bx, by, r + 1, r, bl); E(bx - 1, by - 1, r, r - 1, shade(bl, 0.12));
      P(bx - 2, by, shade(bl, 0.4)); P(bx + 1, by - 1, shade(bl, 0.4)); P(bx, by + 2, shade(bl, -0.18)); P(bx + 2, by + 1, shade(bl, 0.4));
    }
  }

  function aloe(x, ay, st, c, dr, t, slot) {
    var n = [3, 5, 7, 9][st], len = [5, 8, 11, 13][st], i, k;
    for (i = 0; i < n; i++) {
      var a = (i / (n - 1) - 0.5) * 2.3, tx = x + Math.sin(a) * len + dr * Math.sign(a) * 3, ty = ay - 1 - Math.cos(a) * len * 0.95 + dr * len * 0.4 * Math.abs(a);
      line(x, ay - 1, tx, ty, c.b); line(x + 1, ay - 1, tx + 1, ty, c.a); P(tx, ty - 1, c.c);
      if (st >= 2 && i % 2 === 0) for (k = 3; k < len - 2; k += 3) P(x + (tx - x) * k / len + 1, ay - 1 + (ty - ay + 1) * k / len, '#d8f0c8');
    }
  }

  function rubber(x, ay, st, c, dr, t, slot) {
    var h = [6, 12, 18, 24][st], i;
    R(x, ay - h, 1, h, c.c);
    var nodes = [3, 6, 10, 14, 18, 22].filter(function (v) { return v <= h; });
    nodes.forEach(function (k, idx) {
      var side = idx % 2 ? 1 : -1, lx = x + side * (4 + Math.round(dr * 2)), ly = ay - k + Math.round(dr * 3) + Math.round(Math.sin(t * 1.1 + idx) * 0.5);
      line(x, ay - k, lx, ly, c.c);
      E(lx, ly, 4, 2, c.c); E(lx, ly - 1, 4, 2, c.b); E(lx - side, ly - 1, 3, 1, c.a);
      P(lx + side * 3, ly, shade(c.b, -0.2));
    });
    var top = dr > 0.8 ? '#8a7448' : '#9a2f55';
    E(x, ay - h - 2, 2, 3, top); P(x, ay - h - 3, shade(top, 0.3));
  }

  function fittonia(x, ay, st, c, dr, t, slot) {
    var n = [2, 4, 6, 8][st], bl = dr > 0.8 ? '#a38a58' : (slot.bloom || '#e8466a'), i;
    for (i = 0; i < n; i++) {
      var px = x + (((i * 5) % 13) - 6), py = ay - 2 - (i % 3) * 2 + Math.round(dr * 2);
      E(px, py, 4, 3, c.b); E(px, py, 3, 2, bl); line(px - 2, py, px + 2, py, '#ffe0e8'); line(px, py - 1, px, py + 1, '#ffe0e8');
    }
  }

  function barrel(x, ay, st, c, dr, t, slot) {
    var r = [3, 5, 6, 7][st], ry = r - (dr > 0.8 ? 1 : 0), i;
    E(x, ay - ry, r + 1, ry, c.b); E(x - 1, ay - ry - 1, r, ry - 1, c.a);
    for (i = -1; i <= 1; i++) line(x + i * (r - 1), ay - 1, x + i * Math.max(1, r - 3), ay - ry * 2 + 1, c.c);
    for (i = 1; i < ry * 2 - 1; i += 2) { P(x - 2, ay - i, '#f4f0c4'); P(x + 2, ay - i - 1, '#f4f0c4'); P(x, ay - i, '#f4f0c4'); }
    if (st >= 2) { var bl = dr > 0.8 ? '#b39a7a' : (slot.bloom || '#ff6a9a'); R(x - 2, ay - ry * 2 - 1, 5, 2, bl); P(x, ay - ry * 2 - 2, bl); P(x, ay - ry * 2 - 1, '#f5c443'); }
  }

  function morning(x, ay, st, c, dr, t, slot) {
    var nv = [2, 3, 4, 5][st], base = [5, 9, 15, 22][st], bl = dr > 0.8 ? '#a89aa8' : (slot.bloom || '#8a5ae0');
    R(x - 4, ay - 3, 9, 3, c.b); R(x - 3, ay - 4, 7, 2, c.a);
    for (var v = 0; v < nv; v++) {
      var vx = x - 4 + Math.round(v * (8 / Math.max(1, nv - 1)));
      var L = Math.round(base * (0.7 + 0.3 * ((v * 37) % 5) / 4) * (1 - 0.3 * dr));
      for (var k = 0; k < L; k++) {
        var yy = ay + 1 + k, xx = vx + Math.round(Math.sin(t * 1.4 + v + k * 0.15) * (0.4 + k * 0.04) * (dr < 0.5 ? 1 : 0.3));
        P(xx, yy, c.c);
        if (k % 4 === 2) { R(xx - 1, yy, 3, 2, c.b); P(xx, yy + 2, c.b); P(xx - 1, yy, c.a); }
        if (st >= 2 && k % 7 === 4) { R(xx + 1, yy - 1, 3, 3, bl); P(xx + 2, yy, '#fff3c4'); }
      }
    }
  }

  function face(x, y, sad, wink) {
    P(x - 2, y, '#2a1f2a'); P(x + 2, y, '#2a1f2a');
    P(x - 3, y + 1, '#f08aa8'); P(x + 3, y + 1, '#f08aa8');
    if (sad) { P(x - 1, y + 2, '#2a1f2a'); P(x, y + 1, '#2a1f2a'); P(x + 1, y + 2, '#2a1f2a'); }
    else { P(x - 1, y + 1, '#2a1f2a'); P(x, y + 2, '#2a1f2a'); P(x + 1, y + 1, '#2a1f2a'); }
  }

  function boba(x, ay, st, c, dr, t, slot) {
    var h = [7, 10, 14, 17][st], w = [6, 8, 10, 11][st], x0 = x - Math.floor(w / 2), top = ay - h, fade = dr > 0.8 ? 0.3 : 0;
    var body = mix('#f0b896', '#b8a898', fade), i;
    R(x0, top, w, h, body); R(x0, top, 1, h, shade(body, 0.2)); R(x0 + w - 1, top, 1, h, shade(body, -0.16));
    R(x0 - 1, top - 1, w + 2, 2, '#fff4e8'); R(x0, top - 2, w, 1, '#ffffff');
    R(x + 1, top - 10, 2, 9, '#3a3a46');
    for (i = 0; i < w - 1; i += 2) { P(x0 + 1 + i, ay - 1, '#3a2a2a'); P(x0 + 1 + i, ay - 2, '#3a2a2a'); if (i % 4 === 0) P(x0 + 2 + i, ay - 3, '#3a2a2a'); }
    if (st >= 1) face(x, top + Math.round(h * 0.38), dr > 0.4);
  }

  function sushi(x, ay, st, c, dr, t, slot) {
    var w = [4, 5, 6, 8][st], fade = dr > 0.8 ? 0.35 : 0;
    var rice = mix('#fffaf0', '#c8c0a8', fade), fish = mix('#f4863a', '#b89a7a', fade);
    E(x, ay - 3, w + 1, 4, shade(rice, -0.1)); E(x, ay - 4, w + 1, 3, rice);
    E(x, ay - 7, w + 1, 3, fish); line(x - w, ay - 7, x + w, ay - 6, shade(fish, 0.25)); line(x - w + 1, ay - 8, x + w - 2, ay - 8, shade(fish, 0.18));
    R(x - 1, ay - 10, 3, 8, '#2a2a34');
    if (st >= 1) face(x + (st >= 2 ? 3 : 2), ay - 4, dr > 0.4);
  }

  var TYPES = { succulent: succulent, cactus: cactus, monstera: monstera, fern: fern, flower: flower, snake: snake, pothos: pothos,
    calla: calla, oxalis: oxalis, spider: spider, hydrangea: hydrangea, aloe: aloe, rubber: rubber, fittonia: fittonia, barrel: barrel, morning: morning, boba: boba, sushi: sushi };

  /* every plant in the shop. bloom and center only matter for types that flower */
  var VARIETIES = [
    { id: 'succulent', type: 'succulent', label: 'Succulent', bloom: '#ff6a8a' },
    { id: 'jade', type: 'succulent', label: 'Jade', bloom: '#ffd23a' },
    { id: 'cactus', type: 'cactus', label: 'Cactus', bloom: '#ff6a9a' },
    { id: 'barrel', type: 'barrel', label: 'Barrel cactus', bloom: '#ff6a9a' },
    { id: 'monstera', type: 'monstera', label: 'Monstera' },
    { id: 'rubber', type: 'rubber', label: 'Rubber plant' },
    { id: 'snake', type: 'snake', label: 'Snake plant' },
    { id: 'aloe', type: 'aloe', label: 'Aloe' },
    { id: 'fern', type: 'fern', label: 'Fern' },
    { id: 'calla', type: 'calla', label: 'Calla lily' },
    { id: 'oxalis', type: 'oxalis', label: 'Purple shamrock' },
    { id: 'fittonia', type: 'fittonia', label: 'Nerve plant', bloom: '#e8466a' },
    { id: 'hydrangea', type: 'hydrangea', label: 'Blue hydrangea', bloom: '#7ab8f0' },
    { id: 'hydrangeaP', type: 'hydrangea', label: 'Pink hydrangea', bloom: '#f08ab8' },
    { id: 'flowerP', type: 'flower', label: 'Pink blooms', bloom: '#ff6a9a', center: '#ffc61a' },
    { id: 'daisy', type: 'flower', label: 'Daisies', bloom: '#fff3c4', center: '#f0a93a' },
    { id: 'marigold', type: 'flower', label: 'Marigolds', bloom: '#ff9a2a', center: '#7a3a1a' },
    { id: 'pothos', type: 'pothos', label: 'Pothos' },
    { id: 'spider', type: 'spider', label: 'Spider plant' },
    { id: 'morning', type: 'morning', label: 'Morning glory', bloom: '#8a5ae0' },
    { id: 'boba', type: 'boba', label: 'Boba buddy' },
    { id: 'sushi', type: 'sushi', label: 'Sushi pal' }
  ];
  var VBY = {};
  VARIETIES.forEach(function (v) { VBY[v.id] = v; });
  var HANG_OK = { pothos: 1, fern: 1, spider: 1, morning: 1 };
  function defaultVariety(slot) {
    var best = null;
    VARIETIES.forEach(function (v) {
      if (v.type !== slot.type) return;
      if (!best) best = v;
      if (slot.bloom && v.bloom === slot.bloom) best = v;
    });
    return best ? best.id : 'fern';
  }
  function varietiesFor(slot) {
    return VARIETIES.filter(function (v) { return slot.kind === 'hang' ? !!HANG_OK[v.type] : !(v.type === 'pothos' || v.type === 'morning'); });
  }
  function resolve(slot, choice) {
    var v = VBY[choice] || VBY[defaultVariety(slot)];
    return { type: v.type, bloom: v.bloom || slot.bloom, center: v.center || slot.center, id: v.id, label: v.label };
  }

  /* a dark outline, same trick as the people */
  function outline(cv) {
    var g = cv.getContext('2d'), w = cv.width, h = cv.height;
    var im = g.getImageData(0, 0, w, h), d = im.data, out = new Uint8ClampedArray(d.length);
    out.set(d);
    var x, y, k, i, j, nx, ny, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = (y * w + x) * 4;
      if (d[i + 3] > 40) continue;
      for (k = 0; k < 4; k++) {
        nx = x + dirs[k][0]; ny = y + dirs[k][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        j = (ny * w + nx) * 4;
        if (d[j + 3] > 200) { out[i] = d[j] * 0.45 + 10; out[i + 1] = d[j + 1] * 0.4 + 8; out[i + 2] = d[j + 2] * 0.45 + 14; out[i + 3] = 255; break; }
      }
    }
    im.data.set(out);
    g.putImageData(im, 0, 0);
  }

  var spriteCache = {};
  /* p = { stage 0..3, health 0 happy, 1 thirsty, 2 sleeping, variety } */
  function drawPlant(slot, p, t) {
    var st = C.clamp(p.stage | 0, 0, 3), h = p.health | 0;
    var dr = h === 0 ? 0 : (h === 1 ? 0.45 : 1);
    var rv = resolve(slot, p.variety);
    var hang = slot.kind === 'hang', sc = slot.kind === 'floor' ? FLOOR_SCALE : 1;
    var LW = 72, LH = hang ? 124 : 74, ox = 36, oy = hang ? 90 : 62;
    var tq = Math.floor(t * 8);
    var key = [slot.id, rv.id, st, h, tq].join('|');
    var ent = spriteCache[slot.id];
    if (!ent || ent.key !== key) {
      if (!ent) ent = spriteCache[slot.id] = { cv: C.makeCanvas(LW, LH), key: '' };
      var lg = ent.cv.getContext('2d');
      lg.clearRect(0, 0, LW, LH);
      var prev = C.ctx();
      C.setCtx(lg);
      var ls = { id: slot.id, kind: slot.kind, pot: slot.pot, type: rv.type, bloom: rv.bloom, center: rv.center, name: slot.name,
        x: ox, y: oy, hook: hang ? oy - (slot.y - (slot.hook || slot.y - 40)) : 0 };
      var cols = colors(rv.type, h), fn = TYPES[rv.type] || fern, top = oy - POT[slot.kind].h;
      if (hang) { drawPot(ls, ox, oy); fn(ox, top, st, cols, dr, tq / 8, ls); }
      else { fn(ox, top, st, cols, dr, tq / 8, ls); drawPot(ls, ox, oy); }
      outline(ent.cv);
      C.setCtx(prev);
      ent.key = key;
    }
    var g = C.ctx();
    g.imageSmoothingEnabled = sc !== 1;
    g.drawImage(ent.cv, Math.round(slot.x - ox * sc), Math.round(slot.y - oy * sc), Math.round(LW * sc), Math.round(LH * sc));
    g.imageSmoothingEnabled = false;
  }

  Cafe.Plants = {
    SLOTS: SLOTS, UNLOCK_ORDER: UNLOCK_ORDER, VARIETIES: VARIETIES, varietiesFor: varietiesFor, defaultVariety: defaultVariety, resolve: resolve, THRESHOLDS: [0, 3, 10, 22],
    drawPlant: drawPlant, rectFor: rectFor, drawPot: drawPot
  };
})();
