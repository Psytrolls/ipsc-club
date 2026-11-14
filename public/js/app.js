import { h, api, toast, rolesLabel, avatar } from './util.js';
import { icon } from './icons.js';
import { state, go, homeFor, sectionOfPath } from './state.js';
import * as P from './views-public.js';
import * as M from './views-member.js';
import * as I from './views-instructor.js';
import * as A from './views-admin.js';

// [pattern, allowed roles (null = public, '*' = any logged in), view, title]
const ROUTES = [
  ['/', null, P.home, 'בית'], ['/about', null, P.about, 'על המועדון'], ['/ipsc', null, P.ipsc, 'IPSC'], ['/news', null, P.news, 'חדשות'],
  ['/faq', null, P.faq, 'שאלות נפוצות'], ['/course', null, P.course, 'בקשה לקורס'], ['/join', null, P.join, 'הצטרפות למועדון'], ['/login', null, P.login, 'כניסה'],
  ['/password', '*', M.password, 'החלפת סיסמה'], ['/notifications', '*', M.notifications, 'הודעות'], ['/profile', '*', M.profile, 'הפרופיל שלי'],
  ['/m', ['member'], M.dashboard, 'האזור האישי'], ['/m/trainings', ['member'], M.trainings, 'אימונים'], ['/m/training/:id', ['member'], M.trainingDetail, 'פרטי אימון'],
  ['/m/mine', ['member'], M.mine, 'ההרשמות שלי'], ['/m/results', ['member'], M.results, 'התקדמות'],
  ['/i', ['instructor'], I.myTrainings, 'אזור המדריך'], ['/i/training/:id', ['instructor'], I.trainingParticipants, 'משתתפים'], ['/i/training/:id/member/:uid', ['instructor'], I.memberSheet, 'הזנת תוצאות'], ['/i/training/:id/stage/:sid', ['instructor'], I.stageEdit, 'תרגיל'],
  ['/a', ['admin'], A.dashboard, 'ניהול המועדון'], ['/a/more', ['admin'], A.more, 'עוד'],
  ['/a/inquiries', ['admin'], A.inquiries, 'פניות'], ['/a/members', ['admin'], A.members, 'חברים'], ['/a/members/:id', ['admin'], A.memberEdit, 'חבר'],
  ['/a/trainings', ['admin'], A.trainings, 'אימונים'], ['/a/trainings/:id', ['admin'], A.trainingEdit, 'אימון'], ['/a/reports', ['admin'], A.reports, 'דוחות נוכחות'],
  ['/a/exercises', ['admin'], A.exercises, 'מאגר תרגילים'], ['/a/news', ['admin'], A.news, 'חדשות'], ['/a/settings', ['admin'], A.settings, 'הגדרות'],
].map(([pat, roles, view, title]) => ({ re: new RegExp('^' + pat.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), roles, view, title }));

const BOTTOM = {
  member: [['/m', 'בית', 'home'], ['/m/trainings', 'אימונים', 'target'], ['/m/results', 'התקדמות', 'chart'], ['/profile', 'פרופיל', 'user']],
  instructor: [['/i', 'אימונים', 'target'], ['/profile', 'פרופיל', 'user']],
  admin: [['/a', 'בית', 'home'], ['/a/inquiries', 'פניות', 'inbox'], ['/a/members', 'חברים', 'users'], ['/a/trainings', 'אימונים', 'calendar'], ['/a/more', 'עוד', 'more']],
};
const SECTION_LABEL = { member: 'חבר', instructor: 'מדריך', admin: 'ניהול' };
const PUBLIC_NAV = [['/', 'בית'], ['/about', 'על המועדון'], ['/ipsc', 'IPSC'], ['/news', 'חדשות'], ['/faq', 'שאלות נפוצות']];
const SECTION_START = { member: '/m', instructor: '/i', admin: '/a' };

const app = document.getElementById('app');
let seq = 0;

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathAndQ] = raw.split('#');
  const [path, qs] = pathAndQ.split('?');
  return { path: path || '/', query: new URLSearchParams(qs || '') };
}

