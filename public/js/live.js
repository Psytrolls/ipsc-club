// Live visuals: the IPSC target with hit marks, the countdown board and synthesized range sounds.
import { h } from './util.js';

// Target art is drawn in a 436x540 box (see /img/ipsc-target.svg viewBox "24 52 436 540").
const VB = { x: 24, y: 52, w: 436, h: 540 };
// Fixed, plausible hit spots per zone, so the same result always draws the same target.
const SLOTS = {
  A: [[232, 160], [250, 215], [222, 262], [258, 300], [205, 205], [272, 255], [190, 300], [240, 125], [225, 340], [262, 180]],
  C: [[140, 300], [345, 300], [130, 250], [350, 262], [240, 430], [205, 440], [325, 380], [155, 380]],
  D: [[70, 330], [420, 320], [60, 262], [430, 262], [110, 430], [380, 440]]
};
export const MAX_DOTS = 18;
export function hitsFor({ a = 0, c = 0, d = 0 } = {}) {
  const out = [];
  for (const [z, n] of [['A', a], ['C', c], ['D', d]]) {
    for (let i = 0; i < Math.min(n, SLOTS[z].length * 2); i++) {
      const [x, y] = SLOTS[z][i % SLOTS[z].length];
      const j = i >= SLOTS[z].length ? 9 : 0; // second lap: shift a little so dots do not stack
      out.push({ x: x + j, y: y + j, z });
    }
  }
  return out.slice(0, MAX_DOTS);
}
const pos = (el, x, y) => { el.style.left = ((x - VB.x) / VB.w * 100).toFixed(2) + '%'; el.style.top = ((y - VB.y) / VB.h * 100).toFixed(2) + '%'; };

// A target with absolutely positioned dots. `animate` staggers the dots in (CSS animation, off for reduced motion).
export function targetBox(hits = [], { animate = false, label = 'מטרת IPSC' } = {}) {
  const box = h('div', { class: 'tbox' }, h('img', { src: '/img/ipsc-target.svg', alt: label, width: 218, height: 270 }));
  box.addHit = (x, y, delay = 0) => {
    const d = h('span', { class: 'hit', 'aria-hidden': 'true' });
    pos(d, x, y); if (delay) d.style.animationDelay = delay + 'ms';
    box.append(d);
  };
  box.clearHits = () => box.querySelectorAll('.hit').forEach(n => n.remove());
  hits.forEach((p, i) => box.addHit(p.x, p.y, animate ? 350 + i * 130 : 0));
  return box;
}

// Days / hours / minutes until `iso`; refreshes itself while it is on the page.
export function countdown(iso) {
  const cell = label => { const n = h('b', null, '0'); return { el: h('div', { class: 'cd-cell' }, n, h('span', null, label)), n }; };
  const d = cell('ימים'), hr = cell('שעות'), m = cell('דקות');
  const box = h('div', { class: 'cd', role: 'timer', 'aria-label': 'הזמן שנותר עד האימון' }, d.el, hr.el, m.el);
  const tick = () => {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) { box.replaceChildren(h('b', { class: 'cd-now' }, 'האימון התחיל')); return false; }
    const min = Math.floor(ms / 60000);
    d.n.textContent = Math.floor(min / 1440); hr.n.textContent = Math.floor(min % 1440 / 60); m.n.textContent = min % 60;
    return true;
  };
  if (tick()) {
    const iv = setInterval(() => { if (!box.isConnected || !tick()) clearInterval(iv); }, 20000);
  }
  return box;
}

// Range sounds synthesized with WebAudio (no files). Created on first use, so it starts after a user gesture.
export function createSound() {
  let ctx = null, on = false;
  const get = () => { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  return {
    get on() { return on; },
    toggle() { on = !on; if (on) get(); return on; },
    start() { // timer beep
      if (!on) return; const c = get(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = 'square'; o.frequency.value = 1900; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + .34);
    },
    shot() { // noise crack + low thump
      if (!on) return; const c = get(); if (!c) return; const t = c.currentTime;
      const len = Math.floor(c.sampleRate * .16), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const n = c.createBufferSource(), ng = c.createGain(); n.buffer = buf; ng.gain.value = .5;
      n.connect(ng).connect(c.destination); n.start(t);
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
      og.gain.setValueAtTime(.5, t); og.gain.exponentialRampToValueAtTime(.0001, t + .14);
      o.connect(og).connect(c.destination); o.start(t); o.stop(t + .15);
    }
  };
}
