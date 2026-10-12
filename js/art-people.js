/* Little flow cafe: people, character options, and the character preview. */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});
  var C = Cafe.Core;
  var R = C.R, P = C.P, D = C.D, RR = C.RR, ring = C.ring, TX = C.TX, TXD = C.TXD, shade = C.shade, mix = C.mix;

  /* ---------- options (also used by the creator screen) ---------- */
  var SKIN = ['#fbe3d0', '#f3cfb3', '#e8b98f', '#d49a6a', '#bb7d4f', '#a0653a', '#86502f', '#6a3d24', '#52301d', '#3d2316'];
  var HAIRC = ['#221b1d', '#3b2a24', '#5b3b2b', '#7a4a30', '#8c3b24', '#c9622e', '#d9b46a', '#efe3bb',
    '#aaa6a8', '#e9e7ea', '#e8559a', '#8a5fe0', '#17a398', '#3a73e0', '#4fb04f', '#6e2338'];
  var HAIRC_NAMES = ['Black', 'Dark brown', 'Brown', 'Chestnut', 'Auburn', 'Ginger', 'Golden blonde', 'Platinum',
    'Silver', 'White', 'Pink', 'Lavender', 'Teal', 'Blue', 'Green', 'Burgundy'];
  var OUTC = ['#4f9d6a', '#e8a317', '#d9577a', '#2f8f9a', '#8b63c8', '#f1e3c8', '#d9602f', '#3f5fa8',
    '#7c8f2f', '#c83a3a', '#2f93d1', '#3a3a4a'];

  var HAIR_STYLES = [
    { id: 'buzz', label: 'Buzz cut', group: 'Short' },
    { id: 'bald', label: 'Bald', group: 'Short' },
    { id: 'short', label: 'Short', group: 'Short' },
    { id: 'pixie', label: 'Pixie swoop', group: 'Short' },
    { id: 'curtains', label: 'Curtain bangs', group: 'Short' },
    { id: 'fade', label: 'Fade with curls on top', group: 'Short' },
    { id: 'mohawk', label: 'Mohawk', group: 'Short' },
    { id: 'bob', label: 'Bob', group: 'Straight and wavy' },
    { id: 'long', label: 'Long straight', group: 'Straight and wavy' },
    { id: 'shag', label: 'Shaggy layers', group: 'Straight and wavy' },
    { id: 'halfup', label: 'Half up', group: 'Straight and wavy' },
    { id: 'wavy', label: 'Long wavy', group: 'Straight and wavy' },
    { id: 'curly', label: 'Curly', group: 'Curly and coily' },
    { id: 'afro', label: 'Afro', group: 'Curly and coily' },
    { id: 'coily', label: 'Tapered coils', group: 'Curly and coily' },
    { id: 'puffs', label: 'Twin puffs', group: 'Curly and coily' },
    { id: 'highpuff', label: 'High puff', group: 'Curly and coily' },
    { id: 'locs', label: 'Locs', group: 'Protective styles' },
    { id: 'braids', label: 'Box braids', group: 'Protective styles' },
    { id: 'twists', label: 'Twists', group: 'Protective styles' },
    { id: 'bantu', label: 'Bantu knots', group: 'Protective styles' },
    { id: 'cornrows', label: 'Cornrows', group: 'Protective styles' },
    { id: 'sidebraid', label: 'Side braid', group: 'Protective styles' },
    { id: 'locbun', label: 'Locs in a bun', group: 'Protective styles' },
    { id: 'bun', label: 'Messy bun', group: 'Up dos' },
    { id: 'topknot', label: 'Top knot', group: 'Up dos' },
    { id: 'ponytail', label: 'Ponytail', group: 'Up dos' },
    { id: 'pigtails', label: 'Pigtails', group: 'Up dos' },
    { id: 'spacebuns', label: 'Space buns', group: 'Up dos' },
    { id: 'lowbun', label: 'Low bun', group: 'Up dos' },
    { id: 'headwrap', label: 'Headwrap', group: 'Headwear' },
    { id: 'hijab', label: 'Hijab', group: 'Headwear' }
  ];
  var BODIES = [
    { id: 0, label: 'Slim', w: 12 },
    { id: 1, label: 'Medium', w: 14 },
    { id: 2, label: 'Broad', w: 17 },
    { id: 3, label: 'Full', w: 20 }
  ];
  var OUTFITS = [
    { id: 'tee', label: 'Tee' }, { id: 'hoodie', label: 'Hoodie' }, { id: 'cardigan', label: 'Cardigan' },
    { id: 'stripes', label: 'Stripes' }, { id: 'overalls', label: 'Overalls' }, { id: 'turtle', label: 'Turtleneck' }
  ];
  var GLASSES = [{ id: 'none', label: 'None' }, { id: 'round', label: 'Round' }, { id: 'square', label: 'Square' }, { id: 'cat', label: 'Cat eye' }];
  var FACIAL = [{ id: 'none', label: 'None' }, { id: 'stubble', label: 'Stubble' }, { id: 'mustache', label: 'Mustache' }, { id: 'beard', label: 'Beard' }];
  var DETAILS = [{ id: 'none', label: 'None' }, { id: 'freckles', label: 'Freckles' }, { id: 'blush', label: 'Rosy cheeks' },
    { id: 'vitiligo', label: 'Vitiligo' }, { id: 'mole', label: 'Beauty mark' }];
  var HAIRACC = [{ id: 'none', label: 'None' }, { id: 'bow', label: 'Bow' }, { id: 'flower', label: 'Flower clip' }, { id: 'ears', label: 'Cat ears' }, { id: 'bear', label: 'Bear ears' }];
  var SEATS = [{ id: 'chair', label: 'Cafe chair' }, { id: 'wheelchair', label: 'Wheelchair' }];

  var EYEC = ['#3b2a22', '#6a4326', '#4f7fb8', '#4f9a6a', '#7a8f5a', '#8a6fc4', '#a6a9b0', '#c2527a'];
  var EYEC_NAMES = ['Deep brown', 'Warm brown', 'Blue', 'Green', 'Hazel', 'Violet', 'Gray', 'Rose'];
  var LAPTOPC = ['#e9e4da', '#f0b8c4', '#a9c9e8', '#a8d5ba', '#f2d27a', '#c9a7e8', '#e59a7a', '#4a4a52'];
  var LAPTOPC_NAMES = ['Cream', 'Blush pink', 'Sky blue', 'Sage green', 'Butter yellow', 'Lilac', 'Terracotta', 'Charcoal'];
  var SW = 52, SH = 56, AX = 26, AT = 44;

  var Options = {
    skin: SKIN, hairColors: HAIRC, hairColorNames: HAIRC_NAMES, outfitColors: OUTC,
    hairStyles: HAIR_STYLES, bodies: BODIES, outfits: OUTFITS, glasses: GLASSES,
    facial: FACIAL, details: DETAILS, hairAcc: HAIRACC, seats: SEATS, eyeColors: EYEC, eyeColorNames: EYEC_NAMES, laptopColors: LAPTOPC, laptopColorNames: LAPTOPC_NAMES
  };

  function defaultSpec() {
    return {
      name: 'You', skin: 4, hair: 'curly', hairColor: 1, body: 1, outfit: 'hoodie', outfitColor: 0,
      glasses: 'none', facial: 'none', detail: 'none', hairAcc: 'none', headphones: false, hearing: false, seat: 'chair', eyes: 0, laptop: 0
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function randomSpec(r) {
    r = r || Math.random;
    var s = defaultSpec();
    s.skin = Math.floor(r() * SKIN.length);
    s.hair = pick(r, HAIR_STYLES).id;
    s.hairColor = Math.floor(r() * 10);
    if (r() < 0.2) s.hairColor = 10 + Math.floor(r() * 6);
    s.body = Math.floor(r() * BODIES.length);
    s.outfit = pick(r, OUTFITS).id;
    s.outfitColor = Math.floor(r() * OUTC.length);
    s.glasses = r() < 0.4 ? pick(r, GLASSES).id : 'none';
    s.facial = r() < 0.18 ? pick(r, FACIAL).id : 'none';
    s.detail = r() < 0.4 ? pick(r, DETAILS).id : 'none';
    s.hairAcc = r() < 0.2 ? pick(r, HAIRACC).id : 'none';
    s.headphones = r() < 0.2;
    s.hearing = r() < 0.1;
    s.seat = r() < 0.1 ? 'wheelchair' : 'chair';
    s.eyes = Math.floor(r() * EYEC.length);
    s.laptop = Math.floor(r() * LAPTOPC.length);
    return s;
  }
  // make sure a saved spec has every field (older saves, or hand edits)
  function cleanSpec(s) {
    var d = defaultSpec();
    s = s && typeof s === 'object' ? s : {};
    var out = {};
    for (var k in d) out[k] = (s[k] === undefined || s[k] === null) ? d[k] : s[k];
    out.skin = C.clamp(parseInt(out.skin, 10) || 0, 0, SKIN.length - 1);
    out.hairColor = C.clamp(parseInt(out.hairColor, 10) || 0, 0, HAIRC.length - 1);
    out.outfitColor = C.clamp(parseInt(out.outfitColor, 10) || 0, 0, OUTC.length - 1);
    out.eyes = C.clamp(parseInt(out.eyes, 10) || 0, 0, EYEC.length - 1);
    out.laptop = C.clamp(parseInt(out.laptop, 10) || 0, 0, LAPTOPC.length - 1);
    out.body = C.clamp(parseInt(out.body, 10) || 0, 0, BODIES.length - 1);
    out.name = String(out.name || 'You').slice(0, 14);
    out.headphones = !!out.headphones;
    out.hearing = !!out.hearing;
    function inList(list, v) { return list.some(function (x) { return x.id === v; }); }
    if (!inList(HAIR_STYLES, out.hair)) out.hair = d.hair;
    if (!inList(OUTFITS, out.outfit)) out.outfit = d.outfit;
    if (!inList(GLASSES, out.glasses)) out.glasses = 'none';
    if (!inList(FACIAL, out.facial)) out.facial = 'none';
    if (!inList(DETAILS, out.detail)) out.detail = 'none';
    if (!inList(HAIRACC, out.hairAcc)) out.hairAcc = 'none';
    if (!inList(SEATS, out.seat)) out.seat = 'chair';
    return out;
  }

  /* ---------- chibi sprite: drawn once, outlined, then cached ---------- */
  var cache = {}, cacheN = 0;

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
        if (d[j + 3] > 200) {
          out[i] = d[j] * 0.7 + 12; out[i + 1] = d[j + 1] * 0.62 + 8; out[i + 2] = d[j + 2] * 0.66 + 14; out[i + 3] = 52;
          break;
        }
      }
    }
    im.data.set(out);
    g.putImageData(im, 0, 0);
  }

  /* ---------- cute vector chibi: soft shapes, tinted edges, painted at any scale ---------- */
  function ol(col) { return shade(mix(col, '#6b3b3b', 0.3), -0.2); }

  function paint(s, a) {
    var S = a.S || 3;
    var cv = C.makeCanvas(SW * S, SH * S, true), g = cv.getContext('2d');
    g.scale(S, S);
    g.lineJoin = 'round'; g.lineCap = 'round';
    var cx = AX, T = AT, t = a.t || 0;
    var bw = (BODIES[s.body] || BODIES[1]).w;
    var bob = a.bob ? 0.8 : 0;
    var hy = T - 24 + bob, hcy = hy + 8.8;
    var skin = SKIN[s.skin] || SKIN[2], skinD = shade(skin, -0.14), skinL = shade(skin, 0.14);
    var hc = HAIRC[s.hairColor] || HAIRC[0], hd = shade(hc, -0.22), hl = shade(hc, 0.28);
    var oc = OUTC[s.outfitColor] || OUTC[0], od = shade(oc, -0.18), olt = shade(oc, 0.22);
    var acc = a.accent || OUTC[(s.outfitColor + 3) % OUTC.length];
    var i, j;

    // path helpers
    function rrp(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }
    function ep(x, y, rx, ry, rot) { g.moveTo(x + rx, y); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832); }
    function paintShape(fn, col, o) {
      o = o || {};
      g.beginPath(); fn(); g.fillStyle = col; g.fill();
      if (o.line !== false) { g.lineWidth = o.lw || 0.5; g.strokeStyle = ol(col); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; }
    }
    function RRc(x, y, w, h, r, col, o) { paintShape(function () { rrp(x, y, w, h, r); }, col, o); }
    function Ec(x, y, rx, ry, col, o, rot) { paintShape(function () { ep(x, y, rx, ry, rot); }, col, o); }
    // union of shapes with one soft outline around the lot
    function group(fns, col, shine) {
      g.beginPath(); fns.forEach(function (f) { f(); });
      g.lineWidth = 1.1; g.strokeStyle = ol(col); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1;
      g.fillStyle = col; g.fill();
    }
    function circ(x, y, r) { return function () { ep(x, y, r, r); }; }
    function glow(x, y, rx, ry, col, al, rot) { g.globalAlpha = al; Ec(x, y, rx, ry, col, { line: false }, rot); g.globalAlpha = 1; }
    function capsule(x, y, w, h, col, o) { RRc(x, y, w, h, w / 2, col, o); }

    // seat
    if (s.seat === 'wheelchair') {
      var wr = 9.4, wy = T + 1.8;
      [-1, 1].forEach(function (d) {
        var wx = cx + d * (bw / 2 + 5.5);
        g.beginPath(); g.arc(wx, wy, wr, 0, 6.2832); g.lineWidth = 2.1; g.strokeStyle = '#3f4558'; g.stroke();
        g.beginPath(); g.arc(wx, wy, wr - 2.4, 0, 6.2832); g.lineWidth = 0.7; g.strokeStyle = '#c3c9db'; g.stroke();
        g.strokeStyle = '#9aa1b8'; g.lineWidth = 0.45;
        for (var k = 0; k < 8; k++) { var an = k * 0.7854 + t * 0.0; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(an) * (wr - 2.6), wy + Math.sin(an) * (wr - 2.6)); g.stroke(); }
        g.beginPath(); g.arc(wx, wy, 1.7, 0, 6.2832); g.fillStyle = '#e3e7f1'; g.fill();
        g.beginPath(); g.arc(wx, wy, 0.7, 0, 6.2832); g.fillStyle = '#6d7690'; g.fill();
      });
      RRc(cx - bw / 2 - 1.2, T - 19, bw + 2.4, 23, 4, '#66708d');
      glow(cx - bw / 2 + 2, T - 14, 1.6, 4, '#ffffff', 0.25);
      RRc(cx - bw / 2 - 2.6, T - 3, bw + 5.2, 6, 3, '#838cab');
      [-1, 1].forEach(function (d) {
        capsule(cx + d * (bw / 2 + 1.6) - 1.1, T - 21, 2.2, 6, '#3f4558');
        RRc(cx + d * (bw / 2 + 1.6) - 2, T - 8, 4, 2, 1, '#3f4558');
      });
    } else {
      var cc = a.chair || '#c9805f';
      RRc(cx - bw / 2 - 2.5, T - 14, bw + 5, 19, 5.5, cc);
      glow(cx - bw / 2 + 1, T - 10, 2.6, 1.1, '#ffffff', 0.4);
    }

    var sw = Math.round(Math.sin(t * 2)) * 0.8;
    // heads are drawn a touch smaller so everyone reads as grown up
    var HS = 0.86;
    g.save(); g.translate(cx, T - 10); g.scale(HS, HS); g.translate(-cx, -(T - 10));
    // hair behind the head and body
    switch (s.hair) {
      case 'bob': RRc(cx - 11.6, hy + 2, 23.2, 16, 8, hc); break;
      case 'long': case 'halfup': RRc(cx - 12, hy + 2, 24, 26, 9, hc); glow(cx + 4, hy + 14, 1.3, 7, hl, 0.5); break;
      case 'shag': RRc(cx - 12, hy + 2, 24, 19, 7, hc);
        [-9, -3, 3, 9].forEach(function (x, k) { Ec(cx + x, hy + 20 + (k % 2), 2.8, 2.4, hc); }); break;
      case 'wavy':
        paintShape(function () {
          g.moveTo(cx - 12, hy + 6);
          g.bezierCurveTo(cx - 14, hy + 14, cx - 10, hy + 18, cx - 13, hy + 28);
          g.bezierCurveTo(cx - 8, hy + 30, cx - 6, hy + 26, cx - 3, hy + 29);
          g.bezierCurveTo(cx, hy + 31, cx + 4, hy + 26, cx + 8, hy + 29);
          g.bezierCurveTo(cx + 13, hy + 30, cx + 10, hy + 18, cx + 13, hy + 14);
          g.bezierCurveTo(cx + 14, hy + 6, cx + 8, hy - 2, cx, hy - 2);
          g.bezierCurveTo(cx - 8, hy - 2, cx - 13, hy, cx - 12, hy + 6); g.closePath();
        }, hc); glow(cx + 6, hy + 15, 1.2, 7, hl, 0.45); break;
      case 'curly': group([circ(cx - 11, hcy - 1, 5), circ(cx + 11, hcy - 1, 5), circ(cx - 10, hcy + 6, 4.6), circ(cx + 10, hcy + 6, 4.6), circ(cx, hcy - 2, 12)], hc); break;
      case 'afro': group([circ(cx, hcy - 2, 14.5), circ(cx - 11, hcy + 4, 5), circ(cx + 11, hcy + 4, 5)], hc); break;
      case 'coily': group([circ(cx, hcy - 2, 12.5), circ(cx - 10, hcy + 3, 4.5), circ(cx + 10, hcy + 3, 4.5)], hc); break;
      case 'puffs': group([circ(cx - 12.5, hy + 1, 5.8)], hc); group([circ(cx + 12.5, hy + 1, 5.8)], hc); break;
      case 'locs': case 'locbun':
        for (i = 0; i < 8; i++) { var lx = cx - 11 + i * 3.1; capsule(lx - 1.3, hy + 3, 2.8, 17 - (i % 3) * 3, i % 2 ? hc : shade(hc, -0.1)); }
        break;
      case 'braids':
        for (i = 0; i < 8; i++) {
          var bx = cx - 11 + i * 3.1; capsule(bx - 1.3, hy + 3, 2.8, 20, hc);
          for (j = 1; j < 5; j++) { g.globalAlpha = 0.5; g.fillStyle = hd; g.fillRect(bx - 1.1, hy + 3 + j * 3.6, 2.4, 0.5); g.globalAlpha = 1; }
          Ec(bx, hy + 23.2, 1.2, 1.2, acc, { line: false });
        } break;
      case 'twists':
        for (i = 0; i < 8; i++) { var tx = cx - 11 + i * 3.1; capsule(tx - 1.3, hy + 3, 2.8, 14, hc);
          for (j = 0; j < 4; j++) { g.globalAlpha = 0.5; g.fillStyle = hd; g.fillRect(tx - 1, hy + 5 + j * 3, 2.1, 0.7); g.globalAlpha = 1; } }
        break;
      case 'ponytail':
        paintShape(function () { g.moveTo(cx + 9 + sw, hy + 5); g.bezierCurveTo(cx + 19 + sw, hy + 4, cx + 20 + sw, hy + 17, cx + 15 + sw, hy + 22); g.bezierCurveTo(cx + 15 + sw, hy + 16, cx + 12 + sw, hy + 13, cx + 9 + sw, hy + 12); g.closePath(); }, hc);
        Ec(cx + 10 + sw, hy + 7, 1.5, 2.2, acc, { line: false }); break;
      case 'lowbun': Ec(cx, hy + 18, 4.4, 4.2, hc); glow(cx - 1, hy + 16.8, 1.6, 0.9, hl, 0.5); break;
      case 'hijab': RRc(cx - 12.6, hy - 3, 25.2, 31, 12, hc); break;
      default: break;
    }

    g.restore();
    // torso, outfit, arms
    var x0 = cx - bw / 2, y0 = T - 10;
    function torso() { rrp(x0, y0, bw, 13, 5); }
    g.save();
    g.beginPath(); torso(); g.fillStyle = oc; g.fill();
    g.clip();
    glow(x0 + 2.5, y0 + 4, 2, 4.5, '#ffffff', 0.18);
    g.fillStyle = od; g.globalAlpha = 0.22; g.fillRect(x0, y0 + 9.5, bw, 4); g.globalAlpha = 1;
    switch (s.outfit) {
      case 'hoodie':
        g.fillStyle = od; g.fillRect(x0, y0 + 9, bw, 4);
        RRc(x0 + 3, y0 + 7.5, bw - 6, 4, 2, shade(oc, -0.1), { line: false });
        g.fillStyle = '#f5efe6'; g.fillRect(cx - 3, y0 + 3, 0.8, 4.5); g.fillRect(cx + 2.2, y0 + 3, 0.8, 4.5); break;
      case 'cardigan':
        g.fillStyle = '#f6efe3'; g.fillRect(cx - 3.2, y0, 6.4, 13);
        g.fillStyle = od; g.fillRect(cx - 3.4, y0, 0.7, 13); g.fillRect(cx + 2.7, y0, 0.7, 13);
        Ec(cx, y0 + 5, 0.7, 0.7, od, { line: false }); Ec(cx, y0 + 9, 0.7, 0.7, od, { line: false }); break;
      case 'stripes':
        g.fillStyle = '#f6efe3'; for (j = 2; j < 12; j += 3.4) g.fillRect(x0, y0 + j, bw, 1.5); break;
      case 'overalls':
        g.fillStyle = '#6f8fb5'; g.fillRect(x0 + 1.5, y0, 2.3, 6); g.fillRect(x0 + bw - 3.8, y0, 2.3, 6);
        RRc(cx - 5, y0 + 4.5, 10, 9, 2.5, '#6f8fb5', { line: false });
        Ec(x0 + 2.7, y0 + 5.5, 0.9, 0.9, '#e8d27a', { line: false }); Ec(x0 + bw - 2.7, y0 + 5.5, 0.9, 0.9, '#e8d27a', { line: false });
        RRc(cx - 2.3, y0 + 8, 4.6, 3, 1.2, shade('#6f8fb5', -0.15), { line: false }); break;
      default: break;
    }
    g.restore();
    g.beginPath(); torso(); g.lineWidth = 0.5; g.strokeStyle = ol(oc); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1;
    if (s.outfit === 'turtle') RRc(cx - 5.5, y0 - 2, 11, 4.5, 2.2, olt);
    else if (s.outfit === 'hoodie') paintShape(function () { rrp(cx - 8, y0 - 1.5, 16, 5, 2.5); }, od);
    else Ec(cx, y0 + 0.2, 3.3, 1.5, od, { line: false });

    var up = 0, raised = false, rraised = false;
    if (a.cheer > 0.01) { up = Math.sin(a.cheer * Math.PI) * 3; raised = true; rraised = true; }
    else if (a.wave > 0.01) rraised = true;
    function arm(side, up_, extra) {
      var ax = side < 0 ? x0 - 3 : x0 + bw;
      if (up_) {
        capsule(ax, y0 - 9 - extra, 3.4, 13, oc); Ec(ax + 1.7, y0 - 9.5 - extra, 2, 2, skin);
      } else {
        capsule(ax, y0 + 2.5, 3.4, 9, side < 0 ? oc : od); Ec(ax + 1.7, y0 + 11.2, 1.9, 1.9, skin);
      }
    }
    arm(-1, raised, up);
    var wvx = a.wave > 0.01 ? Math.sin(t * 14) * 0.9 : 0;
    if (rraised) { g.save(); g.translate(wvx, 0); arm(1, true, up); g.restore(); } else arm(1, false, 0);

    g.save(); g.translate(cx, T - 10); g.scale(HS, HS); g.translate(-cx, -(T - 10));
    // hair falling in front of the shoulders
    switch (s.hair) {
      case 'long': case 'halfup': capsule(cx - 12.2, hy + 11, 5, 17, hc); capsule(cx + 7.2, hy + 11, 5, 17, hc); break;
      case 'wavy': capsule(cx - 12.6, hy + 11, 5.4, 17, hc); capsule(cx + 7.2, hy + 11, 5.4, 17, hc); break;
      case 'locs': case 'locbun':
        for (j = 0; j < 2; j++) { capsule(cx - 12 + j * 2.8, hy + 10, 2.8, 14 - j * 3, hc); capsule(cx + 9.2 - j * 2.8, hy + 10, 2.8, 14 - j * 3, hc); } break;
      case 'braids':
        capsule(cx - 12, hy + 10, 2.8, 17, hc); capsule(cx + 9.2, hy + 10, 2.8, 17, hc);
        Ec(cx - 10.6, hy + 27.3, 1.2, 1.2, acc, { line: false }); Ec(cx + 10.6, hy + 27.3, 1.2, 1.2, acc, { line: false }); break;
      case 'twists': capsule(cx - 12, hy + 10, 2.8, 12, hc); capsule(cx + 9.2, hy + 10, 2.8, 12, hc); break;
      case 'sidebraid':
        for (j = 0; j < 5; j++) Ec(cx + 9.2 + (j % 2) * 0.7, hy + 11 + j * 3.4, 2.5, 2, hc);
        Ec(cx + 9.6, hy + 28.2, 1.6, 1.6, acc, { line: false }); break;
      case 'pigtails':
        Ec(cx - 12.5, hy + 15, 3.8, 7, hc); Ec(cx + 12.5, hy + 15, 3.8, 7, hc);
        Ec(cx - 12, hy + 9, 2.3, 1.6, acc, { line: false }); Ec(cx + 12, hy + 9, 2.3, 1.6, acc, { line: false }); break;
      case 'hijab': RRc(cx - 13, hy + 13, 26, 11, 5, hc); break;
      default: break;
    }

    // head
    Ec(cx - 10.6, hcy + 1.6, 1.7, 2.1, skin);  // ears
    Ec(cx + 10.6, hcy + 1.6, 1.7, 2.1, skin);
    g.save();
    g.beginPath(); ep(cx, hcy, 10.8, 9.6); g.fillStyle = skin; g.fill();
    g.clip();
    glow(cx - 3.5, hcy - 3.5, 6.5, 4, skinL, 0.5);
    g.fillStyle = skinD; g.globalAlpha = 0.25; g.fillRect(cx - 12, hcy + 7.2, 24, 4); g.globalAlpha = 1;
    g.restore();
    g.beginPath(); ep(cx, hcy, 10.8, 9.6); g.lineWidth = 0.5; g.strokeStyle = ol(skin); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1;

    // face: big shiny eyes, rosy cheeks, tiny mouth
    var ey = hcy + (a.look === 'up' ? 0.4 : 1.1), ex = 4.3;
    var rose = mix(skin, '#ff7f9a', 0.55), mouth = mix(skinD, '#b9505a', 0.6);
    glow(cx - 6.6, hcy + 4.2, 2.3, 1.4, rose, 0.7); glow(cx + 6.6, hcy + 4.2, 2.3, 1.4, rose, 0.7);
    if (a.blink) {
      g.strokeStyle = '#2a1f2a'; g.lineWidth = 0.8;
      [-1, 1].forEach(function (d) { g.beginPath(); g.arc(cx + d * ex, ey - 0.3, 1.5, 0.2, Math.PI - 0.2); g.stroke(); });
    } else {
      var iris = EYEC[s.eyes] || EYEC[0], irisD = shade(iris, -0.3), irisL = shade(iris, 0.4);
      [-1, 1].forEach(function (d) {
        var X = cx + d * ex;
        Ec(X, ey, 2.0, 2.7, '#fffaf2', { line: false });
        Ec(X, ey + 0.1, 1.75, 2.45, iris, { line: false });
        g.save(); g.beginPath(); ep(X, ey + 0.1, 1.75, 2.45); g.clip();
        g.fillStyle = irisD; g.fillRect(X - 3, ey - 2.6, 6, 1.6);
        glow(X, ey + 1.7, 1.5, 0.9, irisL, 0.8);
        g.restore();
        Ec(X, ey + 0.2, 0.85, 1.25, '#1f1620', { line: false });
        Ec(X - 0.7, ey - 1, 0.75, 0.8, '#ffffff', { line: false });
        Ec(X + 0.7, ey + 1.1, 0.34, 0.34, '#ffffff', { line: false });
        g.strokeStyle = '#2a1f2a'; g.lineWidth = 0.55; g.beginPath(); g.arc(X, ey + 0.1, 2.0, 3.55, 5.9); g.stroke();
      });
    }
    // tiny nose
    glow(cx, hcy + 3.1, 0.7, 0.45, shade(skin, -0.2), 0.8);
    g.strokeStyle = mouth; g.lineWidth = 0.7;
    g.beginPath();
    if (a.smile) { g.arc(cx, hcy + 3.9, 1.7, 0.15, Math.PI - 0.15); } else { g.arc(cx, hcy + 4.2, 1.1, 0.3, Math.PI - 0.3); }
    g.stroke();
    switch (s.detail) {
      case 'freckles':
        [[-6.5, 3], [-5, 4.2], [-7.4, 4.4], [6.5, 3], [5, 4.2], [7.4, 4.4]].forEach(function (p) { Ec(cx + p[0], hcy + p[1] - 0.6, 0.38, 0.38, shade(skin, -0.32), { line: false }); }); break;
      case 'blush': glow(cx - 6.6, hcy + 4.2, 3.2, 2.2, '#ff5f88', 0.5); glow(cx + 6.6, hcy + 4.2, 3.2, 2.2, '#ff5f88', 0.5); break;
      case 'vitiligo': {
        var pale = shade(skin, 0.5);
        glow(cx + 6.3, hcy - 3.2, 2.4, 1.8, pale, 0.9, 0.5); glow(cx - 6.5, hcy + 4, 1.8, 1.3, pale, 0.9); glow(cx + 9, hcy + 2.6, 1.2, 1.5, pale, 0.9);
        glow(x0 + bw + 1.7, y0 + 11.2, 1.7, 1.7, pale, 0.8); break; }
      case 'mole': Ec(cx + 7.2, hcy + 5, 0.55, 0.55, '#4a2e2a', { line: false }); break;
      default: break;
    }
    if (s.facial === 'stubble') {
      g.save(); g.beginPath(); ep(cx, hcy, 10.8, 9.6); g.clip();
      g.globalAlpha = 0.28; g.fillStyle = hc; g.beginPath(); ep(cx, hcy + 8.5, 9.6, 5.8); g.fill(); g.restore(); g.globalAlpha = 1;
    } else if (s.facial === 'mustache') {
      paintShape(function () { g.moveTo(cx - 4.6, hcy + 3.9); g.quadraticCurveTo(cx - 2, hcy + 2.4, cx, hcy + 3.5); g.quadraticCurveTo(cx + 2, hcy + 2.4, cx + 4.6, hcy + 3.9); g.quadraticCurveTo(cx + 2, hcy + 5, cx, hcy + 4.1); g.quadraticCurveTo(cx - 2, hcy + 5, cx - 4.6, hcy + 3.9); }, hc);
    } else if (s.facial === 'beard') {
      g.save(); g.beginPath(); ep(cx, hcy, 10.9, 9.7); g.clip();
      paintShape(function () { g.moveTo(cx - 12, hcy + 3); g.quadraticCurveTo(cx - 8, hcy + 7, cx - 3.4, hcy + 5.6); g.quadraticCurveTo(cx, hcy + 4.8, cx + 3.4, hcy + 5.6); g.quadraticCurveTo(cx + 8, hcy + 7, cx + 12, hcy + 3); g.lineTo(cx + 12, hcy + 14); g.lineTo(cx - 12, hcy + 14); g.closePath(); }, hc, { line: false });
      g.restore();
      g.strokeStyle = mouth; g.lineWidth = 0.7; g.beginPath(); g.arc(cx, hcy + 6.2, 1.1, 0.25, Math.PI - 0.25); g.stroke();
    }

    // ears sit under the hair
    if (s.hairAcc === 'ears') {
      [-1, 1].forEach(function (d) {
        paintShape(function () { g.moveTo(cx + d * 3, hy + 1.5); g.quadraticCurveTo(cx + d * 6, hy - 6.5, cx + d * 10.5, hy - 5.5); g.quadraticCurveTo(cx + d * 11.5, hy - 1, cx + d * 10.5, hy + 4); g.closePath(); }, hc);
        paintShape(function () { g.moveTo(cx + d * 5, hy + 0.5); g.quadraticCurveTo(cx + d * 7, hy - 3.5, cx + d * 9.3, hy - 3.2); g.quadraticCurveTo(cx + d * 9.7, hy - 1, cx + d * 9, hy + 1.8); g.closePath(); }, '#f2a0b0', { line: false });
      });
    } else if (s.hairAcc === 'bear') {
      [-1, 1].forEach(function (d) { Ec(cx + d * 8.5, hy - 1.2, 3.4, 3.2, hc); Ec(cx + d * 8.5, hy - 1, 1.7, 1.6, '#f2a0b0', { line: false }); });
    }

    // hair on top of the head
    function dome(col, lift, fr) {
      lift = lift || 0;
      paintShape(function () {
        g.moveTo(cx - 11.4, hcy + 1.5);
        g.bezierCurveTo(cx - 13, hy - 3.5 - lift, cx + 13, hy - 3.5 - lift, cx + 11.4, hcy + 1.5);
        g.lineTo(cx + 10, hcy - 2.2);
        if (fr === 'curtains') { g.quadraticCurveTo(cx + 4, hcy + 1.5, cx + 0.6, hy - 0.5); g.lineTo(cx - 0.6, hy - 0.5); g.quadraticCurveTo(cx - 4, hcy + 1.5, cx - 10, hcy - 2.2); }
        else if (fr === 'swoop') { g.quadraticCurveTo(cx + 3, hcy + 0.4, cx - 6, hcy + 1.6); g.quadraticCurveTo(cx - 9, hcy + 0.4, cx - 10, hcy - 2.2); }
        else if (fr === 'buzz') { g.quadraticCurveTo(cx, hy + 2.5, cx - 10, hcy - 2.2); }
        else { g.quadraticCurveTo(cx + 5, hcy - 0.6, cx + 1.5, hcy - 3.8); g.quadraticCurveTo(cx - 4, hcy - 0.2, cx - 10, hcy - 2.2); }
        g.closePath();
      }, col);
      if (fr !== 'buzz') { glow(cx - 3.8, hy + 1.8, 4.2, 1.1, hl, 0.45, -0.25); }
    }
    switch (s.hair) {
      case 'buzz': dome(hd, -1.5, 'buzz'); break;
      case 'bald': glow(cx - 3.4, hy + 2.2, 2.4, 1.1, '#ffffff', 0.5, -0.4); break;
      case 'pixie': dome(hc, 0, 'swoop'); break;
      case 'curtains': dome(hc, 0, 'curtains'); break;
      case 'fade': dome(hd, -1.5, 'buzz'); group([circ(cx - 5, hy - 1.5, 4.2), circ(cx, hy - 3, 4.8), circ(cx + 5, hy - 1.5, 4.2), circ(cx - 2.5, hy + 0.3, 3.6), circ(cx + 2.8, hy + 0.3, 3.6)], hc); break;
      case 'mohawk': dome(hd, -1.5, 'buzz'); paintShape(function () { g.moveTo(cx - 3.4, hy + 3.5); g.quadraticCurveTo(cx - 4.5, hy - 8, cx, hy - 9); g.quadraticCurveTo(cx + 4.5, hy - 8, cx + 3.4, hy + 3.5); g.closePath(); }, hc); glow(cx - 1, hy - 3, 0.9, 4.5, hl, 0.55); break;
      case 'highpuff': dome(hc); group([circ(cx, hy - 5.5, 6.2)], hc); RRc(cx - 5, hy - 1.2, 10, 1.8, 0.9, acc, { line: false }); break;
      case 'shag': dome(hc); capsule(cx - 11.6, hcy - 2, 3, 8, hc); capsule(cx + 8.6, hcy - 2, 3, 8, hc); break;
      case 'halfup': dome(hc); group([circ(cx, hy - 3.8, 4.4)], hc); RRc(cx - 3.8, hy - 0.4, 7.6, 1.6, 0.8, acc, { line: false }); break;
      case 'sidebraid': case 'lowbun': case 'short': case 'ponytail': case 'pigtails': dome(hc); break;
      case 'bob': case 'long': case 'wavy': dome(hc); break;
      case 'locbun': dome(hc, 1); group([circ(cx, hy - 5, 4.6)], hc); RRc(cx - 4.5, hy - 1.4, 9, 1.8, 0.9, acc, { line: false }); break;
      case 'spacebuns': dome(hc); group([circ(cx - 8.2, hy - 3.8, 4.2)], hc); group([circ(cx + 8.2, hy - 3.8, 4.2)], hc);
        RRc(cx - 11, hy - 0.6, 5.5, 1.5, 0.75, acc, { line: false }); RRc(cx + 5.5, hy - 0.6, 5.5, 1.5, 0.75, acc, { line: false }); break;
      case 'bun': dome(hc); group([circ(cx, hy - 5.2, 5.2)], hc); glow(cx - 1.4, hy - 6.4, 1.8, 1, hl, 0.5); RRc(cx - 6, hy - 1.2, 12, 1.5, 0.75, acc, { line: false }); break;
      case 'topknot': dome(hc); group([circ(cx, hy - 5, 3.4)], hc); RRc(cx - 3.5, hy - 1.4, 7, 1.6, 0.8, acc, { line: false }); break;
      case 'curly':
        group([circ(cx - 8.5, hy - 0.5, 4.4), circ(cx - 3, hy - 3, 4.8), circ(cx + 3.5, hy - 3, 4.8), circ(cx + 9, hy - 0.5, 4.4), circ(cx - 9.6, hy + 4.5, 3.4), circ(cx + 9.8, hy + 4.5, 3.4), circ(cx, hy, 7)], hc);
        group([circ(cx - 6, hcy - 3.6, 2.6), circ(cx - 1.5, hcy - 4.4, 2.6), circ(cx + 3.5, hcy - 3.8, 2.6), circ(cx + 7.4, hcy - 2.8, 2.4)], hc); break;
      case 'afro': case 'coily':
        group([circ(cx - 8, hy - 0.5, 5), circ(cx, hy - 3, 6), circ(cx + 8, hy - 0.5, 5), circ(cx - 10, hy + 5, 3.4), circ(cx + 10, hy + 5, 3.4), circ(cx, hy + 1, 8)], hc); glow(cx - 4, hy - 3.5, 2.8, 1.2, hl, 0.45, -0.3); break;
      case 'puffs': dome(hc); RRc(cx - 11, hy + 1, 4, 1.6, 0.8, acc, { line: false }); RRc(cx + 7, hy + 1, 4, 1.6, 0.8, acc, { line: false }); break;
      case 'locs': case 'twists':
        group([circ(cx - 8, hy, 4.2), circ(cx - 3, hy - 2.4, 4.4), circ(cx + 3, hy - 2.4, 4.4), circ(cx + 8, hy, 4.2), circ(cx, hy + 1, 7), circ(cx - 10, hy + 4.5, 3), circ(cx + 10, hy + 4.5, 3)], hc); break;
      case 'braids': dome(hc); g.strokeStyle = hd; g.lineWidth = 0.5; g.globalAlpha = 0.6; [-6, -2, 2, 6].forEach(function (x) { g.beginPath(); g.moveTo(cx + x, hy - 1); g.lineTo(cx + x * 1.4, hy + 5); g.stroke(); }); g.globalAlpha = 1; break;
      case 'cornrows': dome(hc); g.strokeStyle = hd; g.lineWidth = 0.55; g.globalAlpha = 0.7; [-7, -3.5, 0, 3.5, 7].forEach(function (x) { g.beginPath(); g.moveTo(cx + x * 0.8, hy - 2.4); g.quadraticCurveTo(cx + x * 1.3, hy + 1, cx + x * 1.4, hy + 5); g.stroke(); }); g.globalAlpha = 1; break;
      case 'bantu': dome(hc);
        for (i = 0; i < 5; i++) group([circ(cx - 8 + i * 4, hy - 2.6 + Math.abs(i - 2) * 1.2, 2.5)], hc);
        group([circ(cx - 12, hy + 4, 2.4)], hc); group([circ(cx + 12, hy + 4, 2.4)], hc); break;
      case 'headwrap':
        dome(hc, 0.5); RRc(cx - 11.2, hy + 1.6, 22.4, 3.4, 1.7, acc);
        for (i = 0; i < 6; i++) { g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; g.fillRect(cx - 9 + i * 3.6, hy + 2, 1, 2.6); g.globalAlpha = 1; }
        group([circ(cx + 10, hy - 1.5, 3)], acc); break;
      case 'hijab':
        g.save(); g.beginPath(); rrp(cx - 12.6, hy - 3, 25.2, 24, 11); ep(cx, hcy + 1.2, 8.8, 8.2); g.fillStyle = hc; g.fill('evenodd');
        g.lineWidth = 0.5; g.strokeStyle = ol(hc); g.globalAlpha = 0.5; g.stroke(); g.restore(); g.globalAlpha = 1;
        glow(cx - 4, hy, 5, 1.4, hl, 0.4, -0.2); break;
      default: break;
    }

    // glasses
    if (s.glasses === 'round' || s.glasses === 'square' || s.glasses === 'cat') {
      var gc = s.glasses === 'round' ? '#c9a24a' : (s.glasses === 'square' ? '#6a4f8e' : '#c76a8a'), gy = ey;
      g.strokeStyle = gc; g.lineWidth = 0.8;
      [-1, 1].forEach(function (d) {
        g.beginPath();
        if (s.glasses === 'round') g.arc(cx + d * ex, gy, 3.1, 0, 6.2832);
        else if (s.glasses === 'square') rrp(cx + d * ex - 3.2, gy - 2.8, 6.4, 5.6, 1.4);
        else { g.moveTo(cx + d * (ex - 3.2), gy - 1.5); g.quadraticCurveTo(cx + d * (ex + 0.5), gy - 3.8, cx + d * (ex + 3.4), gy - 2.4); g.quadraticCurveTo(cx + d * (ex + 3.4), gy + 2.8, cx + d * ex, gy + 2.8); g.quadraticCurveTo(cx + d * (ex - 3.4), gy + 2.6, cx + d * (ex - 3.2), gy - 1.5); }
        g.stroke(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill();
      });
      g.beginPath(); g.moveTo(cx - 1.3, gy); g.lineTo(cx + 1.3, gy); g.stroke();
    }

    if (s.hairAcc === 'bow') {
      [-1, 1].forEach(function (d) { paintShape(function () { g.moveTo(cx + 7, hy + 0.2); g.quadraticCurveTo(cx + 7 + d * 4.6, hy - 3.6, cx + 7 + d * 4.4, hy + 3); g.closePath(); }, '#f08aa8'); });
      Ec(cx + 7, hy + 0.2, 1.1, 1.1, '#c95a7e', { line: false });
    } else if (s.hairAcc === 'flower') {
      for (i = 0; i < 5; i++) { var an = i * 1.2566; Ec(cx + 7.6 + Math.cos(an) * 1.7, hy + 1 + Math.sin(an) * 1.7, 1.3, 1.3, '#ffd0e0'); }
      Ec(cx + 7.6, hy + 1, 1, 1, '#f5c443', { line: false });
    }
    if (s.hearing) { [-1, 1].forEach(function (d) { g.strokeStyle = '#d9b79b'; g.lineWidth = 1; g.beginPath(); g.arc(cx + d * 11, hcy + 0.5, 2.6, d < 0 ? 1.7 : -1.5, d < 0 ? 4.6 : 1.5, d > 0 ? false : false); g.stroke(); }); }
    if (s.headphones) {
      g.strokeStyle = '#46405a'; g.lineWidth = 1.7; g.beginPath(); g.arc(cx, hcy - 0.5, 11.6, Math.PI * 1.04, Math.PI * 1.96); g.stroke();
      [-1, 1].forEach(function (d) { RRc(cx + d * 11.6 - 2.1, hcy - 2.6, 4.2, 7.4, 2.1, acc); glow(cx + d * 11.6 - 0.6, hcy - 1, 0.8, 1.6, '#ffffff', 0.45); });
    }
    g.restore();
    return cv;
  }

  function sprite(s, a) {
    a = a || {};
    var sway = Math.round(Math.sin((a.t || 0) * 2));
    var wv = a.wave > 0.01 ? Math.round(Math.sin((a.t || 0) * 14)) : 0;
    var key = JSON.stringify([s, !!a.bob, !!a.blink, a.look === 'up', !!a.smile, Math.round((a.cheer || 0) * 8), a.wave > 0.01, a.chair, a.accent, sway, wv, a.S || 3]);
    var hit = cache[key];
    if (hit) return hit;
    if (cacheN > 300) { cache = {}; cacheN = 0; }
    var cv = paint(s, { t: a.t, bob: a.bob, blink: a.blink, look: a.look, smile: a.smile, cheer: Math.round((a.cheer || 0) * 8) / 8, wave: a.wave, chair: a.chair, accent: a.accent, S: a.S });
    cache[key] = cv; cacheN++;
    return cv;
  }

  // the sprite is placed so its pelvis sits at (cx, T)
  function drawPerson(s, cx, T, a) {
    var g = C.ctx();
    var img = sprite(s, a), was = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, Math.round(cx - AX), Math.round(T - AT), SW, SH);
    g.imageSmoothingEnabled = was;
  }

  // back of a laptop lid, seen from across the table
  function drawLaptop(cx, y, col, glow) {
    col = col || '#e9e4da';
    R(cx - 8, y - 10, 16, 10, col);
    R(cx - 8, y - 10, 16, 1, shade(col, 0.4));
    R(cx - 8, y - 1, 16, 1, shade(col, -0.18));
    R(cx + 7, y - 10, 1, 10, shade(col, -0.1));
    R(cx - 1, y - 6, 3, 3, glow || '#f4a6b8');
    R(cx - 9, y, 18, 2, shade(col, -0.12));
    R(cx - 9, y + 2, 18, 1, shade(col, -0.3));
  }

  // painted portrait: soft washes, a smooth upscale of the character, bleed and paper grain
  function drawPreview(canvas, spec, t) {
    var c = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var sc = (h * 1.4) / SH;
    var sp = sprite(cleanSpec(spec), { t: t || 0, smile: true, chair: '#c9805f', S: Math.max(3, Math.min(10, Math.ceil(sc))) });
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, w, h);
    // flat, calm backdrop: dusty wall, a cream arched window, a wood table
    c.fillStyle = '#e3c4a0'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#c4806a'; c.fillRect(0, h * 0.66, w, h * 0.34);
    c.fillStyle = '#efe0c8'; c.beginPath(); c.moveTo(w * 0.2, h * 0.66); c.lineTo(w * 0.2, h * 0.3); c.arc(w * 0.5, h * 0.3, w * 0.3, Math.PI, 0); c.lineTo(w * 0.8, h * 0.66); c.closePath(); c.fill();
    c.fillStyle = '#b9d0d6'; c.beginPath(); c.moveTo(w * 0.24, h * 0.66); c.lineTo(w * 0.24, h * 0.3); c.arc(w * 0.5, h * 0.3, w * 0.26, Math.PI, 0); c.lineTo(w * 0.76, h * 0.66); c.closePath(); c.fill();
    c.fillStyle = '#a9c0a0'; c.beginPath(); c.moveTo(w * 0.24, h * 0.66); c.quadraticCurveTo(w * 0.4, h * 0.5, w * 0.58, h * 0.58); c.quadraticCurveTo(w * 0.7, h * 0.52, w * 0.76, h * 0.6); c.lineTo(w * 0.76, h * 0.66); c.closePath(); c.fill();
    c.fillStyle = '#c99568'; c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.62, h * 0.16, 0, 0, 6.283); c.fill();
    var dw = SW * sc, dh = SH * sc;
    var dx = (w - dw) / 2, dy = h * 0.98 - AT * sc;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(sp, dx, dy, dw, dh);
    // laptop as a soft rounded shape
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.9;
    var lc = LAPTOPC[cleanSpec(spec).laptop] || LAPTOPC[0]; c.fillStyle = lc; c.beginPath();
    if (c.roundRect) c.roundRect(w / 2 - w * 0.15, h * 0.86, w * 0.3, h * 0.12, 10); else c.rect(w / 2 - w * 0.15, h * 0.86, w * 0.3, h * 0.12);
    c.fill();
    c.fillStyle = shade(lc, -0.25); c.globalAlpha = 0.9; c.beginPath(); c.arc(w / 2, h * 0.92, w * 0.02, 0, 6.283); c.fill();
    c.globalAlpha = 1; c.lineWidth = Math.max(6, w * 0.035); c.strokeStyle = '#8a5a3c'; c.strokeRect(0, 0, w, h); c.lineWidth = 2; c.strokeStyle = '#b98a62'; c.strokeRect(c.lineWidth + w * 0.03, c.lineWidth + w * 0.03, w - 2 * (w * 0.03 + 2), h - 2 * (w * 0.03 + 2));
    c.globalCompositeOperation = 'source-over';
  }

  /* ---------- the cafe regulars (everyone made to look different) ---------- */
  function npc(o) {
    var s = defaultSpec();
    for (var k in o) s[k] = o[k];
    return s;
  }
  var ROSTER = {
    back: [
      npc({ name: 'Mina', skin: 0, hair: 'long', hairColor: 6, body: 1, outfit: 'cardigan', outfitColor: 3, glasses: 'round', detail: 'freckles', eyes: 4, laptop: 2 }),
      null,
      npc({ name: 'Noor', skin: 4, hair: 'hijab', hairColor: 2, body: 1, outfit: 'turtle', outfitColor: 4, eyes: 1, laptop: 5 })
    ],
    fl: [
      npc({ name: 'Theo', skin: 3, hair: 'locs', hairColor: 1, body: 2, outfit: 'stripes', outfitColor: 3, facial: 'beard', glasses: 'square', eyes: 0, laptop: 6 }),
      npc({ name: 'Ivy', skin: 2, hair: 'wavy', hairColor: 4, body: 1, outfit: 'overalls', outfitColor: 1, detail: 'freckles', hairAcc: 'flower', eyes: 3, laptop: 1 }),
      npc({ name: 'Jo', skin: 6, hair: 'twists', hairColor: 0, body: 1, outfit: 'hoodie', outfitColor: 7, seat: 'wheelchair', hearing: true, eyes: 1, laptop: 3 })
    ],
    fr: []
  };

  Cafe.People = {
    Options: Options, defaultSpec: defaultSpec, randomSpec: randomSpec, cleanSpec: cleanSpec,
    drawPerson: drawPerson, drawLaptop: drawLaptop, drawPreview: drawPreview, roster: ROSTER, SW: SW, SH: SH, AX: AX, AT: AT
  };
})();
