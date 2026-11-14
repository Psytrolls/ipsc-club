import { h, api, field, formAlert, busy, toast, normalizePhone, fmtDay, dialog } from './util.js';
import { icon } from './icons.js';
import { state, go, homeFor } from './state.js';
import { simulator } from './sim.js';

const LINKS = { whatsapp: ['וואטסאפ', 'whatsapp'], instagram: ['אינסטגרם', 'instagram'], facebook: ['פייסבוק', 'facebook'], youtube: ['יוטיוב', 'youtube'], ipsc_global: ['IPSC העולמי', 'globe'], ipsc_israel: ['IPSC ישראל', 'globe'] };
const ext = u => ({ href: u, target: '_blank', rel: 'noopener noreferrer' });
export function socials(keys = ['whatsapp', 'instagram', 'facebook', 'youtube']) {
  const l = state.info.links || {};
  const items = keys.filter(k => l[k]);
  if (!items.length) return null;
  return h('div', { class: 'socials' }, items.map(k => h('a', { class: 'social ' + k, ...ext(l[k]) }, h('i', null, icon(LINKS[k][1])), LINKS[k][0])));
}
export function linkList(cls) {
  const l = state.info.links || {};
  const items = Object.keys(l);
  if (!items.length) return null;
  return h('ul', { class: cls }, items.map(k => h('li', null, h('a', ext(l[k]), (LINKS[k] || [k])[0]))));
}
const pageHero = (title, sub) => h('div', { class: 'page-hero' }, h('div', { class: 'wrap' }, h('h1', null, title), sub ? h('p', null, sub) : null));
const CATS = { club: 'מועדון', israel: 'ישראל', world: 'עולם' };

export function home() {
  const news = state.info.news;
  const ticker = txt => h('span', null, txt);
  const strip = 'ספורט • קהילה • התקדמות • ספורט • קהילה • התקדמות • ';
  const gcard = (cls, href, title) => h('a', { class: 'gcard ' + cls, href: '#' + href }, h('span', null, title));
  return h('div', null,
    h('section', { class: 'hero hero-dyn' }, h('div', { class: 'hero-bg kb', 'aria-hidden': 'true' }),
      h('div', { class: 'wrap' },
        h('h1', null, h('span', { class: 'sr' }, 'נץ המדבר: '), h('span', { class: 'w w1' }, 'מהירות.'), ' ', h('span', { class: 'w w2' }, 'דיוק.'), ' ', h('span', { class: 'w w3' }, 'אתם.')),
        h('p', { class: 'lead r3' }, 'מועדון ירי מעשי נץ המדבר. קורס למתחילים, אימונים ותוצאות שרואים איך אתם משתפרים.'),
        h('div', { class: 'row cta r3' },
          h('a', { class: 'btn', href: '#/course' }, icon('target'), 'בקשה לקורס'),
          h('a', { class: 'btn ghost', href: '#/join' }, icon('user'), 'הצטרפות למועדון')))),
    h('div', { class: 'ticker', 'aria-hidden': 'true' }, h('div', { class: 'ticker-track marq', dir: 'ltr' }, ticker(strip), ticker(strip))),
    simulator(),
    h('section', { class: 'gallery-sec' }, h('div', { class: 'wrap' }, h('h2', null, 'מהשטח')),
      h('div', { class: 'gallery', tabindex: '0', 'aria-label': 'גלריה, אפשר לגלול הצידה' },
        gcard('g-events', '/news', 'חדשות המועדון'), gcard('g-officers', '/ipsc', 'מה זה IPSC?'), gcard('g-hero', '/course', 'קורס למתחילים'))),
    h('div', { class: 'wrap' },
      h('section', { class: 'section' }, h('h2', null, 'על המועדון'),
        h('p', { class: 'prose' }, 'דזרט פלקון הוא מועדון ירי מעשי הפועל בישראל, המוקדש לספורט, לאנשים ולקהילה. אנו מקדמים מצוינות אישית, בטיחות ותרבות ירי אחראית בסביבה מקצועית ותומכת.'),
        h('a', { class: 'btn ghost sm', href: '#/about' }, 'קראו עוד', icon('left'))),
      news.length ? h('section', { class: 'section' }, h('h2', null, 'חדשות אחרונות'),
        h('div', { class: 'grid two' }, news.slice(0, 2).map(newsCard))) : null,
      h('section', { class: 'section' }, h('h2', { class: 'section-title' }, icon('info'), 'שאלות נפוצות'),
        h('p', { class: 'muted' }, 'תשובות לשאלות הכי נפוצות על המועדון, הפעילות וההצטרפות.'),
        h('a', { class: 'btn ghost sm', href: '#/faq' }, 'קראו עוד', icon('left'))),
      h('section', { class: 'section' }, h('a', { class: 'alert note', href: state.user ? '#' + homeFor(state.user) : '#/login' }, icon('lock'), h('span', null, h('strong', null, 'אזור אישי לחברי המועדון. '), 'הרשמה לאימונים, תוצאות ומשוב מהמדריך.'))),
      socials() ? h('section', { class: 'section' }, socials()) : null));
}
const newsCard = n => h('article', { class: 'media-card' }, h('div', { class: 'img', role: 'img', 'aria-label': '' }),
  h('div', { class: 'body' }, h('span', { class: 'cat' }, CATS[n.category] || 'מועדון'), h('time', { class: 'small muted', datetime: n.created_at }, fmtDay(n.created_at)), h('h3', null, n.title), h('p', { class: 'muted' }, n.body)));

