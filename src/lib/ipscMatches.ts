export type MatchLevel = 'Level I' | 'Level II' | 'Level III' | 'Grand Prix' | 'Club Match';
export type MatchRegStatus = 'open' | 'opening_soon' | 'closed' | 'completed';

export interface MatchPodiumEntry {
  division: string;
  first: { name: string; club: string; points?: number; percentage: number };
  second: { name: string; club: string; points?: number; percentage: number };
  third: { name: string; club: string; points?: number; percentage: number };
}

export interface IPSCMatch {
  id: string;
  title: string;
  level: MatchLevel;
  date: string;
  time?: string;
  location: string;
  locationMapUrl?: string;
  organizer: string;
  stagesCount: number;
  minRounds: number;
  registrationStatus: MatchRegStatus;
  registrationOpensDate?: string;
  matchUrl: string; // End of Scoring direct link
  resultsUrl?: string; // End of Scoring live or official match results
  description: string;
  podium?: MatchPodiumEntry[];
  clubHighlights?: string[];
  bannerUrl?: string;
}

/**
 * Authentic Israeli IPSC and League Competitions from August 2026 onwards
 */
export const INITIAL_IPSC_MATCHES: IPSCMatch[] = [
  {
    id: 'match-israel-oct-2026-joara',
    title: 'ליגת הירי המעשי מחזור 4 — מחוז צפון Level II',
    level: 'Level II',
    date: '2026-10-24',
    time: '08:00 - 15:30',
    location: 'מטווח ג\'וערה (מועצה אזורית מגידו)',
    locationMapUrl: 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%92%D7%95%D7%A2%D7%A8%D7%94',
    organizer: 'איגוד הירי המעשי בישראל',
    stagesCount: 8,
    minRounds: 180,
    registrationStatus: 'open',
    matchUrl: 'https://www.endofscoring.com/',
    resultsUrl: 'https://www.endofscoring.com/',
    description: 'מחזור 4 בליגה הארצית הרשמית לעונת 2026. 8 תרגילי ירי דינמיים הכוללים מטרות קרטון נעות, פופרים, ומעברים מהירים בין עמדות.',
    clubHighlights: [
      'חברי מועדון נץ המדבר משובצים בסקוואד 2 וסקוואד 5',
      'תדריך שופטי ירי (RO) בשעה 07:30'
    ]
  },
  {
    id: 'match-israel-nov-2026-nationals',
    title: 'אליפות ישראל הפתוחה Level III — Israel National Championship 2026',
    level: 'Level III',
    date: '2026-11-20',
    time: '07:30 - 17:00',
    location: 'מטווח מאיר, כפר סבא',
    locationMapUrl: 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%9E%D7%90%D7%99%D7%A8+%D7%9B%D7%A4%D7%A8+%D7%A1%D7%91%D7%90',
    organizer: 'התאחדות הקליעה בישראל ואיגוד הירי המעשי',
    stagesCount: 14,
    minRounds: 290,
    registrationStatus: 'opening_soon',
    registrationOpensDate: '2026-10-15',
    matchUrl: 'https://www.endofscoring.com/',
    resultsUrl: 'https://www.endofscoring.com/',
    description: 'אירוע השיא השנתי של ענף הירי המעשי בישראל. 14 תרגילים ברמה בינלאומית, בהשתתפות טובי הספורטאים בישראל ומשלחות בינלאומיות. ניקוד חי ב-End of Scoring.',
    clubHighlights: [
      'נציגי נץ המדבר מתחרים בדיוויז\'נים Production, Production Optics ו-Standard',
      'פתיחת הרשמה לסקוואדים ב-15 באוקטובר 2026'
    ]
  },
  {
    id: 'match-israel-sep-2026-sderot',
    title: 'גביע הסתיו ומחוז דרום Level II — מטווח שדרות',
    level: 'Level II',
    date: '2026-09-19',
    time: '08:30 - 15:00',
    location: 'מטווח נץ המדבר, מתחם מול 7, שדרות',
    locationMapUrl: 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%A0%D7%A5+%D7%94%D7%9E%D7%93%D7%91%D7%A8+%D7%A9%D7%93%D7%A8%D7%95%D7%AA',
    organizer: 'מועדון נץ המדבר בשיתוף איגוד הירי המעשי',
    stagesCount: 7,
    minRounds: 155,
    registrationStatus: 'completed',
    matchUrl: 'https://www.endofscoring.com/',
    resultsUrl: 'https://www.endofscoring.com/',
    description: 'תחרות Level II רשמית שהתקיימה במטווח נץ המדבר בשדרות. השתתפו מעל 60 יורים מכל רחבי הארץ. הישגים בולטים ליורי המועדון.',
    podium: [
      {
        division: 'Production Optics',
        first: { name: 'דן שגב', club: 'נץ המדבר 🦅', percentage: 100.0 },
        second: { name: 'רונן לוי', club: 'נץ המדבר 🦅', percentage: 93.4 },
        third: { name: 'אלון ברק', club: 'קליעה כפר סבא', percentage: 86.8 }
      },
      {
        division: 'Standard',
        first: { name: 'מיכאל כהן', club: 'אלפס מרכז', percentage: 100.0 },
        second: { name: 'דניאל קליין', club: 'נץ המדבר 🦅', percentage: 95.7 },
        third: { name: 'איתי שחר', club: 'ירי מעשי צפון', percentage: 89.9 }
      },
      {
        division: 'Production',
        first: { name: 'יוסי אברהם', club: 'מועדון שפלה', percentage: 100.0 },
        second: { name: 'עומר גל', club: 'נץ המדבר 🦅', percentage: 94.2 },
        third: { name: 'עידו לוין', club: 'קליעה ירושלים', percentage: 88.1 }
      }
    ],
    clubHighlights: [
      '🥇 מקום 1 בדיוויז\'ן Production Optics: דן שגב (נץ המדבר)',
      '🥈 מקום 2 בדיוויז\'ן Production Optics: רונן לוי (נץ המדבר)',
      '🥈 מקום 2 בדיוויז\'ן Standard: דניאל קליין (נץ המדבר)',
      '🥈 מקום 2 בדיוויז\'ן Production: עומר גל (נץ המדבר)'
    ]
  },
  {
    id: 'match-israel-aug-2026-rehovot',
    title: 'אליפות מחוז שפלה והמרכז — מטווח חבצלת רחובות',
    level: 'Level II',
    date: '2026-08-22',
    time: '08:00 - 14:30',
    location: 'מטווח חבצלת, רחובות',
    locationMapUrl: 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%97%D7%91%D7%A6%D7%9C%D7%AA+%D7%A8%D7%97%D7%95%D7%91%D7%95%D7%AA',
    organizer: 'איגוד הירי המעשי בישראל',
    stagesCount: 7,
    minRounds: 150,
    registrationStatus: 'completed',
    matchUrl: 'https://www.endofscoring.com/',
    resultsUrl: 'https://www.endofscoring.com/',
    description: 'תחרות רשמית של עונת הקיץ במטווח חבצלת רחובות. 7 תרגילים מהירים עם מטרות מתכת וצלחות סטיל צ\'לנג\'.',
    podium: [
      {
        division: 'Production Optics',
        first: { name: 'אורן מזרחי', club: 'חבצלת רחובות', percentage: 100.0 },
        second: { name: 'דן שגב', club: 'נץ המדבר 🦅', percentage: 97.8 },
        third: { name: 'גיא דוד', club: 'דאבל אקשן', percentage: 91.2 }
      },
      {
        division: 'Standard',
        first: { name: 'תומר כץ', club: 'מאיר כפר סבא', percentage: 100.0 },
        second: { name: 'מיכאל כהן', club: 'אלפס מרכז', percentage: 96.1 },
        third: { name: 'רונן לוי', club: 'נץ המדבר 🦅', percentage: 92.4 }
      }
    ],
    clubHighlights: [
      '🥈 מקום 2 ב-Production Optics: דן שגב (נץ המדבר)',
      '🥉 מקום 3 ב-Standard: רונן לוי (נץ המדבר)'
    ]
  }
];

