// Exercise builder: a top-down sketch of a stage (targets, no-shoots, poppers, walls, start box).
// Pure SVG + DOM, no inline styles. Items are dragged with the pointer or moved with the arrow keys.
import { h, s } from './util.js';

export const KINDS = {
  paper: 'מטרה', noshoot: 'נו-שוט', popper: 'פופר', wall: 'מחסום', start: 'אזור התחלה'
};
const W = 400, H = 300, MAX_ITEMS = 60;

// IPSC minimums: 2 scoring hits per paper target, 1 per popper; Alpha = 5 points. No-shoots and walls do not count.
export function layoutStats(items) {
  const n = t => items.filter(i => i.t === t).length;
  const paper = n('paper'), popper = n('popper'), noshoot = n('noshoot');
  const rounds = paper * 2 + popper;
  return { paper, popper, noshoot, wall: n('wall'), rounds, points: rounds * 5 };
}
export const statsText = st => `מטרות נייר: ${st.paper} · פופרים: ${st.popper} · נו-שוט: ${st.noshoot} · מינימום כדורים: ${st.rounds} · ניקוד מקסימלי: ${st.points}`;

function glyph(t) {
  const hit = (w, hh) => s('rect', { x: -w, y: -hh, width: w * 2, height: hh * 2, fill: 'rgba(0,0,0,0)' });
  if (t === 'paper') return [hit(12, 12),
    s('polygon', { points: '-3.6,-9 3.6,-9 7,-3.2 7,3.6 3.6,9 -3.6,9 -7,3.6 -7,-3.2', fill: '#E9AE6E', stroke: '#6B4A2B', 'stroke-width': 1 }),
    s('polygon', { points: '-1.9,-5.5 1.9,-5.5 3.4,-1 3.4,2 1.7,5 -1.7,5 -3.4,2 -3.4,-1', fill: '#C98A45', stroke: '#6B4A2B', 'stroke-width': .6 })];
  if (t === 'noshoot') return [hit(12, 12),
    s('polygon', { points: '-3.6,-9 3.6,-9 7,-3.2 7,3.6 3.6,9 -3.6,9 -7,3.6 -7,-3.2', fill: '#FFFFFF', stroke: '#1B2430', 'stroke-width': 1 }),
    s('path', { d: 'M-4 -5L4 5M4 -5L-4 5', stroke: '#B3261E', 'stroke-width': 1.4, 'stroke-linecap': 'round' })];
  if (t === 'popper') return [hit(9, 9),
    s('circle', { r: 5.5, fill: '#AEB6BF', stroke: '#2B3138', 'stroke-width': 1 }), s('circle', { r: 2.2, fill: '#2B3138' })];
  if (t === 'wall') return [hit(24, 8), s('rect', { x: -22, y: -3, width: 44, height: 6, fill: '#5A524A', stroke: '#2B2620', 'stroke-width': .8 })];
  return [hit(17, 12), s('rect', { x: -16, y: -11, width: 32, height: 22, fill: 'rgba(255,122,46,.12)', stroke: '#F26A1B', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }),
    s('text', { x: 0, y: 2.5, 'text-anchor': 'middle', 'font-size': 7, 'font-weight': 700, fill: '#B34700' }, 'S')];
}
const place = it => `translate(${it.x} ${it.y}) rotate(${it.r || 0}) scale(1.5)`;

function floor() {
  const g = s('g', null, s('rect', { width: W, height: H, fill: '#ECE9E3' }));
  let d = ''; for (let x = 40; x < W; x += 40) d += `M${x} 0V${H}`; for (let y = 40; y < H; y += 40) d += `M0 ${y}H${W}`;
  g.append(s('path', { d, stroke: '#D6D1C6', 'stroke-width': .6 }),
    s('path', { d: 'M200 294V268M194 275L200 268L206 275', stroke: '#8E887C', 'stroke-width': 1.2, fill: 'none', 'stroke-linecap': 'round' }),
    s('text', { x: 212, y: 289, 'font-size': 8, fill: '#6B655B' }, 'כיוון ירי'));
  return g;
}
const summary = items => { const st = layoutStats(items); return `סכמת תרגיל: ${st.paper} מטרות, ${st.popper} פופרים, ${st.noshoot} נו-שוט, ${st.wall} מחסומים`; };

