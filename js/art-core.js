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

  /* Soft, painted versions of the old pixel helpers. Everything keeps the same coordinates, but shapes are
     drawn as smooth rounded dabs so, painted at a higher resolution, the scene reads as a flat illustration. */
  function rrPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath();
    if (r < 0.01) { g.rect(x, y, w, h); return; }
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function R(x, y, w, h, c) {
    if (c) g.fillStyle = tone(c);
    x = Math.round(x); y = Math.round(y);
    if (w <= 0 || h <= 0) return;
    var m = Math.min(w, h), r;
    if (w >= 60 && h >= 40) r = 0;
    else if (m <= 2) r = m * 0.5 * 0.9;
    else r = Math.min(1.15, m * 0.2);
    // a hair of overlap so neighbouring shapes never leave paper showing between them
    rrPath(x - 0.04, y - 0.04, w + 0.08, h + 0.08, r); g.fill();
  }
  /* gouache palette: every flat hex colour is eased toward a dusty, chalky version of itself */
  var toneCache = {};
  function tone(c) {
    if (typeof c !== 'string' || c.charAt(0) !== '#') return c;
    var t = toneCache[c]; if (t) return t;
    var h = c.slice(1); if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    if (h.length !== 6) return (toneCache[c] = c);
    var r = parseInt(h.substr(0, 2), 16) / 255, g_ = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255;
    var mx = Math.max(r, g_, b), mn = Math.min(r, g_, b), l = (mx + mn) / 2, d = mx - mn, s = 0, hu = 0;
    if (d) {
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      hu = mx === r ? (g_ - b) / d + (g_ < b ? 6 : 0) : mx === g_ ? (b - r) / d + 2 : (r - g_) / d + 4; hu /= 6;
    }
    s *= 0.68; l = l * 0.82 + 0.15;
    function f(p, q, t2) { if (t2 < 0) t2 += 1; if (t2 > 1) t2 -= 1; if (t2 < 1 / 6) return p + (q - p) * 6 * t2; if (t2 < .5) return q; if (t2 < 2 / 3) return p + (q - p) * (2 / 3 - t2) * 6; return p; }
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, R2, G2, B2;
    if (!s) { R2 = G2 = B2 = l; } else { R2 = f(p, q, hu + 1 / 3); G2 = f(p, q, hu); B2 = f(p, q, hu - 1 / 3); }
    function x(v) { v = Math.round(v * 255).toString(16); return v.length < 2 ? '0' + v : v; }
    return (toneCache[c] = '#' + x(R2) + x(G2) + x(B2));
  }

  function P(x, y, c) {
    if (c) g.fillStyle = tone(c);
    g.beginPath(); g.arc(Math.round(x) + 0.5, Math.round(y) + 0.5, 0.64, 0, 6.2832); g.fill();
  }

  // filled disk
  function D(cx, cy, r, c) {
    if (c) g.fillStyle = tone(c);
    g.beginPath(); g.arc(cx + 0.5, cy + 0.5, r + 0.55, 0, 6.2832); g.fill();
  }
  // filled ellipse
  function E(cx, cy, rx, ry, c) {
    if (c) g.fillStyle = tone(c);
    g.beginPath(); g.ellipse(cx + 0.5, cy + 0.5, rx + 0.55, ry + 0.55, 0, 0, 6.2832); g.fill();
  }
  // rounded rectangle
  function RR(x, y, w, h, r, c) {
    if (c) g.fillStyle = tone(c);
    rrPath(Math.round(x), Math.round(y), w, h, r + 0.3); g.fill();
  }
  // ring (outline of a circle)
  function ring(cx, cy, r, th, c, maxY) {
    c = c || g.fillStyle;
    g.save();
    if (maxY !== undefined) { g.beginPath(); g.rect(cx - r - 3, cy - r - 3, r * 2 + 6, maxY - (cy - r - 3) + 1); g.clip(); }
    g.lineWidth = th; g.strokeStyle = c ? tone(c) : g.strokeStyle;
    g.beginPath(); g.arc(cx + 0.5, cy + 0.5, r - th / 2 + 0.55, 0, 6.2832); g.stroke();
    g.restore();
  }
  // soft speckled fill (for curls and coils)
  function TX(x, y, w, h, c1, c2) {
    R(x, y, w, h, c1);
    g.fillStyle = tone(c2);
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      if (((i + j * 2) % 3) === 0) { g.beginPath(); g.arc(Math.round(x + i) + 0.5, Math.round(y + j) + 0.5, 0.5, 0, 6.2832); g.fill(); }
    }
  }
  function TXD(cx, cy, r, c1, c2) {
    D(cx, cy, r, c1);
    g.fillStyle = tone(c2);
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r && (((dx + r) + (dy + r) * 2) % 3) === 0) {
        g.beginPath(); g.arc(Math.round(cx + dx) + 0.5, Math.round(cy + dy) + 0.5, 0.5, 0, 6.2832); g.fill();
      }
    }
  }
  // a short brush stroke
  function line(x0, y0, x1, y1, c) {
    g.strokeStyle = c ? tone(c) : g.fillStyle;
    g.lineWidth = 1.15; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(Math.round(x0) + 0.5, Math.round(y0) + 0.5); g.lineTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5); g.stroke();
  }

  var K = 3; // canvases made through makeCanvas are painted at K times their logical size
  function makeCanvas(w, h, raw, kk) {
    var c = document.createElement('canvas');
    if (raw) { c.width = w; c.height = h; return c; }
    kk = kk || K;
    c.width = Math.round(w * kk); c.height = Math.round(h * kk);
    c.__lw = w; c.__lh = h; c.__k = kk;
    var cx = c.getContext('2d');
    cx.scale(kk, kk);
    return c;
  }
  // draw a canvas from makeCanvas at its logical size (or a given one)
  function blit(dst, src, x, y, w, h) {
    dst.drawImage(src, x, y, w || src.__lw || src.width, h || src.__lh || src.height);
  }

  Cafe.Core = {
    W: W, H: H,
    tone: tone, setCtx: setCtx, ctx: ctx,
    R: R, P: P, D: D, E: E, RR: RR, ring: ring, TX: TX, TXD: TXD, line: line,
    clamp: clamp, lerp: lerp, mix: mix, shade: shade, rng: rng,
    makeCanvas: makeCanvas, blit: blit, K: K
  };
})();
