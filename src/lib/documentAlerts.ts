import { User } from '../types';
import { getDocumentStatus } from './documentStatus';
import { getWhatsAppUrl } from './whatsapp';

export type AlertSeverity = 'expired' | 'urgent_14d' | 'expiring_30d' | 'expiring_60d' | 'missing';
export type DocType = 'firearmLicense' | 'healthDeclaration' | 'insurance';

export interface DocumentAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  docType: DocType;
  docTitleHebrew: string;
  expiryDate?: string;
  daysRemaining?: number;
  severity: AlertSeverity;
  badgeLabel: string;
  badgeClass: string;
  renewalUrl?: string;
  actionGuide: string;
}

export interface ComplianceSummary {
  totalUsers: number;
  compliantUsers: number;
  urgentUsers: number;
  expiringSoonUsers: number;
  expiredUsers: number;
  alerts: DocumentAlert[];
}

const GOV_FIREARM_RENEWAL_URL = 'https://www.gov.il/he/service/firearm-license-renewal';
const SPORTS_INSURANCE_INFO_URL = 'https://www.israelsports.org.il/';

export function evaluateUserAlerts(user: User): DocumentAlert[] {
  const alerts: DocumentAlert[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const docConfigs: Array<{
    type: DocType;
    title: string;
    expiry?: string;
    renewalUrl?: string;
    actionGuide: string;
  }> = [
    {
      type: 'firearmLicense',
      title: 'רישיון כלי ירייה',
      expiry: user.firearmLicenseExpiry,
      renewalUrl: GOV_FIREARM_RENEWAL_URL,
      actionGuide: 'חידוש מקוון באגף לרישוי כלי ירייה (Gov.il) או ביצוע מטווח רענון / כשירות.'
    },
    {
      type: 'healthDeclaration',
      title: 'הצהרת בריאות / בדיקה ארגומטרית',
      expiry: user.healthDeclarationExpiry,
      actionGuide: 'חתימה על הצהרת בריאות שנתית או ביצוע בדיקת מאמץ במכון מוסמך לפי חוק הספורט.'
    },
    {
      type: 'insurance',
      title: 'ביטוח ספורט תחרותי / חברות בהתאחדות',
      expiry: user.insuranceExpiry,
      renewalUrl: SPORTS_INSURANCE_INFO_URL,
      actionGuide: 'תשלום דמי חברות וביטוח ספורטאים שנתי דרך מועדון הירי והתאחדות הקליעה.'
    }
  ];

  for (const doc of docConfigs) {
    if (!doc.expiry || !doc.expiry.trim()) {
      alerts.push({
        id: `${user.id}-${doc.type}-missing`,
        userId: user.id,
        userName: user.fullName || user.username || 'יורה',
        userPhone: user.phone || '',
        docType: doc.type,
        docTitleHebrew: doc.title,
        severity: 'missing',
        badgeLabel: 'טרם עודכן',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        renewalUrl: doc.renewalUrl,
        actionGuide: doc.actionGuide
      });
      continue;
    }

    const expiryDate = new Date(doc.expiry);
    expiryDate.setHours(0, 0, 0, 0);

    if (isNaN(expiryDate.getTime())) continue;

    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alerts.push({
        id: `${user.id}-${doc.type}-expired`,
        userId: user.id,
        userName: user.fullName || user.username || 'יורה',
        userPhone: user.phone || '',
        docType: doc.type,
        docTitleHebrew: doc.title,
        expiryDate: doc.expiry,
        daysRemaining: diffDays,
        severity: 'expired',
        badgeLabel: `פג תוקף לפני ${Math.abs(diffDays)} ימים!`,
        badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
        renewalUrl: doc.renewalUrl,
        actionGuide: doc.actionGuide
      });
    } else if (diffDays <= 14) {
      alerts.push({
        id: `${user.id}-${doc.type}-urgent`,
        userId: user.id,
        userName: user.fullName || user.username || 'יורה',
        userPhone: user.phone || '',
        docType: doc.type,
        docTitleHebrew: doc.title,
        expiryDate: doc.expiry,
        daysRemaining: diffDays,
        severity: 'urgent_14d',
        badgeLabel: `דחוף! יפוג בעוד ${diffDays} ימים`,
        badgeClass: 'bg-rose-50 text-rose-900 border border-rose-400 font-bold animate-pulse',
        renewalUrl: doc.renewalUrl,
        actionGuide: doc.actionGuide
      });
    } else if (diffDays <= 30) {
      alerts.push({
        id: `${user.id}-${doc.type}-30d`,
        userId: user.id,
        userName: user.fullName || user.username || 'יורה',
        userPhone: user.phone || '',
        docType: doc.type,
        docTitleHebrew: doc.title,
        expiryDate: doc.expiry,
        daysRemaining: diffDays,
        severity: 'expiring_30d',
        badgeLabel: `יפוג בעוד ${diffDays} ימים`,
        badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
        renewalUrl: doc.renewalUrl,
        actionGuide: doc.actionGuide
      });
    } else if (diffDays <= 60) {
      alerts.push({
        id: `${user.id}-${doc.type}-60d`,
        userId: user.id,
        userName: user.fullName || user.username || 'יורה',
        userPhone: user.phone || '',
        docType: doc.type,
        docTitleHebrew: doc.title,
        expiryDate: doc.expiry,
        daysRemaining: diffDays,
        severity: 'expiring_60d',
        badgeLabel: `לתשומת לב: יפוג בעוד ${diffDays} ימים`,
        badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200',
        renewalUrl: doc.renewalUrl,
        actionGuide: doc.actionGuide
      });
    }
  }

  return alerts;
}