function header(path) {
  const u = state.user;
  const link = (to, label) => h('a', { href: '#' + to, 'aria-current': path === to ? 'page' : null }, label);
  const links = [...PUBLIC_NAV, ...(u ? [[homeFor(u), 'האזור האישי']] : [])];
  const nav = h('nav', { class: 'nav', 'aria-label': 'ניווט ראשי' }, links.map(([t, l]) => link(t, l)));
  const mobile = h('nav', { class: 'mobile-nav', 'aria-label': 'ניווט ראשי', id: 'mnav', hidden: true }, links.map(([t, l]) => link(t, l)));
  const menu = h('button', { class: 'menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'mnav', 'aria-label': 'תפריט' }, icon('menu'));
  menu.onclick = () => { const open = mobile.hidden; mobile.hidden = !open; menu.setAttribute('aria-expanded', String(open)); };
  mobile.addEventListener('click', () => { mobile.hidden = true; menu.setAttribute('aria-expanded', 'false'); });
  const brand = h('a', { class: 'brand', href: '#/' }, h('img', { src: '/img/logo.png', alt: '' }), h('b', null, 'DESERT FALCON'));
  return h('header', { class: 'site-head' }, h('div', { class: 'wrap' }, userBox(u, path), brand, nav, menu), mobile);
}

function userBox(u, path) {
  if (!u) return h('div', { class: 'hd-user' }, h('a', { class: 'pill', href: '#/login' }, icon('user'), 'כניסה'));
  const box = h('div', { class: 'hd-user' });
  const btn = h('button', { class: 'avatar-btn', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-label': 'תפריט משתמש' }, avatar({ id: u.id, name: u.name, has_photo: !!u.photo, photo: u.photo }), icon('down'),
    state.unread ? h('span', { class: 'dot', 'aria-label': state.unread + ' הודעות חדשות' }, state.unread > 9 ? '9+' : state.unread) : null);
  const menu = h('div', { class: 'user-menu', hidden: true },
    h('div', { class: 'who' }, u.name, h('br'), rolesLabel(u.roles)),
    h('a', { href: '#/profile' }, icon('user'), 'הפרופיל שלי'),
    h('a', { href: '#/notifications' }, icon('bell'), 'הודעות' + (state.unread ? ` (${state.unread})` : '')),
    h('a', { href: '#/password' }, icon('lock'), 'החלפת סיסמה'),
    h('button', { type: 'button', onclick: async () => { await api('POST', '/api/auth/logout', {}).catch(() => {}); state.user = null; state.unread = 0; state.section = null; go('/'); render(); } }, icon('logout'), 'יציאה'));
  const toggle = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  btn.onclick = e => { e.stopPropagation(); toggle(menu.hidden); };
  menu.onclick = () => toggle(false);
  box.addEventListener('keydown', e => { if (e.key === 'Escape') { toggle(false); btn.focus(); } });
  box.append(btn, menu);
  return box;
}

function sectionNav(path) {
  const u = state.user;
  if (!u) return [];
  const sec = sectionOfPath(path) || (state.section && u.roles.includes(state.section) ? state.section : null);
  if (!sec || !u.roles.includes(sec)) return [];
  state.section = sec;
  const out = [];
  if (u.roles.length > 1) { // combined roles: switch between the areas you hold
    out.push(h('nav', { class: 'roleswitch', 'aria-label': 'מעבר בין תפקידים' }, h('div', { class: 'wrap' },
      ['member', 'instructor', 'admin'].filter(r => u.roles.includes(r)).map(r => h('a', { href: '#' + SECTION_START[r], 'aria-current': String(r === sec) }, SECTION_LABEL[r])))));
  }
  out.push(h('nav', { class: 'bottombar', 'aria-label': 'ניווט אזור אישי' }, h('div', { class: 'wrap' },
    BOTTOM[sec].map(([to, label, ic]) => {
      const cur = path === to || (to !== '/m' && to !== '/i' && to !== '/a' && path.startsWith(to + '/'))
        || (to === '/a/more' && /^\/a\/(reports|exercises|news|settings)/.test(path)) || (to === '/m/trainings' && /^\/m\/(training|mine)/.test(path));
      return h('a', { href: '#' + to, 'aria-current': cur ? 'page' : null }, icon(ic), label);
    }))));
  return out;
}

// PWA: register the service worker, and offer "install" where the browser supports it (Android/desktop Chrome, Edge).
let installEvent = null;
const installBtn = () => {
  const b = h('button', { class: 'btn soft sm', type: 'button', onclick: async () => { const e = installEvent; installEvent = null; b.remove(); if (e) { e.prompt(); await e.userChoice.catch(() => {}); } } }, 'התקנה כאפליקציה');
  return b;
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; document.querySelector('.foot .wrap')?.append(installBtn()); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

function footer() {
  return h('footer', { class: 'foot' }, h('div', { class: 'wrap' }, h('strong', null, 'נץ המדבר · Desert Falcon'),
    h('p', { class: 'small' }, 'התשלום מתבצע במקום בלבד.'), P.linkList('plain'), installEvent ? installBtn() : null));
}

async function render() {
  const my = ++seq;
  const { path, query } = parseHash();
  let route = null, params = {};
  for (const r of ROUTES) { const m = r.re.exec(path); if (m) { route = r; params = m.groups || {}; break; } }
  if (state.user) { // keep the session + unread badge fresh on every navigation
    try { const me = await api('GET', '/api/auth/me'); state.user = me.user; state.unread = me.unread || 0; } catch { /* offline */ }
    if (my !== seq) return;
  }
  const u = state.user;
  const redirect = to => { go(to); };
  if (!route) route = { view: () => h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('h1', null, 'העמוד לא נמצא')), h('a', { href: '#/' }, 'חזרה לדף הבית')), title: 'לא נמצא', roles: null };
  if (u && u.must_change_pw && path !== '/password') return redirect('/password');
  if (route.roles && !u) { toast('יש להתחבר כדי להמשיך', true); return redirect('/login'); }
  if (route.roles && route.roles !== '*' && !route.roles.some(r => u.roles.includes(r))) return redirect(homeFor(u));

  const nav = sectionNav(path);
  document.body.classList.toggle('has-bottom-bar', nav.length > 0);
  const main = h('main', { id: 'main', tabindex: '-1' }, h('div', { class: 'wrap' }, h('p', { class: 'muted gap2', role: 'status' }, 'טוען…')));
  const bottom = nav.filter(n => n.classList.contains('bottombar')), top = nav.filter(n => !n.classList.contains('bottombar'));
  app.replaceChildren(header(path), ...top, main, footer(), ...bottom);
  document.title = route.title + ' | נץ המדבר';
  try {
    const content = await route.view({ params, query, path });
    if (my !== seq) return; // a newer navigation won
    main.replaceChildren(content);
    if (!location.hash.includes('#r')) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  } catch (e) {
    if (my !== seq) return;
    if (e.status === 401) { state.user = null; toast('ההתחברות פגה. יש להתחבר מחדש', true); return redirect('/login'); }
    if (e.code === 'must_change_password') { state.user.must_change_pw = true; return redirect('/password'); }
    main.replaceChildren(h('div', { class: 'wrap' }, h('div', { class: 'alert err', role: 'alert' }, e.message || 'אירעה שגיאה'), h('a', { href: '#/' }, 'חזרה לדף הבית')));
  }
}

document.addEventListener('click', () => document.querySelectorAll('.user-menu').forEach(m => { m.hidden = true; }));
window.addEventListener('hashchange', render);
window.addEventListener('df:session', () => render());
window.addEventListener('df:unread', () => document.querySelector('.avatar-btn .dot')?.remove());

(async function boot() {
  try {
    const [me, info] = await Promise.all([api('GET', '/api/auth/me'), api('GET', '/api/public/info')]);
    state.user = me.user; state.unread = me.unread || 0; state.info = info;
  } catch { /* offline: render public shell anyway */ }
  render();
})();
