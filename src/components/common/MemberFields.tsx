import React from 'react';
import { User } from '../../types';
import { getDocumentStatus } from '../../lib/documentStatus';
import { ShieldCheck, HeartPulse, FileBadge } from 'lucide-react';

export const MemberFields: React.FC<{
  value: Partial<User>;
  onChange: (next: Partial<User>) => void;
  showDocuments?: boolean;
}> = ({ value, onChange, showDocuments = true }) => {
  const licenseStatus = getDocumentStatus(value.firearmLicenseExpiry);
  const healthStatus = getDocumentStatus(value.healthDeclarationExpiry);
  const insuranceStatus = getDocumentStatus(value.insuranceExpiry);

  return (
    <div className="space-y-4">
      {/* Basic Shooter Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-right">
        <label className="block">
          <span className="font-bold block mb-1">תאריך לידה</span>
          <input
            aria-label="תאריך לידה"
            type="date"
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            value={value.birthDate || ''}
            onChange={e => onChange({ ...value, birthDate: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white"
          />
        </label>

        <label className="block">
          <span className="font-bold block mb-1">מספר יורה (IPSC/ID)</span>
          <input
            aria-label="מספר יורה"
            dir="ltr"
            maxLength={40}
            placeholder="IL-0000"
            value={value.shooterNumber || ''}
            onChange={e => onChange({ ...value, shooterNumber: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white font-mono"
          />
        </label>

        <label className="block">
          <span className="font-bold block mb-1">מחלקת ירי</span>
          <select
            aria-label="מחלקת ירי"
            value={value.division || ''}
            onChange={e => onChange({ ...value, division: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white font-semibold"
          >
            <option value="">טרם הוגדרה</option>
            {['Open', 'Standard', 'Classic', 'Production', 'Production Optics', 'Optics', 'Revolver'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-bold block mb-1">דרגת סיווג</span>
          <select
            aria-label="דרגת סיווג"
            value={value.classification || ''}
            onChange={e => onChange({ ...value, classification: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white font-semibold"
          >
            <option value="">טרם הוגדרה</option>
            {['U', 'D', 'C', 'B', 'A', 'M', 'GM'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Safety & Compliance Document Expiry Dates */}
      {showDocuments && (
        <div className="p-3.5 bg-[#FAF8F5] border border-[#DFCEB0] rounded-2xl space-y-3 text-right">
          <div className="text-[11px] font-bold text-falcon-900 flex items-center justify-between border-b border-[#EFE6D5] pb-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-falcon-700" />
              <span>תוקף מסמכים ורישיונות (בטיחות ורגולציה)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Firearm License */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold flex items-center gap-1">
                  <span>תוקף רישיון נשק</span>
                </label>
              </div>
              <input
                type="date"
                value={value.firearmLicenseExpiry || ''}
                onChange={e => onChange({ ...value, firearmLicenseExpiry: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#DFCEB0] bg-white text-xs"
              />
              <div className="mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-lg inline-block ${licenseStatus.badgeClass}`}>
                  {licenseStatus.label}
                </span>
              </div>
            </div>

            {/* Health Declaration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold flex items-center gap-1">
                  <span>הצהרת בריאות</span>
                </label>
              </div>
              <input
                type="date"
                value={value.healthDeclarationExpiry || ''}
                onChange={e => onChange({ ...value, healthDeclarationExpiry: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#DFCEB0] bg-white text-xs"
              />
              <div className="mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-lg inline-block ${healthStatus.badgeClass}`}>
                  {healthStatus.label}
                </span>
              </div>
            </div>

            {/* Insurance / Federation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold flex items-center gap-1">
                  <span>ביטוח / התאחדות</span>
                </label>
              </div>
              <input
                type="date"
                value={value.insuranceExpiry || ''}
                onChange={e => onChange({ ...value, insuranceExpiry: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#DFCEB0] bg-white text-xs"
              />
              <div className="mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-lg inline-block ${insuranceStatus.badgeClass}`}>
                  {insuranceStatus.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