export function scanClubCompliance(users: User[]): ComplianceSummary {
  const activeMembers = users.filter(u => u.membershipStatus !== 'suspended' && u.role !== 'guest');
  const allAlerts: DocumentAlert[] = [];
  
  let compliantUsers = 0;
  let urgentUsers = 0;
  let expiringSoonUsers = 0;
  let expiredUsers = 0;

  for (const member of activeMembers) {
    const alerts = evaluateUserAlerts(member);
    allAlerts.push(...alerts);

    const hasExpired = alerts.some(a => a.severity === 'expired');
    const hasUrgent = alerts.some(a => a.severity === 'urgent_14d');
    const hasExpiringSoon = alerts.some(a => a.severity === 'expiring_30d' || a.severity === 'expiring_60d');

    if (hasExpired) {
      expiredUsers++;
    } else if (hasUrgent) {
      urgentUsers++;
    } else if (hasExpiringSoon) {
      expiringSoonUsers++;
    } else {
      compliantUsers++;
    }
  }

  return {
    totalUsers: activeMembers.length,
    compliantUsers,
    urgentUsers,
    expiringSoonUsers,
    expiredUsers,
    alerts: allAlerts
  };
}

/**
 * Prepares a customized, friendly WhatsApp reminder message in Hebrew
 */
export function createDocumentWhatsAppReminder(alert: DocumentAlert): string {
  const expiryFormatted = alert.expiryDate 
    ? new Date(alert.expiryDate).toLocaleDateString('he-IL') 
    : 'תאריך לא מעודכן';

  let timeMsg = '';
  if (alert.severity === 'expired') {
    timeMsg = `❌ *פג תוקף* (${expiryFormatted}). על פי נהלי בטיחות ורגולציה לא ניתן להשתתף באימונים עד הסדרת המסמך.`;
  } else if (alert.severity === 'urgent_14d') {
    timeMsg = `⚠️ *דחוף: יפוג בעוד ${alert.daysRemaining} ימים בלבד* (בתאריך ${expiryFormatted}).`;
  } else if (alert.severity === 'missing') {
    timeMsg = `📋 *טרם הוזן תוקף במערכת*. אנא עדכן את התאריך בהקדם.`;
  } else {
    timeMsg = `⏳ *יפוג בעוד ${alert.daysRemaining} ימים* (בתאריך ${expiryFormatted}).`;
  }

  let text = `שלום *${alert.userName}*, תזכורת חמה ממועדון ירי מעשי נץ המדבר 🦅\n\n`;
  text += `נושא: *${alert.docTitleHebrew}*\n`;
  text += `${timeMsg}\n\n`;
  text += `📌 *הנחיות לפעולה:*\n${alert.actionGuide}\n\n`;

  if (alert.renewalUrl) {
    text += `🔗 *קישור ישיר לחידוש:*\n${alert.renewalUrl}\n\n`;
  }

  text += `לאחר השלמת החידוש ניתן להעלות או לעדכן את התאריך ישירות באזור האישי באפליקציית המועדון:\nhttps://ipsc.magavnegev.co.il\n\nבברכה,\nצוות נץ המדבר 🎯`;

  return text;
}