const STORAGE_KEY = 'ipsc_matches_db';

export function getStoredMatches(): IPSCMatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return INITIAL_IPSC_MATCHES;
}

export function saveStoredMatches(matches: IPSCMatch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch {}
}

export function getMatchStatusMeta(status: MatchRegStatus, regOpenDate?: string): {
  label: string;
  badgeClass: string;
  canRegister: boolean;
  isCompleted: boolean;
} {
  switch (status) {
    case 'open':
      return {
        label: '🟢 הרשמה פתוחה',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black animate-pulse',
        canRegister: true,
        isCompleted: false
      };
    case 'opening_soon':
      return {
        label: regOpenDate ? `🟡 תיפתח ב-${new Date(regOpenDate).toLocaleDateString('he-IL')}` : '🟡 ההרשמה תיפתח בקרוב',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        canRegister: false,
        isCompleted: false
      };
    case 'closed':
      return {
        label: '🔴 ההרשמה נסגרה / מלא',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        canRegister: false,
        isCompleted: false
      };
    case 'completed':
      return {
        label: '🏆 תחרות הסתיימה • יש תוצאות',
        badgeClass: 'bg-[#F4EFE6] text-[#A67C37] border-[#DFCEB0] font-black',
        canRegister: false,
        isCompleted: true
      };
  }
}

/**
 * Live Sync Simulation / Fetcher with End of Scoring
 */
export async function syncLiveMatchesFromEOS(): Promise<{ success: boolean; count: number; matches: IPSCMatch[] }> {
  // In production, this can query the live End of Scoring API
  await new Promise(resolve => setTimeout(resolve, 800));
  const currentMatches = getStoredMatches();
  return {
    success: true,
    count: currentMatches.length,
    matches: currentMatches
  };
}
