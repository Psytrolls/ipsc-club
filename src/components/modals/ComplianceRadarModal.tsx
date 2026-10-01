import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { scanClubCompliance, createDocumentWhatsAppReminder, DocumentAlert, AlertSeverity, DocType } from '../../lib/documentAlerts';
import { getDocumentStatus } from '../../lib/documentStatus';
import { getWhatsAppUrl } from '../../lib/whatsapp';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Send,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Save,
  MessageSquare,
  Users,
  Filter
} from 'lucide-react';

interface ComplianceRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceRadarModal: React.FC<ComplianceRadarModalProps> = ({ isOpen, onClose }) => {
  const { users, saveUser, showToast } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'expired' | 'urgent' | 'expiring' | 'missing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editLicense, setEditLicense] = useState('');
  const [editHealth, setEditHealth] = useState('');
  const [editInsurance, setEditInsurance] = useState('');

  const complianceSummary = useMemo(() => scanClubCompliance(users), [users]);

  const activeMembers = useMemo(() => {
    return users.filter(u => u.membershipStatus !== 'suspended' && u.role !== 'guest');
  }, [users]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return activeMembers.filter(member => {
      // Search filter
      const matchesSearch =
        (member.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.shooterNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.phone || '').includes(searchQuery);

      if (!matchesSearch) return false;

      const license = getDocumentStatus(member.firearmLicenseExpiry);
      const health = getDocumentStatus(member.healthDeclarationExpiry);
      const insurance = getDocumentStatus(member.insuranceExpiry);

      if (filterSeverity === 'all') return true;
      if (filterSeverity === 'expired') {
        return license.status === 'expired' || health.status === 'expired' || insurance.status === 'expired';
      }
      if (filterSeverity === 'urgent') {
        return (
          (license.daysRemaining !== undefined && license.daysRemaining <= 14 && license.daysRemaining >= 0) ||
          (health.daysRemaining !== undefined && health.daysRemaining <= 14 && health.daysRemaining >= 0) ||
          (insurance.daysRemaining !== undefined && insurance.daysRemaining <= 14 && insurance.daysRemaining >= 0)
        );
      }
      if (filterSeverity === 'expiring') {
        return license.status === 'expiring_soon' || health.status === 'expiring_soon' || insurance.status === 'expiring_soon';
      }
      if (filterSeverity === 'missing') {
        return license.status === 'missing' || health.status === 'missing' || insurance.status === 'missing';
      }
      return true;
    });
  }, [activeMembers, searchQuery, filterSeverity]);

  if (!isOpen) return null;

  const handleStartEdit = (member: typeof activeMembers[0]) => {
    setEditingUserId(member.id);
    setEditLicense(member.firearmLicenseExpiry || '');
    setEditHealth(member.healthDeclarationExpiry || '');
    setEditInsurance(member.insuranceExpiry || '');
  };

  const handleSaveMemberDates = async (member: typeof activeMembers[0]) => {
    try {
      await saveUser({
        ...member,
        firearmLicenseExpiry: editLicense,
        healthDeclarationExpiry: editHealth,
        insuranceExpiry: editInsurance
      });
      setEditingUserId(null);
      showToast(`תאריכי המסמכים של ${member.fullName} עודכנו בהצלחה`, 'success');
    } catch {
      showToast('שגיאה בעדכון המסמכים', 'error');
    }
  };

  const sendWhatsAppReminder = (member: typeof activeMembers[0], docType: DocType) => {
    const alert = complianceSummary.alerts.find(a => a.userId === member.id && a.docType === docType);
    if (!alert) {
      showToast('לא נמצאה התראה פעילה עבור מסמך זה', 'info');
      return;
    }
    const message = createDocumentWhatsAppReminder(alert);
    window.open(getWhatsAppUrl(member.phone, message), '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in text-right"
    >
      <div className="bg-[#FAF8F5] w-full max-w-5xl rounded-3xl border border-[#DFCEB0] shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#252C2A] text-white flex items-center justify-between shrink-0 border-b border-black/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#A67C37] flex items-center justify-center text-white shadow-md">
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">רדאר תוקף מסמכים ובקרת רגולציה</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  IPSC Compliance
                </span>
              </div>
              <p className="text-xs text-[#DFCEB0]">מעקב רישיונות נשק, בדיקות בריאות וביטוחי ספורטאים עם תזכורות וואטסאפ מהירות</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-white border-b border-[#EFE6D5] shrink-0 text-center">
          <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#DFCEB0]">
            <div className="text-xl font-black text-slate-900">{complianceSummary.totalUsers}</div>
            <div className="text-[11px] font-bold text-slate-500">חברי מועדון פעילים</div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="text-xl font-black text-emerald-800">{complianceSummary.compliantUsers}</div>
            <div className="text-[11px] font-bold text-emerald-700">תקינים ב-100%</div>
          </div>

          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
            <div className="text-xl font-black text-rose-800">{complianceSummary.expiredUsers}</div>
            <div className="text-[11px] font-bold text-rose-700">פג תוקף (חסומים)</div>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="text-xl font-black text-amber-800">{complianceSummary.urgentUsers}</div>
            <div className="text-[11px] font-bold text-amber-700">דחוף (עד 14 יום)</div>
          </div>

          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 col-span-2 sm:col-span-1">
            <div className="text-xl font-black text-sky-800">{complianceSummary.expiringSoonUsers}</div>
            <div className="text-[11px] font-bold text-sky-700">יפוגו החודש (30 יום)</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#EFE6D5] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterSeverity === 'all'
                  ? 'bg-[#A67C37] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-[#DFCEB0] hover:bg-slate-100'
              }`}
            >
              הכל ({activeMembers.length})
            </button>

            <button
              onClick={() => setFilterSeverity('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterSeverity === 'expired'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              פגי תוקף ({complianceSummary.expiredUsers})
            </button>

            <button
              onClick={() => setFilterSeverity('urgent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterSeverity === 'urgent'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              דחוף 14 יום ({complianceSummary.urgentUsers})
            </button>

            <button
              onClick={() => setFilterSeverity('expiring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterSeverity === 'expiring'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-sky-800 border border-sky-300 hover:bg-sky-50'
              }`}
            >
              יפוגו ב-30 יום ({complianceSummary.expiringSoonUsers})
            </button>

            <button
              onClick={() => setFilterSeverity('missing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterSeverity === 'missing'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              חסרי תאריך
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="חיפוש יורה, מספר IPSC או טלפון..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#DFCEB0] bg-white text-xs"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* Member Compliance List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#DFCEB0]">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600 mb-2" />
              <div className="font-bold text-slate-800">אין יורים התואמים את הסינון שנבחר</div>
              <div className="text-xs text-slate-500 mt-1">כל המסמכים בקטגוריה זו תקינים לחלוטין!</div>
            </div>
          ) : (
            filteredMembers.map(member => {
              const licenseStatus = getDocumentStatus(member.firearmLicenseExpiry);
              const healthStatus = getDocumentStatus(member.healthDeclarationExpiry);
              const insuranceStatus = getDocumentStatus(member.insuranceExpiry);
              const isEditing = editingUserId === member.id;

              return (
                <div
                  key={member.id}
                  className="p-4 bg-white rounded-2xl border border-[#DFCEB0] shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE6D5] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F4EFE6] text-[#A67C37] font-black flex items-center justify-center text-sm border border-[#DFCEB0]">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900">{member.fullName}</strong>
                          {member.shooterNumber && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-300">
                              {member.shooterNumber}
                            </span>
                          )}
                          {member.division && (
                            <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                              {member.division}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono" dir="ltr">
                          {member.phone || 'אין טלפון'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <button
                          onClick={() => handleStartEdit(member)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-slate-800 border border-[#DFCEB0] text-xs font-bold transition"
                        >
                          עריכת תאריכים
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSaveMemberDates(member)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Save size={13} />
                            <span>שמור</span>
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                          >
                            ביטול
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Grid / Edit Form */}
                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {/* Firearm License */}
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DFCEB0] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <ShieldCheck size={14} className="text-falcon-700" />
                            <span>רישיון נשק:</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${licenseStatus.badgeClass}`}>
                            {licenseStatus.label}
                          </span>
                        </div>
                        {member.phone && licenseStatus.status !== 'valid' && (
                          <button
                            onClick={() => sendWhatsAppReminder(member, 'firearmLicense')}
                            className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Send size={12} />
                            <span>תזכורת בוואטסאפ</span>
                          </button>
                        )}
                      </div>

                      {/* Health Declaration */}
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DFCEB0] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <ShieldCheck size={14} className="text-falcon-700" />
                            <span>הצהרת בריאות:</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${healthStatus.badgeClass}`}>
                            {healthStatus.label}
                          </span>
                        </div>
                        {member.phone && healthStatus.status !== 'valid' && (
                          <button
                            onClick={() => sendWhatsAppReminder(member, 'healthDeclaration')}
                            className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Send size={12} />
                            <span>תזכורת בוואטסאפ</span>
                          </button>
                        )}
                      </div>

                      {/* Sports Insurance */}
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DFCEB0] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <ShieldCheck size={14} className="text-falcon-700" />
                            <span>ביטוח והתאחדות:</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${insuranceStatus.badgeClass}`}>
                            {insuranceStatus.label}
                          </span>
                        </div>
                        {member.phone && insuranceStatus.status !== 'valid' && (
                          <button
                            onClick={() => sendWhatsAppReminder(member, 'insurance')}
                            className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Send size={12} />
                            <span>תזכורת בוואטסאפ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs">
                      <div>
                        <label className="block font-bold mb-1 text-slate-800">תוקף רישיון נשק:</label>
                        <input
                          type="date"
                          value={editLicense}
                          onChange={e => setEditLicense(e.target.value)}
                          className="w-full p-2 rounded-lg border border-[#DFCEB0] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-slate-800">תוקף הצהרת בריאות:</label>
                        <input
                          type="date"
                          value={editHealth}
                          onChange={e => setEditHealth(e.target.value)}
                          className="w-full p-2 rounded-lg border border-[#DFCEB0] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-slate-800">תוקף ביטוח ספורט:</label>
                        <input
                          type="date"
                          value={editInsurance}
                          onChange={e => setEditInsurance(e.target.value)}
                          className="w-full p-2 rounded-lg border border-[#DFCEB0] bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F4EFE6] border-t border-[#DFCEB0] flex items-center justify-between text-xs text-slate-600">
          <span>* הודעות הוואטסאפ נפתחות עם נוסח מנומס ומותאם אישית הכולל קישורי חידוש רשמיים.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
