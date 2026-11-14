// Shared app state (current user, public info). Views import this instead of passing globals around.
export const state = { user: null, unread: 0, info: { links: {}, news: [] }, section: null };
export const go = path => { location.hash = '#' + path; };
export const hasRole = (u, r) => !!u && u.roles.includes(r);
export const SECTION_HOME = { member: '/m', instructor: '/i', admin: '/a' };
export const sectionOfPath = p => (/^\/(m|i|a)(\/|$)/.exec(p) || [])[1] ? ({ m: 'member', i: 'instructor', a: 'admin' })[/^\/(m|i|a)/.exec(p)[1]] : null;
// Where a logged-in user lands: the section they used last, otherwise the highest role they hold.
export const homeFor = u => {
  if (!u) return '/';
  const sec = state.section && u.roles.includes(state.section) ? state.section : ['admin', 'instructor', 'member'].find(r => u.roles.includes(r));
  return SECTION_HOME[sec];
};