export function about() {
  const val = (ic, t, s) => h('div', { class: 'tile' }, icon(ic), h('b', null, t), h('span', null, s));
  return h('div', null, pageHero('על המועדון', 'נץ המדבר'),
    h('div', { class: 'wrap' }, h('div', { class: 'section prose' },
      h('h2', null, 'ספורט • קהילה • התקדמות'),
      h('p', null, 'נץ המדבר הוא מועדון ירי מעשי לפי כללי IPSC. אנחנו מאמינים בספורט מקצועי, בקהילה תומכת ובהתפתחות אישית של כל חבר ביחד עם המדריכים.'),
      h('p', null, 'המועדון מציע קורס למתחילים, אימונים שוטפים בהדרכת מדריכים ואזור אישי לחברים, שבו אפשר להירשם לאימונים, לראות תוצאות ולקבל משוב אישי.')),
    h('div', { class: 'photo-strip' },
      h('figure', null, h('img', { src: '/img/events.jpg', alt: 'מארגנים ושופטי טווח בתחרות IPSC', loading: 'lazy' }), h('figcaption', null, 'מהתחרויות והאירועים')),
      h('figure', null, h('img', { src: '/img/range-officers.jpg', alt: 'שני אנשי צוות בתחרות IPSC', loading: 'lazy' }), h('figcaption', null, 'קהילה ושופטי טווח'))),
    h('div', { class: 'section values' }, val('users', 'קהילה', 'אנשים שחולקים אותה תשוקה'), val('shield', 'בטיחות', 'תרבות של אחריות בכל אימון'), val('chart', 'מקצועיות', 'למידה, תרגול והתפתחות מתמדת')),
    h('div', { class: 'section card' }, h('h3', { class: 'section-title' }, icon('chat'), 'צרו איתנו קשר'), h('p', { class: 'muted' }, 'מוזמנים לעקוב אחרינו ולהישאר מעודכנים.'), socials() || h('p', { class: 'small muted' }, 'הקישורים יתווספו בקרוב.')),
    h('p', { class: 'row gap2' }, h('a', { class: 'btn', href: '#/course' }, 'בקשה לקורס'), h('a', { class: 'btn ghost', href: '#/join' }, 'הצטרפות למועדון'))));
}