// Read-only drawing of a layout.
export function layoutView(layout) {
  const items = (layout && layout.items) || [];
  const svg = s('svg', { class: 'lay-svg view', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': summary(items) }, floor());
  for (const it of items) svg.append(s('g', { transform: place(it) }, ...glyph(it.t)));
  return svg;
}

export function layoutEditor(initial, onChange = () => {}) {
  let uid = 0;
  const items = ((initial && initial.items) || []).map(i => ({ ...i, id: ++uid }));
  let sel = null;
  const svg = s('svg', { class: 'lay-svg', viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': 'שטח התרגיל. אפשר לגרור פריטים, או לבחור פריט ולהזיז אותו עם החצים' }, floor());
  const layer = s('g'); svg.append(layer);
  const stats = h('p', { class: 'lay-stats', role: 'status' });
  const nodes = new Map();
  const clamp = (v, max) => Math.max(0, Math.min(max, v));
  const toLocal = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  const label = it => `${KINDS[it.t]}`;

  const btn = (text, fn, cls = 'btn soft sm') => h('button', { type: 'button', class: cls, onclick: fn }, text);
  const ctl = { rotL: btn('סיבוב שמאלה', () => rot(-15)), rotR: btn('סיבוב ימינה', () => rot(15)), dup: btn('שכפול', () => dup()), del: btn('מחיקה', () => remove(), 'btn danger sm') };

  const changed = () => {
    stats.textContent = statsText(layoutStats(items));
    svg.setAttribute('aria-label', summary(items) + '. אפשר לגרור פריטים, או לבחור פריט ולהזיז אותו עם החצים');
    for (const b of Object.values(ctl)) b.disabled = sel == null;
    for (const [id, g] of nodes) g.querySelector('.sel').setAttribute('visibility', id === sel ? 'visible' : 'hidden');
    onChange();
  };
  const select = id => { sel = id; changed(); };
  const byId = id => items.find(i => i.id === id);
  const draw = () => {
    layer.replaceChildren(); nodes.clear();
    for (const it of items) {
      const g = s('g', { transform: place(it), tabindex: 0, role: 'button', 'aria-label': label(it) + ', ' + Math.round(it.x) + ',' + Math.round(it.y), class: 'lay-item' }, ...glyph(it.t),
        s('rect', { class: 'sel', x: -15, y: -15, width: 30, height: 30, fill: 'none', stroke: '#F26A1B', 'stroke-width': 1.4, 'stroke-dasharray': '3 2', visibility: 'hidden' }));
      g.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); select(it.id); g.focus({ preventScroll: true });
        const p = toLocal(e), dx = it.x - p.x, dy = it.y - p.y;
        g.setPointerCapture(e.pointerId);
        const move = ev => { const q = toLocal(ev); it.x = clamp(q.x + dx, W); it.y = clamp(q.y + dy, H); g.setAttribute('transform', place(it)); };
        const up = () => { g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up); onChange(); };
        g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
      });
      g.addEventListener('focus', () => { if (sel !== it.id) select(it.id); });
      g.addEventListener('keydown', e => {
        const step = e.shiftKey ? 1 : 4, k = e.key;
        if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); remove(); return; }
        const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[k];
        if (!d) return;
        e.preventDefault(); it.x = clamp(it.x + d[0], W); it.y = clamp(it.y + d[1], H); g.setAttribute('transform', place(it)); onChange();
      });
      layer.append(g); nodes.set(it.id, g);
    }
    changed();
  };
  const add = t => {
    if (items.length >= MAX_ITEMS) return;
    const n = items.length; const it = { id: ++uid, t, x: 200 + ((n % 7) - 3) * 22, y: 130 + (Math.floor(n / 7) % 4) * 22, r: 0 };
    items.push(it); draw(); select(it.id); nodes.get(it.id).focus({ preventScroll: true });
  };
  const rot = d => { const it = byId(sel); if (!it) return; it.r = (((it.r || 0) + d) % 360 + 360) % 360; nodes.get(it.id).setAttribute('transform', place(it)); onChange(); };
  const dup = () => { const it = byId(sel); if (!it || items.length >= MAX_ITEMS) return; const c = { ...it, id: ++uid, x: clamp(it.x + 12, W), y: clamp(it.y + 12, H) }; items.push(c); draw(); select(c.id); };
  const remove = () => { const i = items.findIndex(x => x.id === sel); if (i < 0) return; items.splice(i, 1); sel = null; draw(); };
  svg.addEventListener('pointerdown', e => { if (e.target === svg || !e.target.closest('.lay-item')) select(null); });

  const pal = h('div', { class: 'lay-pal', role: 'group', 'aria-label': 'הוספת פריט לשטח' }, ...Object.entries(KINDS).map(([t, name]) => btn('+ ' + name, () => add(t))));
  const el = h('div', { class: 'lay-editor' }, pal, svg, h('div', { class: 'lay-pal', role: 'group', 'aria-label': 'פעולות על הפריט הנבחר' }, ctl.rotL, ctl.rotR, ctl.dup, ctl.del), stats,
    h('p', { class: 'small muted' }, 'המינימום לפי חוקי IPSC: שתי פגיעות בכל מטרת נייר ופגיעה אחת בכל פופר. פגיעה באזור A שווה 5 נקודות.'));
  draw();
  return { el, getLayout: () => ({ items: items.map(({ t, x, y, r }) => ({ t, x, y, r: r || 0 })) }), stats: () => layoutStats(items) };
}
