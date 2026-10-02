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
  matchUrl: string; // End of Scoring direct link or match registration portal
  resultsUrl?: string; // End of Scoring live or official match results
  description: string;
  podium?: MatchPodiumEntry[];
  clubHighlights?: string[];
  bannerUrl?: string;
}

export const INITIAL_IPSC_MATCHES: IPSCMatch[] = [
  {
    id: 'match-eos-2026-south-l2',
    title: 'אליפות מחוז דרום Level II — גביע נץ המדבר',
    level: 'Level II',
    date: '2026-10-24',
    time: '08:00 - 15:00',
    location: 'מטווח נץ המדבר, מתחם מול 7, שדרות',
    locationMapUrl: 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%A0%D7%A5+%D7%94%D7%9E%D7%93%D7%91%D7%A8+%D7%A9%D7%93%D7%A8%D7%95%D7%AA',
    organizer: 'מועדון נץ המדבר בשיתוף התאחדות הקליעה',
    stagesCount: 8,
    minRounds: 175,
    registrationStatus: 'open',
    matchUrl: 'https://www.endofscoring.com/',
    resultsUrl: 'https://www.endofscoring.com/',
    description: 'תחרות Level II רשמית של התאחדות הקליעה בישראל. 8 תרגילים טקטיים מאתגרים כולל מטרות נעות, חלונות ירי ומעברים דינמיים. סקוואדים של 12 יורים.',
    clubHighlights: [
      'חברי מועדון נץ המדבר מתחרים בסקוואדים 1, 3 ו-4',
      'תדריך שופטים (RO Briefing) יחל בשעה 07:30'
    ]
  },
  {
    id: 'match-eos-2026-open-l3',
    title: 'Israel National Open Level III — גביע המדינה 2026',
    level: 'Level III',
    date: '2026-11-14',
    time: '07:30 - 17:00',
    location: 'מטווח מאיר כפר סבא',
    locationMapUrl: 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%9E%D7%90%D7%99%D7%A8+%D7%9B%D7%A4%D7%A8+%D7%A1%D7%91%D7%90',
    organizer: 'התאחדות הקליעה בישראל',
    stagesCount: 14,
    minRounds: 290,
    registrationStatus: 'opening_soon',
    registrationOpensDate: '2026-10-15',
    matchUrl: 'https://www.endofscoring.com/',
    description: 'תחרות הדגל השנתית ברמת Level III. 14 תרגילים ברמה בינלאומית עם השתתפות טובי היורים בישראל ומשלחות מחו"ל. הניקוד מוזן בשידור חי ב-End of Scoring.',
    clubHighlights: [
      'נבחרת המועדון מייצגת במחלקות Production Optics ו-Standard',
      'ההרשמה למקצים מוגבלת ל-150 יורים בלבד'
    ]
  },
  {
    id: 'match-eos-2026-autumn-cup',
    title: 'גביע הסתיו Level I — ליגת המועדונים',
    level: 'Level I',
    date: '2026-09-18',
    time: '08:30 - 14:00',
    location: 'מטווח נץ המדבר, מתחם מול 7, שדרות',
    locationMapUrl: 'https://waze.com/ul?q=%D7%9E%D7%98%D7%95%D7%95%D7%97+%D7%A0%D7%A5+%D7%94%D7%9E%D7%93%D7%91%D7%A8+%D7%A9%D7%93%D7%A8%D7%95%D7%AA',
    organizer: 'מועדון נץ המדבר',
    stagesCount: 5,
    minRounds: 110,
    registrationStatus: 'completed',
    matchUrl: 'https://www.endofscoring.com/',
    resultsUrl: 'https://www.endofscoring.com/',
    description: 'תחרות מועדונים מותחת שהתקיימה במטווח שדרות עם 45 יורים מכל רחבי הארץ. הישגים מרשימים ליורי נץ המדבר בכל הדיוויז\'נים!',
    podium: [
      {
        division: 'Production Optics',
        first: { name: 'דן שגב', club: 'נץ המדבר 🦅', points: 485.2, percentage: 100.0 },
        second: { name: 'רונן לוי', club: 'נץ המדבר 🦅', points: 452.8, percentage: 93.3 },
        third: { name: 'אלון ברק', club: 'קליעה כפר סבא', points: 418.4, percentage: 86.2 }
      },
      {
        division: 'Standard',
        first: { name: 'מיכאל כהן', club: 'אלפס מרכז', points: 510.0, percentage: 100.0 },
        second: { name: 'דניאל קליין', club: 'נץ המדבר 🦅', points: 489.1, percentage: 95.9 },
        third: { name: 'איתי שחר', club: 'ירי מעשי צפון', points: 460.5, percentage: 90.3 }
      },
      {
        division: 'Production',
        first: { name: 'יוסי אברהם', club: 'מועדון שפלה', points: 470.0, percentage: 100.0 },
        second: { name: 'עומר גל', club: 'נץ המדבר 🦅', points: 448.9, percentage: 95.5 },
        third: { name: 'עידו לוין', club: 'קליעה ירושלים', points: 412.3, percentage: 87.7 }
      }
    ],
    clubHighlights: [
      '🥇 מקום 1 ב-Production Optics: דן שגב (נץ המדבר)',
      '🥈 מקום 2 ב-Production Optics: רונן לוי (נץ המדבר)',
      '🥈 מקום 2 ב-Standard: דניאל קליין (נץ המדבר)',
      '🥈 מקום 2 ב-Production: עומר גל (נץ המדבר)'
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
