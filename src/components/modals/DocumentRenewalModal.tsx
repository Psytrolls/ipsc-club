import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getDocumentStatus } from '../../lib/documentStatus';
import {
  X,
  ShieldCheck,
  HeartPulse,
  Award,
  ExternalLink,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileDown
} from 'lucide-react';

interface DocumentRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDoc?: 'firearm' | 'health' | 'insurance';
}

export const DocumentRenewalModal: React.FC<DocumentRenewalModalProps> = ({
  isOpen,
  onClose,
  defaultDoc = 'firearm'
}) => {
  const { currentUser, saveUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'firearm' | 'health' | 'insurance'>(defaultDoc);

  // Form states initialized with currentUser values
  const [firearmLicenseExpiry, setFirearmLicenseExpiry] = useState(
    currentUser?.firearmLicenseExpiry || ''
  );
  const [healthDeclarationExpiry, setHealthDeclarationExpiry] = useState(
    currentUser?.healthDeclarationExpiry || ''
  );
  const [insuranceExpiry, setInsuranceExpiry] = useState(
    currentUser?.insuranceExpiry || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !currentUser) return null;

  const licenseStatus = getDocumentStatus(firearmLicenseExpiry);
  const healthStatus = getDocumentStatus(healthDeclarationExpiry);
  const insuranceStatus = getDocumentStatus(insuranceExpiry);

  const handleSave = async (docType: 'firearm' | 'health' | 'insurance') => {
    setIsSaving(true);
    try {
      const updatedUser = { ...currentUser };
      if (docType === 'firearm') updatedUser.firearmLicenseExpiry = firearmLicenseExpiry;
      if (docType === 'health') updatedUser.healthDeclarationExpiry = healthDeclarationExpiry;
      if (docType === 'insurance') updatedUser.insuranceExpiry = insuranceExpiry;

      await saveUser(updatedUser);
      showToast('תוקף המסמך עודכן ונשמר בהצלחה!', 'success');
    } catch {
      showToast('שגיאה בשמירת התאריך', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in text-right"
    >
      <div className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl border border-[#DFCEB0] shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#252C2A] text-white flex items-center justify-between shrink-0 border-b border-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A67C37] flex items-center justify-center text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">מרכז חידוש מסמכים ורישיונות</h2>
              <p className="text-xs text-[#DFCEB0]">הנחיות, קישורים ממשלתיים ועדכון תוקף מהיר</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-white border-b border-[#EFE6D5] flex gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('firearm')}
            className={`flex-1 min-w-[130px] p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === 'firearm'
                ? 'bg-[#A67C37] text-white shadow-sm'
                : 'bg-[#FAF8F5] text-slate-700 hover:bg-[#F4EFE6] border border-[#DFCEB0]'
            }`}
          >
            <ShieldCheck size={16} />
            <span>רישיון נשק</span>
            {licenseStatus.status === 'expired' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
            {licenseStatus.status === 'expiring_soon' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 min-w-[130px] p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === 'health'
                ? 'bg-[#A67C37] text-white shadow-sm'
                : 'bg-[#FAF8F5] text-slate-700 hover:bg-[#F4EFE6] border border-[#DFCEB0]'
            }`}
          >
            <HeartPulse size={16} />
            <span>הצהרת בריאות</span>
            {healthStatus.status === 'expired' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
            {healthStatus.status === 'expiring_soon' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>

          <button
            onClick={() => setActiveTab('insurance')}
            className={`flex-1 min-w-[130px] p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === 'insurance'
                ? 'bg-[#A67C37] text-white shadow-sm'
                : 'bg-[#FAF8F5] text-slate-700 hover:bg-[#F4EFE6] border border-[#DFCEB0]'
            }`}
          >
            <Award size={16} />
            <span>ביטוח והתאחדות</span>
            {insuranceStatus.status === 'expired' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
            {insuranceStatus.status === 'expiring_soon' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'firearm' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
                <Info size={20} className="text-amber-800 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="block font-black mb-1">מדריך לחידוש רישיון כלי ירייה:</strong>
                  1. יש לבצע אימון רענון / מטווח כשירות במטווח מורשה.<br />
                  2. יש להיכנס לאתר האגף לרישוי כלי ירייה במשרד לביטחון לאומי ולשלם את אגרת החידוש.<br />
                  3. לאחר קבלת הרישיון המעודכן, הזינו כאן את התאריך החדש לתוקף.
                </div>
              </div>

              <div className="p-4 bg-white border border-[#DFCEB0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">סטטוס נוכחי במערכת:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs ${licenseStatus.badgeClass}`}>
                    {licenseStatus.label}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    תאריך תוקף רישיון מעודכן (YYYY-MM-DD):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={firearmLicenseExpiry}
                      onChange={e => setFirearmLicenseExpiry(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] text-sm font-semibold"
                    />
                    <button
                      onClick={() => handleSave('firearm')}
                      disabled={isSaving}
                      className="px-4 py-2.5 bg-[#A67C37] hover:bg-[#8C6527] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      <Save size={14} />
                      <span>{isSaving ? 'שומר...' : 'עדכן'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <a
                href="https://www.gov.il/he/service/firearm-license-renewal"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 rounded-2xl bg-[#252C2A] hover:bg-[#343d3a] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>מעבר לאתר Gov.il לחידוש רישיון מקוון</span>
                <ExternalLink size={15} />
              </a>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <HeartPulse size={20} className="text-emerald-800 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong className="block font-black mb-1">הצהרת בריאות ובדיקה ארגומטרית:</strong>
                  לפי חוק הספורט, כל ספורטאי ויורה נדרש לחדש הצהרת בריאות שנתית או בדיקה ארגומטרית (לפי גיל והנחיות ההתאחדות).
                </div>
              </div>

              <div className="p-4 bg-white border border-[#DFCEB0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">סטטוס נוכחי במערכת:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs ${healthStatus.badgeClass}`}>
                    {healthStatus.label}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    תאריך תוקף הצהרת בריאות מעודכן:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={healthDeclarationExpiry}
                      onChange={e => setHealthDeclarationExpiry(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] text-sm font-semibold"
                    />
                    <button
                      onClick={() => handleSave('health')}
                      disabled={isSaving}
                      className="px-4 py-2.5 bg-[#A67C37] hover:bg-[#8C6527] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      <Save size={14} />
                      <span>{isSaving ? 'שומר...' : 'עדכן'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insurance' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl flex items-start gap-3">
                <Award size={20} className="text-sky-800 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 leading-relaxed">
                  <strong className="block font-black mb-1">ביטוח ספורטאים וחברות בהתאחדות הקליעה:</strong>
                  החברות בהתאחדות הקליעה בישראל מעניקה כיסוי ביטוחי מלא לאימונים ותחרויות ארציות ובינלאומיות של IPSC.
                </div>
              </div>

              <div className="p-4 bg-white border border-[#DFCEB0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">סטטוס נוכחי במערכת:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs ${insuranceStatus.badgeClass}`}>
                    {insuranceStatus.label}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    תאריך תוקף ביטוח מעודכן:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={insuranceExpiry}
                      onChange={e => setInsuranceExpiry(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] text-sm font-semibold"
                    />
                    <button
                      onClick={() => handleSave('insurance')}
                      disabled={isSaving}
                      className="px-4 py-2.5 bg-[#A67C37] hover:bg-[#8C6527] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      <Save size={14} />
                      <span>{isSaving ? 'שומר...' : 'עדכן'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <a
                href="https://www.israelsports.org.il/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 rounded-2xl bg-[#252C2A] hover:bg-[#343d3a] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>אתר התאחדות הקליעה בישראל</span>
                <ExternalLink size={15} />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F4EFE6] border-t border-[#DFCEB0] flex items-center justify-between">
          <span className="text-[11px] text-slate-600">
            תאריכים מעודכנים מבטיחים אישור הגעה אוטומטי לאימונים ומקצים.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