export function ipsc() {
  const t = (ic, a, b) => h('div', { class: 'tile' }, icon(ic), h('b', null, a), h('span', null, b));
  return h('div', null, pageHero('מה זה IPSC?', 'קליעה דינמית מעשית'),
    h('div', { class: 'wrap' }, h('div', { class: 'section prose' },
      h('p', null, 'IPSC (קליעה דינמית מעשית) הוא ענף ספורט תחרותי המשלב דיוק, מהירות ועבודה טקטית, תוך התמודדות עם תרחישים מגוונים ומסלולים דינמיים.')),
    h('div', { class: 'grid tiles' }, t('timer', 'מהירות', 'זמן תגובה ויעילות תנועה'), t('bolt', 'עוצמה', 'שילוב של ביטחון וכושר תפעול'), t('target', 'דיוק', 'פגיעה מדויקת תחת לחץ')),
    h('div', { class: 'section card target-fig' }, h('img', { src: '/img/ipsc-target.svg', alt: 'מטרת IPSC עם אזורים A, C ו-D', loading: 'lazy' }),
      h('div', null, h('h3', null, 'איך מחשבים פגיעות'), h('p', { class: 'muted' }, 'המטרה מחולקת לאזורי ניקוד. ככל שהפגיעה קרובה יותר למרכז, היא שווה יותר.'),
        h('ul', { class: 'zone-list' }, h('li', null, h('b', null, 'A'), ' אזור המרכז, הניקוד הגבוה ביותר'), h('li', null, h('b', null, 'C'), ' האזור האמצעי'), h('li', null, h('b', null, 'D'), ' האזור החיצוני, הניקוד הנמוך ביותר')))),
    h('div', { class: 'section card' }, h('h3', null, 'ההיסטוריה של הענף'), h('p', { class: 'muted' }, 'IPSC הוקמה בשנת 1976 כארגון בינלאומי המאגד את ענף הקליעה הדינמית. בתוצאות תרגיל נרשמים זמן, פגיעות באזורי A, C ו־D והחטאות, והם אלה שמשמשים אותנו למעקב ההתקדמות באזור האישי.')),
    h('div', { class: 'section card' }, h('h3', { class: 'section-title' }, icon('globe'), 'משאבים רשמיים'),
      linkList('plain-list') || h('p', { class: 'muted' }, 'הקישורים יתווספו בקרוב.'))));
}

export function news() {
  const all = state.info.news;
  const list = h('div', { class: 'grid two gap' });
  let cat = '';
  const buttons = [['', 'הכל'], ['club', 'מועדון'], ['israel', 'ישראל'], ['world', 'עולם']].map(([k, l]) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(k === cat) }, l);
    b.onclick = () => { cat = k; buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); };
    return b;
  });
  const draw = () => { const items = all.filter(n => !cat || n.category === cat); list.replaceChildren(...(items.length ? items.map(newsCard) : [h('p', { class: 'muted' }, 'אין חדשות בקטגוריה הזו.')])); };
  draw();
  return h('div', null, pageHero('חדשות המועדון', 'עדכונים, כתבות וסיפורים מהשטח'), h('div', { class: 'wrap gap' }, h('div', { class: 'filters', role: 'group', 'aria-label': 'סינון לפי קטגוריה' }, buttons), list));
}

