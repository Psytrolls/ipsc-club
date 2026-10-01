import { User, ExerciseResult, Registration } from '../types';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'accuracy' | 'speed' | 'dedication' | 'safety';
  unlocked: boolean;
  progressText?: string;
}

export function evaluateShooterBadges(
  user: User,
  results: ExerciseResult[],
  registrations: Registration[]
): Badge[] {
  const attendedCount = registrations.filter(r => r.attendance === 'attended').length;
  
  // 1. Alpha Sniper: At least one result with >= 85% Alpha accuracy
  const hasHighAlpha = results.some(r => {
    const total = r.hitsA + r.hitsC + r.hitsD + r.misses;
    return total >= 10 && (r.hitsA / total) >= 0.85;
  });

  // 2. Clean Run: At least one stage with zero misses and zero no-shoots (min 12 shots)
  const hasCleanRun = results.some(r => {
    const total = r.hitsA + r.hitsC + r.hitsD;
    return total >= 12 && r.misses === 0 && (r.noShootHits || 0) === 0 && (r.procedurals || 0) === 0;
  });

  // 3. High Factor: Hit factor >= 6.5 in any stage
  const hasHighHf = results.some(r => r.hitFactor >= 6.5);

  // 4. Club Veteran: Attended 5 or more trainings
  const isVeteran = attendedCount >= 5;

  // 5. Speed Master: Stage time under 12 seconds with at least 16 shots and clean hits
  const isSpeedMaster = results.some(r => {
    const total = r.hitsA + r.hitsC + r.hitsD;
    return total >= 16 && r.timeSeconds > 0 && r.timeSeconds <= 12.0 && r.misses === 0;
  });

  // 6. Perfect Compliance: All documents verified & valid
  const isCompliant = Boolean(
    user.firearmLicenseExpiry && 
    user.healthDeclarationExpiry && 
    user.insuranceExpiry &&
    new Date(user.firearmLicenseExpiry) > new Date() &&
    new Date(user.healthDeclarationExpiry) > new Date() &&
    new Date(user.insuranceExpiry) > new Date()
  );

  return [
    {
      id: 'alpha-sniper',
      title: 'צלף אלפא (Alpha Sniper)',
      description: 'השגת מעל 85% פגיעות אלפא בתרגיל',
      icon: '🎯',
      category: 'accuracy',
      unlocked: hasHighAlpha,
      progressText: hasHighAlpha ? 'הושלם!' : 'דורש 85% פגיעות A בתרגיל עם 10+ כדורים',
    },
    {
      id: 'clean-run',
      title: 'מקצה נקי (Clean Run)',
      description: 'סיום תרגיל של 12+ כדורים ללא שום החטאה או ענישה',
      icon: '✨',
      category: 'accuracy',
      unlocked: hasCleanRun,
      progressText: hasCleanRun ? 'הושלם!' : '0 החטאות ו-0 ענישות בתרגיל',
    },
    {
      id: 'high-factor',
      title: 'Hit Factor 6.5+',
      description: 'הגעה ל-Hit Factor של 6.5 ומעלה בתרגיל רשמי',
      icon: '🚀',
      category: 'speed',
      unlocked: hasHighHf,
      progressText: hasHighHf ? 'הושלם!' : 'קביעת HF מעל 6.5 באימון',
    },
    {
      id: 'speed-master',
      title: 'מאסטר מהירות (Speed Master)',
      description: 'סיום תרגיל בינוני (16+ כדורים) בפחות מ-12 שניות ללא החטאה',
      icon: '⚡',
      category: 'speed',
      unlocked: isSpeedMaster,
      progressText: isSpeedMaster ? 'הושלם!' : 'מתחת ל-12 שניות בתרגיל של 16+ כדורים',
    },
    {
      id: 'club-regular',
      title: 'מתמיד המועדון (Club Regular)',
      description: 'השתתפות ב-5 אימונים או יותר במועדון',
      icon: '🏆',
      category: 'dedication',
      unlocked: isVeteran,
      progressText: `${attendedCount}/5 אימונים`,
    },
    {
      id: 'safety-master',
      title: 'בטיחות ורישוי (Safety First)',
      description: 'כל מסמכי היורה (רישיון, בריאות, ביטוח) מעודכנים ובתוקף',
      icon: '🛡️',
      category: 'safety',
      unlocked: isCompliant,
      progressText: isCompliant ? 'כל המסמכים בתוקף' : 'יש לעדכן תוקף מסמכים',
    },
  ];
}
