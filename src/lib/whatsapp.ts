import { TrainingSession, Registration, User } from '../types';

/**
 * Normalizes an Israeli phone number to international wa.me format (972...)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '972' + digits.slice(1);
  }
  if (digits.startsWith('972')) {
    return digits;
  }
  return digits;
}

/**
 * Generates WhatsApp URL with pre-filled message
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates welcome & credentials message for a newly created or reset user
 */
export function createCredentialsWhatsAppMessage(user: Partial<User>, tempPassword?: string, activationUrl?: string): string {
  const name = user.fullName || 'חבר מועדון';
  const phone = user.phone || '';
  
  let msg = `שלום ${name},
ברוך הבא למערכת מועדון הירי מעשי *נץ המדבר*! 🦅🎯

פרטי הכניסה האישיים שלך לאזור האישי:
📱 *טלפון לכניסה:* ${phone}
`;

  if (tempPassword) {
    msg += `🔑 *סיסמה זמנית:* ${tempPassword}
🔒 *שימו לב:* בכניסה הראשונה המערכת תבקש מכם לקבוע סיסמה אישית חדשה.
`;
  } else if (activationUrl) {
    msg += `🔗 *קישור הפעלה אישי:* ${activationUrl}
`;
  }

  msg += `
🌐 *כניסה למערכת:* https://ipsc.magavnegev.co.il

נשמח לראותך באימונים הבאים!
צוות נץ המדבר`;

  return msg;
}

/**
 * Formats a training squad roster for WhatsApp sharing
 */
export function createTrainingSquadWhatsAppMessage(
  training: TrainingSession,
  registrations: Registration[]
): string {
  const confirmed = registrations.filter(r => r.trainingId === training.id && r.status === 'confirmed');
  const waitlist = registrations.filter(r => r.trainingId === training.id && r.status === 'waitlist');

  let msg = `🦅 *מועדון ירי מעשי נץ המדבר*
🎯 *רשימת משתתפים לאימון:* ${training.title}
━━━━━━━━━━━━━━━━━━━━
📅 *תאריך:* ${training.date}
⏰ *שעות:* ${training.startTime} - ${training.endTime}
📍 *מיקום:* ${training.location}
👨‍🏫 *מדריכים:* ${training.instructorNames.join(', ') || 'מדריכי המועדון'}
━━━━━━━━━━━━━━━━━━━━

👥 *רשומים (${confirmed.length}/${training.maxCapacity}):*
`;

  if (confirmed.length === 0) {
    msg += `(טרם נרשמו יורים)\n`;
  } else {
    confirmed.forEach((r, idx) => {
      msg += `${idx + 1}. ${r.userName} (${r.userPhone})\n`;
    });
  }

  if (waitlist.length > 0) {
    msg += `\n⏳ *רשימת המתנה (${waitlist.length}):*\n`;
    waitlist.forEach((r, idx) => {
      msg += `${idx + 1}. ${r.userName} (${r.userPhone})\n`;
    });
  }

  msg += `
נא להגיע כ-10 דקות לפני תחילת התדריך עם ציוד ירי מלא ורישיונות בתוקף.
נתראה במטווח! 💥`;

  return msg;
}
