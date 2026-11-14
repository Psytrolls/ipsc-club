// Home page "try a stage" widget: a short demo of how a result looks in the member area.
import { h } from './util.js';
import { targetBox, createSound } from './live.js';

const TOTAL = 3710;
const SHOTS = [ // x, y in target box units; at = ms from start
  { x: 232, y: 160, z: 'A', at: 620 }, { x: 250, y: 215, z: 'A', at: 1050 }, { x: 222, y: 262, z: 'A', at: 1520 },
  { x: 258, y: 300, z: 'A', at: 2180 }, { x: 140, y: 300, z: 'C', at: 2900 }, { x: 70, y: 330, z: 'D', at: 3710 }
];

export function simulator() {
  const sound = createSound();
  const box = targetBox();
  const time = h('div', { class: 'sim-time', dir: 'ltr' }, '0.00');
  const num = { A: h('b', null, '0'), C: h('b', null, '0'), D: h('b', null, '0') };
  const stat = z => h('div', { class: 'sim-stat z' + z }, num[z], h('span', null, z));
  const live = h('p', { class: 'sr', role: 'status' });
  const actions = h('div', { class: 'sim-actions' });
  let iv = null;

  const reset = () => { clearInterval(iv); box.clearHits(); time.textContent = '0.00'; for (const z in num) num[z].textContent = '0'; live.textContent = ''; idle(); };
  const idle = () => actions.replaceChildren(h('button', { class: 'btn dark block', type: 'button', onclick: start }, 'התחילו תרגיל'));
  const done = () => actions.replaceChildren(
    h('p', { class: 'sim-note' }, 'התוצאות נשמרות באזור האישי של חברי המועדון. רוצים לעקוב אחרי ההתקדמות?'),
    h('a', { class: 'btn block', href: '#/join' }, 'הצטרפות למועדון'),
    h('button', { class: 'btn soft block', type: 'button', onclick: reset }, 'עוד פעם'));

  function start() {
    box.clearHits(); for (const z in num) num[z].textContent = '0';
    actions.replaceChildren(h('button', { class: 'btn dark block', type: 'button', disabled: true }, 'אש!'));
    sound.start();
    const t0 = Date.now() + 350; let shown = 0; const cnt = { A: 0, C: 0, D: 0 };
    clearInterval(iv);
    iv = setInterval(() => {
      if (!box.isConnected) return clearInterval(iv);
      const el = Math.max(0, Date.now() - t0), t = Math.min(el, TOTAL);
      time.textContent = (t / 1000).toFixed(2);
      while (shown < SHOTS.length && t >= SHOTS[shown].at) { const s = SHOTS[shown++]; box.addHit(s.x, s.y); sound.shot(); cnt[s.z]++; num[s.z].textContent = cnt[s.z]; }
      if (el >= TOTAL) {
        clearInterval(iv); time.textContent = (TOTAL / 1000).toFixed(2); done();
        live.textContent = `התרגיל הסתיים: ${(TOTAL / 1000).toFixed(2)} שניות, ${cnt.A} באזור A, ${cnt.C} באזור C, ${cnt.D} באזור D`;
      }
    }, 30);
  }
  const soundBtn = h('button', { class: 'sound-btn', type: 'button', 'aria-pressed': 'false', onclick: () => { const on = sound.toggle(); soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.textContent = on ? 'צליל: פועל' : 'צליל: כבוי'; } }, 'צליל: כבוי');
  idle();
  return h('section', { class: 'sim' }, h('div', { class: 'wrap sim-grid' },
    h('div', { class: 'sim-head' }, h('h2', null, 'נסו תרגיל בעצמכם'), h('p', null, 'שישה כדורים, זמן אחד. כך נראית תוצאה באזור האישי: זמן ופגיעות באזורים A, C ו-D.'), soundBtn),
    h('div', { class: 'sim-body' }, box, h('div', { class: 'sim-side' }, h('div', null, h('span', { class: 'sim-label' }, 'זמן'), time), h('div', { class: 'sim-stats' }, stat('A'), stat('C'), stat('D')))),
    actions, live));
}
