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

  var SW = 52, SH = 56, AX = 26, AT = 44;

  var Options = {
    skin: SKIN, hairColors: HAIRC, hairColorNames: HAIRC_NAMES, outfitColors: OUTC,
    hairStyles: HAIR_STYLES, bodies: BODIES, outfits: OUTFITS, glasses: GLASSES,
    facial: FACIAL, details: DETAILS, hairAcc: HAIRACC, seats: SEATS
  };

  function defaultSpec() {
    return {
      name: 'You', skin: 4, hair: 'curly', hairColor: 1, body: 1, outfit: 'hoodie', outfitColor: 0,
      glasses: 'none', facial: 'none', detail: 'none', hairAcc: 'none', headphones: false, hearing: false, seat: 'chair'
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
          out[i] = d[j] * 0.42 + 16; out[i + 1] = d[j + 1] * 0.36 + 8; out[i + 2] = d[j + 2] * 0.42 + 18; out[i + 3] = 255;
          break;
        }
      }
    }
    im.data.set(out);
    g.putImageData(im, 0, 0);
  }

  function paint(s, a) {
    var cv = C.makeCanvas(SW, SH), g = cv.getContext('2d');
    var prev = C.ctx();
    C.setCtx(g);
    var cx = AX, T = AT, t = a.t || 0;
    var bw = (BODIES[s.body] || BODIES[1]).w;
    var bob = a.bob ? 1 : 0;
    var hx = cx - 9, hy = T - 23 + bob;
    var skin = SKIN[s.skin] || SKIN[2], skinD = shade(skin, -0.14);
    var hc = HAIRC[s.hairColor] || HAIRC[0], hd = shade(hc, -0.25), hl = shade(hc, 0.22);
    var oc = OUTC[s.outfitColor] || OUTC[0], od = shade(oc, -0.18), ol = shade(oc, 0.2);
    var acc = a.accent || OUTC[(s.outfitColor + 3) % OUTC.length];
    var HR = function (dx, dy, w, h, c) { R(hx + dx, hy + dy, w, h, c); };
    var i, j;

    // seat
    if (s.seat === 'wheelchair') {
      ring(cx - bw / 2 - 5, T + 3, 9, 2, '#3d4256', T + 12);
      ring(cx + bw / 2 + 5, T + 3, 9, 2, '#3d4256', T + 12);
      P(cx - bw / 2 - 5, T + 3, '#9aa1b8'); P(cx + bw / 2 + 5, T + 3, '#9aa1b8');
      RR(cx - bw / 2 - 1, T - 14, bw + 2, 18, 2, '#59627a');
      R(cx - bw / 2 - 3, T - 15, 3, 3, '#3d4256'); R(cx + bw / 2, T - 15, 3, 3, '#3d4256');
    } else {
      var cc = a.chair || '#c9805f';
      RR(cx - bw / 2 - 2, T - 13, bw + 4, 17, 4, cc);
      R(cx - bw / 2, T - 12, bw, 1, shade(cc, 0.28));
      R(cx + bw / 2 + 1, T - 9, 1, 12, shade(cc, -0.2));
    }

    // hair that sits behind the head
    var sw = Math.round(Math.sin(t * 2));
    switch (s.hair) {
      case 'bob': RR(hx - 2, hy + 1, 22, 16, 5, hc); HR(-2, 8, 1, 8, hd); HR(19, 8, 1, 8, hd); break;
      case 'long': case 'halfup': RR(hx - 3, hy, 24, 27, 6, hc); HR(-3, 9, 1, 17, hd); HR(20, 9, 1, 17, hd); HR(8, 14, 1, 10, hl); break;
      case 'wavy':
        for (j = 0; j < 26; j++) { var off = (j % 6 < 3) ? 0 : 1; HR(-3 - off, 1 + j, 24 + off * 2, 1, (j % 6 === 1) ? hl : hc); }
        RR(hx - 2, hy, 22, 10, 5, hc); break;
      case 'curly': TXD(cx, hy + 6, 12, hc, hd); break;
      case 'afro': TXD(cx, hy + 5, 14, hc, hd); break;
      case 'coily': TXD(cx, hy + 6, 11, hc, hd); break;
      case 'puffs': TXD(hx - 3, hy - 1, 6, hc, hd); TXD(hx + 20, hy - 1, 6, hc, hd); break;
      case 'locs': case 'locbun': for (i = 0; i < 8; i++) { var lx = hx - 3 + i * 3; for (j = 0; j < 20 - (i % 3) * 3; j++) HR(lx - hx, 2 + j, 3, 1, (j % 4 === 0) ? hd : hc); } break;
      case 'braids': for (i = 0; i < 8; i++) { var bx = hx - 3 + i * 3; for (j = 0; j < 22; j++) HR(bx - hx, 2 + j, 3, 1, (j % 3 === 0) ? hd : hc); HR(bx - hx, 23, 3, 1, acc); } break;
      case 'twists': for (i = 0; i < 8; i++) { var tx = hx - 3 + i * 3; for (j = 0; j < 16; j++) { HR(tx - hx + (j % 2), 2 + j, 2, 1, (j % 2) ? hc : hd); } } break;
      case 'ponytail': RR(hx + 15 + sw, hy + 3, 6, 18, 3, hc); HR(15 + sw, 6, 6, 1, hd); HR(15, 3, 5, 2, acc); break;
      case 'shag': RR(hx - 3, hy + 1, 24, 19, 5, hc); HR(-3, 17, 3, 3, hd); HR(18, 17, 3, 3, hd); HR(4, 17, 2, 2, hd); HR(13, 17, 2, 2, hd); break;
      case 'lowbun': D(cx, hy + 16, 4, hc); R(cx - 2, hy + 14, 4, 1, hl); break;
      case 'hijab': RR(hx - 3, hy - 3, 24, 30, 9, hc); HR(-3, 8, 1, 17, hd); HR(20, 8, 1, 17, hd); break;
      default: break;
    }

    // torso and arms
    var x0 = cx - bw / 2, y0 = T - 10;
    RR(x0, y0, bw, 12, 3, oc);
    R(x0 + bw - 2, y0 + 3, 1, 8, od); R(x0 + 2, y0 + 11, bw - 4, 1, od);
    switch (s.outfit) {
      case 'hoodie':
        RR(cx - 8, y0 - 1, 16, 5, 2, od); R(cx - 3, y0 + 4, 1, 4, '#f5efe6'); R(cx + 2, y0 + 4, 1, 4, '#f5efe6');
        R(x0 + 3, y0 + 8, bw - 6, 1, od); break;
      case 'cardigan':
        R(cx - 3, y0, 6, 12, '#f6efe3'); R(cx - 3, y0, 1, 12, od); R(cx + 2, y0, 1, 12, od);
        P(cx, y0 + 4, od); P(cx, y0 + 8, od); break;
      case 'stripes':
        for (j = 2; j < 11; j += 3) R(x0, y0 + j, bw, 1, '#f6efe3'); break;
      case 'overalls':
        R(x0 + 2, y0, 2, 5, '#6f8fb5'); R(x0 + bw - 4, y0, 2, 5, '#6f8fb5');
        R(cx - 4, y0 + 4, 8, 8, '#6f8fb5'); R(cx - 4, y0 + 4, 8, 1, shade('#6f8fb5', 0.2));
        P(x0 + 2, y0 + 5, '#e8d27a'); P(x0 + bw - 3, y0 + 5, '#e8d27a'); R(cx - 2, y0 + 7, 4, 2, shade('#6f8fb5', -0.15)); break;
      case 'turtle':
        R(cx - 5, y0 - 1, 10, 3, ol); R(cx - 5, y0 + 1, 10, 1, od); break;
      default:
        R(cx - 3, y0, 6, 1, od); break;
    }
    var up = 0, raised = false, rraised = false;
    if (a.cheer > 0.01) { up = Math.round(Math.sin(a.cheer * Math.PI) * 3); raised = true; rraised = true; }
    else if (a.wave > 0.01) rraised = true;
    if (raised) {
      R(x0 - 3, y0 - 8 - up, 3, 12, oc); RR(x0 - 3, y0 - 11 - up, 3, 3, 1, skin);
    } else {
      R(x0 - 2, y0 + 3, 3, 8, oc); R(x0 - 2, y0 + 3, 1, 8, ol); R(x0 - 2, y0 + 10, 3, 2, skin);
    }
    if (rraised) {
      var wv = a.wave > 0.01 ? Math.round(Math.sin(t * 14)) : 0;
      R(x0 + bw, y0 - 8 - up, 3, 12, oc); RR(x0 + bw + wv, y0 - 11 - up, 3, 3, 1, skin);
    } else {
      R(x0 + bw - 1, y0 + 3, 3, 8, od); R(x0 + bw - 1, y0 + 10, 3, 2, skin);
    }

    // hair that falls in front of the shoulders
    switch (s.hair) {
      case 'long': case 'halfup': RR(hx - 3, hy + 10, 5, 17, 2, hc); RR(hx + 16, hy + 10, 5, 17, 2, hc); break;
      case 'wavy': for (j = 0; j < 16; j++) { var o = (j % 6 < 3) ? 0 : 1; HR(-3 - o, 10 + j, 5, 1, hc); HR(16 + o, 10 + j, 5, 1, hc); } break;
      case 'locs': case 'locbun': for (j = 0; j < 14; j++) { HR(-3, 9 + j, 3, 1, (j % 4 === 0) ? hd : hc); HR(18, 9 + j, 3, 1, (j % 4 === 0) ? hd : hc); } break;
      case 'braids': for (j = 0; j < 15; j++) { HR(-3, 9 + j, 3, 1, (j % 3 === 0) ? hd : hc); HR(18, 9 + j, 3, 1, (j % 3 === 0) ? hd : hc); } HR(-3, 24, 3, 1, acc); HR(18, 24, 3, 1, acc); break;
      case 'twists': for (j = 0; j < 11; j++) { HR(-3 + (j % 2), 9 + j, 2, 1, hc); HR(18 + (j % 2), 9 + j, 2, 1, hc); } break;
      case 'sidebraid': for (j = 0; j < 18; j++) HR(15 + (j % 2), 9 + j, 4, 1, (j % 3) ? hc : hd); HR(15, 27, 4, 2, acc); break;
      case 'pigtails': RR(hx - 6, hy + 9, 6, 13, 3, hc); RR(hx + 18, hy + 9, 6, 13, 3, hc); HR(-6, 9, 6, 2, acc); HR(18, 9, 6, 2, acc); break;
      case 'hijab': RR(hx - 4, hy + 13, 26, 11, 4, hc); HR(-4, 13, 26, 1, hd); HR(-4, 23, 26, 1, hd); break;
      default: break;
    }

    // head
    RR(hx, hy, 18, 15, 5, skin);
    R(hx + 4, hy + 14, 10, 1, skinD);
    HR(-1, 8, 1, 3, skin); HR(18, 8, 1, 3, skin);

    // face
    var ey = hy + (a.look === 'up' ? 7 : 8);
    if (a.blink) { R(hx + 4, ey + 1, 3, 1, '#2a1f2a'); R(hx + 11, ey + 1, 3, 1, '#2a1f2a'); }
    else {
      R(hx + 4, ey, 2, 3, '#2a1f2a'); R(hx + 12, ey, 2, 3, '#2a1f2a');
      P(hx + 4, ey, '#ffffff'); P(hx + 12, ey, '#ffffff');
    }
    var rose = mix(skin, '#ff7f9a', 0.5), mouth = mix(skinD, '#b9505a', 0.6);
    R(hx + 2, hy + 11, 3, 2, rose); R(hx + 13, hy + 11, 3, 2, rose);
    R(hx + 8, hy + 12, 2, 1, mouth);
    if (a.smile) { P(hx + 7, hy + 11, mouth); P(hx + 10, hy + 11, mouth); }
    switch (s.detail) {
      case 'freckles':
        [[3, 10], [5, 11], [4, 12], [13, 10], [15, 11], [12, 12]].forEach(function (p) { P(hx + p[0], hy + p[1], shade(skin, -0.28)); }); break;
      case 'blush': R(hx + 1, hy + 10, 4, 3, mix(skin, '#ff6f93', 0.6)); R(hx + 13, hy + 10, 4, 3, mix(skin, '#ff6f93', 0.6)); break;
      case 'vitiligo':
        var pale = shade(skin, 0.55);
        R(hx + 11, hy + 5, 4, 3, pale); R(hx + 2, hy + 11, 3, 2, pale); R(hx + 15, hy + 9, 2, 3, pale); R(x0 - 2, y0 + 10, 3, 2, pale); break;
      case 'mole': P(hx + 14, hy + 12, '#4a2e2a'); break;
      default: break;
    }
    if (s.facial === 'stubble') { R(hx + 2, hy + 10, 14, 5, mix(skin, hc, 0.3)); R(hx + 8, hy + 12, 2, 1, mouth); }
    else if (s.facial === 'mustache') { R(hx + 5, hy + 10, 8, 2, hc); }
    else if (s.facial === 'beard') { RR(hx, hy + 9, 18, 7, 3, hc); R(hx + 6, hy + 9, 6, 1, hd); R(hx + 8, hy + 12, 2, 1, mouth); }

    // cat or bear ears sit under the hair
    if (s.hairAcc === 'ears') {
      [[hx + 1, 1], [hx + 11, -1]].forEach(function (e) {
        var ex = e[0];
        R(ex + 2, hy - 8, 1, 1, hc); R(ex + 1, hy - 7, 3, 1, hc); R(ex, hy - 6, 5, 1, hc); R(ex, hy - 5, 6, 3, hc);
        P(ex + 2, hy - 6, '#f2a0b0'); R(ex + 2, hy - 5, 2, 2, '#f2a0b0');
      });
    } else if (s.hairAcc === 'bear') {
      D(hx + 2, hy - 1, 3, hc); D(hx + 15, hy - 1, 3, hc); D(hx + 2, hy - 1, 1, '#f2a0b0'); D(hx + 15, hy - 1, 1, '#f2a0b0');
    }

    // hair on top of the head
    function cap() {
      RR(hx - 1, hy - 2, 20, 10, 4, hc);
      HR(-1, 5, 3, 5, hc); HR(16, 5, 3, 5, hc);
      HR(4, -1, 6, 1, hl);
    }
    function fringe() { HR(2, 7, 6, 1, hc); HR(3, 8, 2, 1, hc); HR(11, 7, 5, 1, hc); HR(12, 8, 2, 1, hc); }
    switch (s.hair) {
      case 'buzz': RR(hx, hy - 1, 18, 7, 3, hd); HR(0, 5, 2, 3, hd); HR(16, 5, 2, 3, hd); break;
      case 'pixie': cap(); fringe(); HR(1, 7, 13, 1, hc); HR(2, 8, 6, 1, hc); HR(0, 9, 2, 2, hc); break;
      case 'curtains': cap(); HR(1, 7, 7, 3, hc); HR(10, 7, 7, 3, hc); HR(8, -1, 1, 7, hd); break;
      case 'fade': RR(hx, hy - 1, 18, 7, 3, hd); HR(0, 5, 2, 3, hd); HR(16, 5, 2, 3, hd); TX(hx + 1, hy - 5, 16, 6, hc, hd); break;
      case 'mohawk': RR(hx, hy - 1, 18, 6, 3, hd); HR(0, 5, 2, 2, hd); HR(16, 5, 2, 2, hd); HR(6, -6, 6, 10, hc); HR(7, -7, 4, 1, hl); HR(8, -5, 1, 8, hd); break;
      case 'highpuff': RR(hx - 1, hy - 2, 20, 8, 4, hc); HR(-1, 5, 3, 4, hc); HR(16, 5, 3, 4, hc); TXD(cx, hy - 5, 8, hc, hd); HR(4, 0, 10, 1, acc); break;
      case 'shag': cap(); fringe(); HR(-2, 9, 3, 6, hc); HR(17, 9, 3, 6, hc); HR(3, 7, 2, 2, hc); HR(13, 7, 2, 2, hc); break;
      case 'halfup': cap(); fringe(); D(cx, hy - 5, 4, hc); R(cx - 2, hy - 8, 3, 1, hl); HR(5, -2, 8, 1, acc); HR(-1, 9, 2, 5, hc); HR(17, 9, 2, 5, hc); break;
      case 'sidebraid': cap(); fringe(); break;
      case 'locbun': TX(hx - 1, hy - 3, 20, 9, hc, hd); HR(-1, 5, 3, 4, hc); HR(16, 5, 3, 4, hc); D(cx, hy - 6, 4, hc); P(cx, hy - 6, hd); HR(5, -2, 8, 1, acc); break;
      case 'spacebuns': cap(); fringe(); D(hx + 3, hy - 5, 4, hc); D(hx + 15, hy - 5, 4, hc); HR(0, -1, 7, 1, acc); HR(12, -1, 7, 1, acc); break;
      case 'lowbun': cap(); fringe(); break;
      case 'bald': HR(5, 1, 3, 1, mix(skin, '#ffffff', 0.45)); break;
      case 'short': cap(); fringe(); break;
      case 'bob': case 'long': cap(); fringe(); HR(-1, 9, 2, 5, hc); HR(17, 9, 2, 5, hc); break;
      case 'wavy': cap(); fringe(); HR(-1, 9, 2, 3, hc); HR(17, 9, 2, 3, hc); break;
      case 'curly': TX(hx - 2, hy - 4, 22, 9, hc, hd); HR(-2, 4, 4, 5, hc); HR(16, 4, 4, 5, hc); fringe(); break;
      case 'afro': TX(hx - 1, hy - 3, 20, 8, hc, hd); HR(-1, 4, 3, 4, hc); HR(16, 4, 3, 4, hc); break;
      case 'coily': TX(hx - 1, hy - 3, 20, 8, hc, hd); HR(-1, 4, 3, 4, hc); HR(16, 4, 3, 4, hc); break;
      case 'puffs': cap(); fringe(); HR(1, -2, 16, 1, acc); break;
      case 'locs': TX(hx - 1, hy - 3, 20, 9, hc, hd); HR(-1, 5, 3, 4, hc); HR(16, 5, 3, 4, hc); break;
      case 'braids': cap(); HR(3, -2, 1, 8, hd); HR(7, -2, 1, 8, hd); HR(11, -2, 1, 8, hd); HR(15, -2, 1, 8, hd); fringe(); break;
      case 'twists': TX(hx - 1, hy - 3, 20, 9, hc, hd); HR(-1, 5, 3, 4, hc); HR(16, 5, 3, 4, hc); break;
      case 'cornrows': cap(); for (i = 2; i < 17; i += 3) HR(i, -2, 1, 8, hd); break;
      case 'bantu':
        cap();
        for (i = 0; i < 4; i++) { var kx = hx + 1 + i * 5; D(kx + 1, hy - 3 + (i % 2), 2, hc); P(kx + 1, hy - 3 + (i % 2), hd); }
        D(hx - 2, hy + 4, 2, hc); D(hx + 19, hy + 4, 2, hc); break;
      case 'bun': cap(); fringe(); D(cx, hy - 5, 5, hc); R(cx - 2, hy - 8, 3, 1, hl); HR(1, -2, 16, 1, acc); break;
      case 'topknot': cap(); fringe(); D(cx, hy - 5, 3, hc); R(cx - 1, hy - 7, 2, 1, hl); HR(5, -2, 8, 1, acc); break;
      case 'ponytail': cap(); fringe(); break;
      case 'pigtails': cap(); fringe(); break;
      case 'headwrap':
        RR(hx - 1, hy - 4, 20, 10, 4, hc); HR(-1, 4, 20, 1, hd);
        for (i = 0; i < 6; i++) HR(1 + i * 3, -3, 1, 7, acc);
        D(hx + 15, hy - 6, 3, hc); P(hx + 15, hy - 6, hd); HR(-1, 5, 2, 4, hc); HR(17, 5, 2, 4, hc); break;
      case 'hijab':
        RR(hx - 2, hy - 4, 22, 12, 5, hc); HR(-2, 3, 22, 1, hl);
        HR(-2, 6, 4, 9, hc); HR(16, 6, 4, 9, hc); HR(-2, 14, 22, 1, hd);
        HR(-1, 6, 1, 8, hd); HR(18, 6, 1, 8, hd); HR(2, 5, 14, 1, hd); break;
      default: break;
    }

    // glasses
    function lens(x, y, w, h, c, round) {
      R(hx + x, hy + y, w, 1, c); R(hx + x, hy + y + h - 1, w, 1, c); R(hx + x, hy + y, 1, h, c); R(hx + x + w - 1, hy + y, 1, h, c);
      if (round) { P(hx + x, hy + y, null); }
    }
    if (s.glasses === 'round' || s.glasses === 'square' || s.glasses === 'cat') {
      var gc = s.glasses === 'round' ? '#c9a24a' : (s.glasses === 'square' ? '#6a4f8e' : '#c76a8a');
      var gy = s.glasses === 'cat' ? 6 : 7;
      lens(2, gy, 7, 6, gc); lens(10, gy, 7, 6, gc);
      R(hx + 9, hy + gy + 2, 1, 1, gc);
      R(hx - 1, hy + gy + 1, 3, 1, gc); R(hx + 16, hy + gy + 1, 3, 1, gc);
      if (s.glasses === 'cat') { P(hx + 1, hy + 5, gc); P(hx + 17, hy + 5, gc); }
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(hx + 3, hy + gy + 1, 2, 1); g.fillRect(hx + 11, hy + gy + 1, 2, 1);
    }

    // hair accessories
    if (s.hairAcc === 'bow') {
      HR(11, -4, 3, 3, '#f08aa8'); HR(15, -4, 3, 3, '#f08aa8'); HR(14, -3, 1, 1, '#c95a7e'); HR(11, -4, 3, 1, '#f8b4c8'); HR(15, -4, 3, 1, '#f8b4c8');
    } else if (s.hairAcc === 'flower') {
      HR(12, -2, 5, 1, '#ffd0e0'); HR(13, -3, 3, 3, '#ffd0e0'); HR(14, -2, 1, 1, '#f5c443');
    }
    if (s.hearing) {
      HR(-2, 7, 2, 1, '#d9b79b'); HR(-2, 8, 1, 4, '#d9b79b'); HR(-1, 12, 1, 1, '#d9b79b');
      HR(18, 7, 2, 1, '#d9b79b'); HR(19, 8, 1, 4, '#d9b79b'); HR(18, 12, 1, 1, '#d9b79b');
    }
    if (s.headphones) {
      HR(-1, -4, 20, 2, '#46405a'); HR(-2, -3, 2, 9, '#46405a'); HR(18, -3, 2, 9, '#46405a');
      HR(-4, 5, 3, 7, acc); HR(19, 5, 3, 7, acc); HR(-4, 5, 3, 1, shade(acc, 0.25)); HR(19, 5, 3, 1, shade(acc, 0.25));
    }

    outline(cv);
    C.setCtx(prev);
    return cv;
  }

  function sprite(s, a) {
    a = a || {};
    var sway = Math.round(Math.sin((a.t || 0) * 2));
    var wv = a.wave > 0.01 ? Math.round(Math.sin((a.t || 0) * 14)) : 0;
    var key = JSON.stringify([s, !!a.bob, !!a.blink, a.look === 'up', !!a.smile, Math.round((a.cheer || 0) * 8), a.wave > 0.01, a.chair, a.accent, sway, wv]);
    var hit = cache[key];
    if (hit) return hit;
    if (cacheN > 300) { cache = {}; cacheN = 0; }
    var cv = paint(s, { t: a.t, bob: a.bob, blink: a.blink, look: a.look, smile: a.smile, cheer: Math.round((a.cheer || 0) * 8) / 8, wave: a.wave, chair: a.chair, accent: a.accent });
    cache[key] = cv; cacheN++;
    return cv;
  }

  // the sprite is placed so its pelvis sits at (cx, T)
  function drawPerson(s, cx, T, a) {
    var g = C.ctx();
    g.drawImage(sprite(s, a), Math.round(cx - AX), Math.round(T - AT));
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

  function drawPreview(canvas, spec, t) {
    var c = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, w, h);
    C.setCtx(c);
    R(0, 0, w, h, '#f6e7d0');
    for (var i = 0; i < w; i += 14) R(i, 0, 7, h * 0.62, '#f2dfc2');
    R(0, Math.round(h * 0.62), w, h, '#c99b6b');
    R(0, Math.round(h * 0.62), w, 3, '#b4875a');
    var s = cleanSpec(spec);
    var sp = sprite(s, { t: t || 0, smile: true, chair: '#c9805f' });
    var k = Math.floor(Math.min(w / SW, h / SH));
    var dw = SW * k, dh = SH * k;
    c.drawImage(sp, Math.round((w - dw) / 2), h - dh + 2 * k, dw, dh);
    var ty = Math.round(h * 0.84);
    C.setCtx(c);
    R(0, ty, w, h - ty, '#dba76e'); R(0, ty, w, 2, '#efc58d'); R(0, ty + 2, w, 2, '#b57a45');
    var lc = Math.round(w / 2);
    R(lc - 7 * k / 2, ty - 5 * k, 7 * k, 5 * k, '#e9e4da');
    R(lc - 1, ty - 3 * k, 2, 2, '#f4a6b8');
  }

  /* ---------- the cafe regulars (everyone made to look different) ---------- */
  function npc(o) {
    var s = defaultSpec();
    for (var k in o) s[k] = o[k];
    return s;
  }
  var ROSTER = {
    back: [
      npc({ name: 'Mina', skin: 1, hair: 'bun', hairColor: 1, body: 1, outfit: 'cardigan', outfitColor: 0, glasses: 'round' }),
      null,
      npc({ name: 'Noor', skin: 4, hair: 'hijab', hairColor: 2, body: 1, outfit: 'turtle', outfitColor: 4 })
    ],
    fl: [
      npc({ name: 'Theo', skin: 3, hair: 'locs', hairColor: 1, body: 2, outfit: 'stripes', outfitColor: 3, facial: 'beard', glasses: 'square' }),
      npc({ name: 'Jo', skin: 6, hair: 'twists', hairColor: 0, body: 1, outfit: 'hoodie', outfitColor: 7, seat: 'wheelchair', hearing: true })
    ],
    fr: []
  };

  Cafe.People = {
    Options: Options, defaultSpec: defaultSpec, randomSpec: randomSpec, cleanSpec: cleanSpec,
    drawPerson: drawPerson, drawLaptop: drawLaptop, drawPreview: drawPreview, roster: ROSTER, SW: SW, SH: SH, AX: AX, AT: AT
  };
})();