export function faq() {
  const q = (t, a) => h('details', { class: 'faq' }, h('summary', null, icon('info'), t), h('div', null, a));
  return h('div', null, pageHero('שאלות נפוצות', 'כל מה שחשוב לדעת על המועדון'), h('div', { class: 'wrap section prose' },
    q('איך נרשמים לקורס?', 'ממלאים את טופס "בקשה לקורס" עם שם וטלפון, ונציג המועדון יחזור אליכם.'),
    q('עברתי קורס. איך מצטרפים למועדון?', 'שולחים בקשת הצטרפות עם שם, טלפון וציון הקורס שעברתם. הבקשה נבדקת, ואישור החברות והפעלת החשבון נעשים בידי מנהל.'),
    q('איך משלמים?', 'התשלום מתבצע במקום בלבד. אין תשלום באתר.'),
    q('איך נכנסים לאזור האישי?', 'שם המשתמש הוא מספר הטלפון שמסרתם. את הסיסמה הראשונית מוסר המנהל, ובכניסה הראשונה מחליפים אותה.'),
    q('מה קורה אם האימון מלא?', 'אם ההרשמה פתוחה, אפשר להצטרף לרשימת המתנה. כשמתפנה מקום, הראשון בתור מקבל הודעה ויש לו זמן מוגבל לאשר אותו.'),
    q('שכחתי סיסמה', 'יש לפנות למנהל המועדון, שיאפס את הסיסמה ויסדיר סיסמה זמנית.')));
}

// ----- forms -----
function inquiryForm(type) {
  const isJoin = type === 'join';
  const alert = formAlert();
  const name = h('input', { type: 'text', name: 'name', autocomplete: 'name', maxlength: 60, required: true, placeholder: 'הכניסו שם מלא' });
  const phone = h('input', { type: 'tel', name: 'phone', autocomplete: 'tel', inputmode: 'tel', dir: 'ltr', placeholder: 'הכניסו מספר טלפון', required: true });
  const prev = isJoin ? h('input', { type: 'text', name: 'previous_course', maxlength: 200, placeholder: 'למשל: קורס בסיס, 2025' }) : null;
  const hp = h('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off' });
  const fName = field('שם מלא', name, { icon: icon('user') }), fPhone = field('טלפון נייד', phone, { icon: icon('phone'), hint: 'מספר נייד ישראלי, לדוגמה 050-1234567' });
  const fPrev = isJoin ? field('הקורס שעברתי', prev, { icon: icon('book'), hint: 'איפה ומתי עברתם קורס' }) : null;
  const box = h('div');
  const submit = h('button', { class: 'btn block', type: 'submit' }, isJoin ? 'שליחת בקשה' : 'שליחת פרטים', icon('left'));
  const form = h('form', { class: 'form', novalidate: true, onsubmit: async e => {
    e.preventDefault(); alert.show('');
    let bad = false;
    const nm = name.value.trim();
    fName.setError(nm.length < 2 ? 'יש להזין שם (לפחות 2 תווים)' : ''); bad ||= nm.length < 2;
    const ph = normalizePhone(phone.value);
    fPhone.setError(ph ? '' : 'מספר טלפון לא תקין. יש להזין מספר נייד ישראלי'); bad ||= !ph;
    if (isJoin) { const ok = prev.value.trim().length >= 2; fPrev.setError(ok ? '' : 'יש לציין את הקורס שעברתם'); bad ||= !ok; }
    if (bad) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    await busy(submit, async () => {
      try {
        await api('POST', '/api/inquiries', { type, name: nm, phone: ph, previous_course: isJoin ? prev.value.trim() : undefined, website: hp.value });
        box.replaceChildren(h('div', { class: 'alert ok', role: 'status', tabindex: '-1' },
          h('strong', null, 'תודה, הפרטים התקבלו. '),
          isJoin ? 'הבקשה נפתחה לבדיקה. אישור החברות והפעלת החשבון יתבצעו על ידי מנהל המועדון, והוא יחזור אליכם. התשלום מתבצע במקום בלבד.' : 'נציג המועדון יחזור אליכם בהקדם עם פרטי הקורס.'));
        box.firstChild.focus();
      } catch (err) { alert.show(err.message); }
    });
  } }, alert, fName, fPhone, fPrev, h('div', { class: 'hp', 'aria-hidden': 'true' }, h('label', null, 'אל תמלאו שדה זה', hp)), submit);
  box.append(form);
  return box;
}
export const course = () => h('div', null, pageHero('בקשה לקורס', 'צעד ראשון לעולם הירי המעשי'),
  h('div', { class: 'wrap section' }, h('div', { class: 'alert note' }, icon('shield'), 'השאירו שם וטלפון ונציג המועדון יחזור אליכם עם מועדי הקורס והתנאים. התשלום מתבצע במקום בלבד.'), inquiryForm('course')));
