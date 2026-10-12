/* Little flow cafe: the plants. Hand drawn plant art, bundled in plant-data.js.
   Plants grow in four stages, get thirsty, then sleepy, and wake when a task is finished. */
(function () {
  'use strict';
  var Cafe = (window.Cafe = window.Cafe || {});
  var C = Cafe.Core;

  /* where plants can live. x and y (the bottom middle of the plant) are set by the scene. pref is the plant that moves in first. */
  var SLOTS = [
    { id: 0, kind: 'sill', x: 134, y: 94, pref: 'astilbePlum', name: 'Sunny' },
    { id: 1, kind: 'sill', x: 192, y: 94, pref: 'rubber', name: 'Monty' },
    { id: 2, kind: 'sill', x: 250, y: 94, pref: 'bouquet', name: 'Petal' },
    { id: 3, kind: 'mantel', x: 310, y: 64, pref: 'rosePink', name: 'Rosie' },
    { id: 4, kind: 'floor', x: 109, y: 136, pref: 'rubberBlue', name: 'Sage' },
    { id: 5, kind: 'hang', x: 100, y: 25, pref: 'trailMocha', name: 'Piper' },
    { id: 6, kind: 'hang', x: 284, y: 25, pref: 'trailBerry', name: 'Fernando' },
    { id: 7, kind: 'table', x: 64, y: 187, pref: 'carnPink', name: 'Daisy' },
    { id: 8, kind: 'floor', x: 0, y: 0, pref: 'rubberPlum', name: 'Big Bertha' },
    { id: 9, kind: 'floor', x: 0, y: 0, pref: 'roseSage', name: 'Frida' },
    { id: 10, kind: 'floor', x: 0, y: 0, pref: 'rubberCocoa', name: 'Cocoa' },
    { id: 11, kind: 'floor', x: 0, y: 0, pref: 'astilbeHoney', name: 'Honey' },
    { id: 12, kind: 'floor', x: 0, y: 0, pref: 'carnGold', name: 'Goldie' },
    { id: 13, kind: 'mantel', x: 0, y: 0, pref: 'roseTeal', name: 'Teal' },
    { id: 14, kind: 'mantel', x: 0, y: 0, pref: 'carnPink', name: 'Blush' },
    { id: 15, kind: 'table', x: 0, y: 0, pref: 'astilbePlum', name: 'Buttercup' }
  ];
  var UNLOCK_ORDER = [1, 0, 2, 7, 4, 3, 5, 6, 8, 12, 9, 10, 11, 13, 14, 15];

  /* how tall each kind of spot draws a plant, in scene pixels */
  var KIND_H = { sill: 46, mantel: 38, table: 38, floor: 88, hang: 46 };
  var STAGE_SCALE = [0.5, 0.68, 0.84, 1];

  /* every plant you can grow. rel is its size next to the others. */
  var VARIETIES = [
    { id: 'rubber', label: 'Rubber plant', rel: 1 },
    { id: 'bouquet', label: 'Wildflower bouquet', rel: 0.92 },
    { id: 'astilbePlum', label: 'Astilbe in a plum vase', rel: 0.8 },
    { id: 'rosePink', label: 'Spray roses, pink vase', rel: 0.72 },
    { id: 'carnPink', label: 'Pink carnations', rel: 0.88 },
    { id: 'trailMocha', label: 'Trailing fern, mocha pot', rel: 0.62 },
    { id: 'rubberBlue', label: 'Rubber plant, blue pot', rel: 1 },
    { id: 'astilbeHoney', label: 'Astilbe in a honey vase', rel: 0.8 },
    { id: 'roseTeal', label: 'Spray roses, teal vase', rel: 0.72 },
    { id: 'trailBerry', label: 'Trailing fern, berry pot', rel: 0.62 },
    { id: 'carnGold', label: 'Golden carnations', rel: 0.88 },
    { id: 'rubberPlum', label: 'Variegated rubber plant, plum pot', rel: 1 },
    { id: 'roseSage', label: 'Spray roses, sage vase', rel: 0.72 },
    { id: 'rubberCocoa', label: 'Variegated rubber plant, cocoa pot', rel: 1 }
  ];
  /* total points (tasks 1, focus sessions 2) needed to unlock each plant. Missing means open from the start. */
  var UNLOCK_AT = { rubberBlue: 4, astilbeHoney: 9, roseTeal: 15, trailBerry: 22, carnGold: 30, rubberPlum: 40, roseSage: 52, rubberCocoa: 64 };
  function unlockAt(id) { return UNLOCK_AT[id] || 0; }
  var VBY = {};
  VARIETIES.forEach(function (v) { VBY[v.id] = v; });
  var HANG_OK = { trailMocha: 1, trailBerry: 1 };
  function defaultVariety(slot) { return slot.pref && VBY[slot.pref] ? slot.pref : 'rubber'; }
  function varietiesFor(slot) {
    return VARIETIES.filter(function (v) { return slot.kind === 'hang' ? !!HANG_OK[v.id] : true; });
  }
  function resolve(slot, choice) {
    var v = VBY[choice];
    if (!v || (slot.kind === 'hang' && !HANG_OK[v.id])) v = VBY[defaultVariety(slot)];
    return { id: v.id, label: v.label, type: v.id };
  }

  /* load the artwork once */
  var IMG = {}, ready = 0, total = 0;
  (function load() {
    var data = window.CafePlantArt || {};
    Object.keys(data).forEach(function (k) {
      total++;
      var im = new Image();
      im.onload = function () { ready++; };
      im.src = data[k].uri;
      IMG[k] = { im: im, w: data[k].w, h: data[k].h };
    });
  })();

  /* a thirsty plant is a touch paler, a sleepy one is muted and dim. Cached per plant and mood. */
  var tintCache = {};
  function tinted(id, health) {
    var e = IMG[id];
    if (!e || !e.im.complete || !e.im.naturalWidth) return null;
    if (health <= 0) return e.im;
    var key = id + '|' + health, c = tintCache[key];
    if (c) return c;
    c = document.createElement('canvas');
    c.width = e.im.naturalWidth; c.height = e.im.naturalHeight;
    var g = c.getContext('2d');
    g.drawImage(e.im, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = health === 1 ? 'rgba(214,201,120,0.20)' : 'rgba(150,138,118,0.46)';
    g.fillRect(0, 0, c.width, c.height);
    if (health >= 2) { g.fillStyle = 'rgba(60,50,60,0.12)'; g.fillRect(0, 0, c.width, c.height); }
    tintCache[key] = c;
    return c;
  }

  function sizeFor(slot, v, stage) {
    var e = IMG[v.id]; if (!e) return null;
    var sc = slot.scale || 1;
    var h = KIND_H[slot.kind] * v.rel * STAGE_SCALE[stage] * sc;
    var w = h * e.w / e.h;
    return { w: w, h: h };
  }

  function rectFor(slot) {
    var v = VBY[defaultVariety(slot)], sc = slot.scale || 1;
    var h = KIND_H[slot.kind] * sc, w = Math.round(h * 0.8);
    var top = slot.kind === 'hang' ? slot.y - h + 4 : slot.y - h;
    return { x: Math.round(slot.x - w / 2), y: Math.round(top), w: w, h: Math.round(h) };
  }

  /* p = { stage 0..3, health 0 happy, 1 thirsty, 2 sleeping, variety } */
  function drawPlant(slot, p, t) {
    var st = C.clamp(p.stage | 0, 0, 3), h = p.health | 0;
    var v = VBY[resolve(slot, p.variety).id];
    var sz = sizeFor(slot, v, st), img = tinted(v.id, h);
    if (!sz || !img) return;
    var g = C.ctx(), hang = slot.kind === 'hang';
    // a slow, soft sway from the base. Thirsty plants lean a little, sleepy ones droop and hold still.
    var amp = h === 0 ? 0.026 : (h === 1 ? 0.012 : 0.004);
    var lean = h === 1 ? 0.035 : (h >= 2 ? 0.085 : 0);
    var ang = Math.sin(t * 0.8 + slot.id * 1.7) * amp + Math.sin(t * 0.37 + slot.id) * amp * 0.5 + lean * (slot.id % 2 ? 1 : -1);
    var px = slot.x, py = hang ? (slot.hook || slot.y - 40) : slot.y;
    var sq = h >= 2 ? 0.96 : 1;
    g.save();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (hang) {
      var topY = slot.y - sz.h, hk = slot.hook || (slot.y - 44);
      g.translate(px, hk); g.rotate(ang * 0.6); g.translate(-px, -hk);
      g.strokeStyle = '#6b5240'; g.lineWidth = 0.9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, hk); g.lineTo(px - sz.w * 0.34, topY + sz.h * 0.5);
      g.moveTo(px, hk); g.lineTo(px + sz.w * 0.34, topY + sz.h * 0.5); g.stroke();
      g.drawImage(img, px - sz.w / 2, topY, sz.w, sz.h);
    } else {
      g.translate(px, py); g.rotate(ang); g.scale(1, sq);
      g.drawImage(img, -sz.w / 2, -sz.h, sz.w, sz.h);
    }
    g.restore();
  }

  /* one plant on its own small canvas for the greenhouse. locked paints it as a soft silhouette. */
  function drawSample(canvas, slot, varietyId, stage, health, t, locked) {
    var g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, v = VBY[varietyId] || VARIETIES[0];
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    var img = tinted(v.id, health | 0), e = IMG[v.id];
    if (!img || !e) return;
    var pad = 10, k = Math.min((W - pad * 2) / e.w, (H - pad * 2) / e.h) * (0.8 + 0.2 * v.rel);
    var st = C.clamp(stage == null ? 3 : stage, 0, 3);
    k *= 0.55 + 0.45 * STAGE_SCALE[st];
    var w = e.w * k, h = e.h * k, x = (W - w) / 2, y = H - pad - h;
    var ang = (health | 0) >= 2 ? 0.07 : Math.sin((t || 0) * 0.8) * 0.02;
    g.save();
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.translate(W / 2, H - pad); g.rotate(ang); g.translate(-W / 2, -(H - pad));
    g.drawImage(img, x, y, w, h);
    if (locked) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(205,190,160,0.94)'; g.fillRect(0, 0, W, H); }
    g.restore();
  }

  Cafe.Plants = {
    unlockAt: unlockAt, drawSample: drawSample,
    SLOTS: SLOTS, UNLOCK_ORDER: UNLOCK_ORDER, VARIETIES: VARIETIES, varietiesFor: varietiesFor, defaultVariety: defaultVariety, resolve: resolve, THRESHOLDS: [0, 3, 10, 22],
    drawPlant: drawPlant, rectFor: rectFor, ready: function () { return ready >= total; }
  };
})();
