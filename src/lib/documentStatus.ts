export interface DocumentStatus {
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing';
  label: string;
  daysRemaining?: number;
  badgeClass: string;
}

/**
 * Evaluates the status of an expiry date string (YYYY-MM-DD)
 */
export function getDocumentStatus(dateString?: string): DocumentStatus {
  if (!dateString || !dateString.trim()) {
    return {
      status: 'missing',
      label: 'טרם עודכן',
      badgeClass: 'bg-graphite-100 text-graphite-600 border border-graphite-200'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryDate = new Date(dateString);
  expiryDate.setHours(0, 0, 0, 0);

  if (isNaN(expiryDate.getTime())) {
    return {
      status: 'missing',
      label: 'תאריך לא תקין',
      badgeClass: 'bg-graphite-100 text-graphite-600 border border-graphite-200'
    };
  }

  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      label: `פג תוקף (${Math.abs(daysRemaining)} ימים)`,
      daysRemaining,
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'expiring_soon',
      label: `פג בעוד ${daysRemaining} יום`,
      daysRemaining,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse'
    };
  }

  return {
    status: 'valid',
    label: `בתוקף (עד ${dateString})`,
    daysRemaining,
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold'
  };
}

/**
 * Checks if a user has any expired or expiring documents
 */
export function checkUserDocuments(user: {
  firearmLicenseExpiry?: string;
  healthDeclarationExpiry?: string;
  insuranceExpiry?: string;
}) {
  const license = getDocumentStatus(user.firearmLicenseExpiry);
  const health = getDocumentStatus(user.healthDeclarationExpiry);
  const insurance = getDocumentStatus(user.insuranceExpiry);

  const hasExpired = license.status === 'expired' || health.status === 'expired' || insurance.status === 'expired';
  const hasExpiringSoon = license.status === 'expiring_soon' || health.status === 'expiring_soon' || insurance.status === 'expiring_soon';

  return {
    license,
    health,
    insurance,
    hasExpired,
    hasExpiringSoon,
    isCompliant: !hasExpired
  };
}