export const join = () => h('div', null, pageHero('הצטרפות למועדון', 'קהילה של מתאמנים ומתקדמים'),
  h('div', { class: 'wrap section' }, h('div', { class: 'alert note' }, icon('shield'), 'עברתם קורס? מלאו את הפרטים. הבקשה תיבדק, ומנהל המועדון יאשר את החברות ויפעיל את החשבון.'), inquiryForm('join'),
    socials() ? h('div', { class: 'gap2' }, h('p', { class: 'muted', style: null }, 'או הצטרפו אלינו ברשתות החברתיות'), socials()) : null));

export function login() {
  if (state.user) { go(homeFor(state.user)); return h('div'); }
  const alert = formAlert();
  const phone = h('input', { type: 'tel', name: 'username', autocomplete: 'username', inputmode: 'tel', dir: 'ltr', required: true, placeholder: 'הכניסו מספר טלפון' });
  const pw = h('input', { type: 'password', name: 'password', autocomplete: 'current-password', required: true, placeholder: 'הכניסו סיסמה' });
  const fPhone = field('מספר טלפון', phone, { icon: icon('phone') });
  const fPw = field('סיסמה', pw, { icon: icon('lock') });
  const eye = h('button', { class: 'toggle', type: 'button', 'aria-label': 'הצגת סיסמה', 'aria-pressed': 'false' }, icon('eye'));
  eye.onclick = () => { const show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; eye.setAttribute('aria-pressed', String(show)); eye.replaceChildren(icon(show ? 'eyeoff' : 'eye')); };
  fPw.querySelector('.ctl').append(eye);
  const submit = h('button', { class: 'btn block', type: 'submit' }, 'כניסה', icon('left'));
  const forgot = h('button', { class: 'pill', type: 'button', style: null }, 'שכחתי סיסמה');
  forgot.onclick = () => dialog((d, close) => { d.append(h('h3', null, 'שכחתם סיסמה?'), h('p', null, 'יש לפנות למנהל המועדון. הוא יאפס את הסיסמה ויסדיר לכם סיסמה זמנית, שאותה תחליפו בכניסה הראשונה.'), h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => close(true) }, 'הבנתי'))); });
  return h('div', null, pageHero('כניסה לאזור האישי', 'גישה לאימונים ולרישום לחברי מועדון'),
    h('div', { class: 'wrap section' }, h('form', { class: 'form', novalidate: true, onsubmit: async e => {
      e.preventDefault(); alert.show('');
      const ph = normalizePhone(phone.value);
      fPhone.setError(ph ? '' : 'יש להזין מספר טלפון נייד תקין'); fPw.setError(pw.value ? '' : 'יש להזין סיסמה');
      if (!ph || !pw.value) return;
      await busy(submit, async () => {
        try {
          const r = await api('POST', '/api/auth/login', { phone: ph, password: pw.value });
          state.user = r.user; state.section = null; pw.value = '';
          window.dispatchEvent(new Event('df:session'));
          go(r.user.must_change_pw ? '/password' : homeFor(r.user));
        } catch (err) { alert.show(err.message); pw.value = ''; pw.focus(); }
      });
    } }, alert, fPhone, fPw, submit, h('div', null, forgot),
      h('p', { class: 'small muted' }, icon('lock'), ' הגישה לאימונים ולרישום מיועדת לחברי מועדון פעילים בלבד.')),
    h('p', { class: 'gap2' }, 'עדיין לא חברים? ', h('a', { href: '#/join' }, 'הצטרפות למועדון'), ' · ', h('a', { href: '#/course' }, 'בקשה לקורס'))));
}
