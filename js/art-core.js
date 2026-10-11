/* Little flow cafe: tiny pixel drawing helpers shared by the art files. */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});

  var W = 384, H = 216;
  var g = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb2hex(r, gg, b) {
    return '#' + [r, gg, b].map(function (v) {
      return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    }).join('');
  }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
  }
  // t from -1 (darker) to 1 (lighter)
  function shade(c, t) { return t < 0 ? mix(c, '#000000', -t) : mix(c, '#ffffff', t); }
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function setCtx(c) { g = c; if (g) g.imageSmoothingEnabled = false; }
  function ctx() { return g; }

  function R(x, y, w, h, c) {
    if (c) g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function P(x, y, c) { R(x, y, 1, 1, c); }

  // filled pixel disk
  function D(cx, cy, r, c) {
    if (c) g.fillStyle = c;
    for (var dy = -r; dy <= r; dy++) {
      var w = Math.floor(Math.sqrt(Math.max(0, r * r + r * 0.8 - dy * dy)));
      g.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
    }
  }
  // filled pixel ellipse
  function E(cx, cy, rx, ry, c) {
    if (c) g.fillStyle = c;
    for (var dy = -ry; dy <= ry; dy++) {
      var k = dy / (ry + 0.5);
      var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - k * k)));
      g.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
    }
  }
  // rounded rectangle
  function RR(x, y, w, h, r, c) {
    if (c) g.fillStyle = c;
    for (var i = 0; i < h; i++) {
      var d = 0;
      if (i < r) d = r - i;
      else if (i >= h - r) d = i - (h - r - 1);
      var inset = 0;
      if (d > 0) {
        var dy = d - 0.5;
        inset = Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)));
      }
      g.fillRect(Math.round(x + inset), Math.round(y + i), Math.max(0, w - inset * 2), 1);
    }
  }
  // ring (outline of a circle)
  function ring(cx, cy, r, th, c, maxY) {
    if (c) g.fillStyle = c;
    for (var dy = -r; dy <= r; dy++) {
      for (var dx = -r; dx <= r; dx++) {
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d <= r + 0.4 && d > r - th + 0.4 && (maxY === undefined || cy + dy <= maxY)) g.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
      }
    }
  }
  // dotted texture fill (for curls and coils)
  function TX(x, y, w, h, c1, c2) {
    R(x, y, w, h, c1);
    g.fillStyle = c2;
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      if (((i + j * 2) % 3) === 0) g.fillRect(Math.round(x + i), Math.round(y + j), 1, 1);
    }
  }
  function TXD(cx, cy, r, c1, c2) {
    D(cx, cy, r, c1);
    g.fillStyle = c2;
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r && (((dx + r) + (dy + r) * 2) % 3) === 0) {
        g.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
      }
    }
  }
  // 1px line (bresenham)
  function line(x0, y0, x1, y1, c) {
    if (c) g.fillStyle = c;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (var n = 0; n < 400; n++) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  Cafe.Core = {
    W: W, H: H,
    setCtx: setCtx, ctx: ctx,
    R: R, P: P, D: D, E: E, RR: RR, ring: ring, TX: TX, TXD: TXD, line: line,
    clamp: clamp, lerp: lerp, mix: mix, shade: shade, rng: rng,
    makeCanvas: makeCanvas
  };
})();
