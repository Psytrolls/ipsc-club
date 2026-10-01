import {ExercisePlanner} from './ExercisePlanner';
import {ScoreEntry} from './ScoreEntry';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TrainingSession, Registration, ExerciseTemplate } from '../../types';
import { getWhatsAppUrl, createTrainingSquadWhatsAppMessage } from '../../lib/whatsapp';
import { exportResultsToCsv, printTrainingSummary } from '../../lib/exportResults';
import { checkUserDocuments } from '../../lib/documentStatus';
import { getWazeNavigationUrl } from '../../lib/navigation';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Plus,
  Send,
  Save,
  MessageSquare,
  Crosshair,
  TrendingUp,
  FileEdit,
  DollarSign,
  Share2,
  Copy,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  Navigation
} from 'lucide-react';
import { TargetIcon } from '../common/TargetIcon';

export const InstructorDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    trainings,
    registrations,
    exerciseTemplates,
    exerciseResults,
    updateAttendance,
    addExerciseResult,
    saveFeedback,
    focusItems,
    updateFocusItemStatus,
    showToast,
  } = useApp();

  // Selected training for active management
  const assignedTrainings = trainings.filter(t =>
    t.instructorIds.includes(currentUser?.id || 'user-dan') || currentUser?.role === 'admin'
  );

  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(
    assignedTrainings[0]?.id || ''
  );

  useEffect(()=>{if(!assignedTrainings.some(t=>t.id===selectedTrainingId))setSelectedTrainingId(assignedTrainings[0]?.id||'');},[trainings,selectedTrainingId,currentUser?.id]);
  const currentTraining = trainings.find(t => t.id === selectedTrainingId);
  const trainingRegistrations = registrations.filter(
    r => r.trainingId === selectedTrainingId && r.status === 'confirmed'
  );

  // Score Entry Modal state
  const [activeScoreShooter, setActiveScoreShooter] = useState<Registration | null>(null);
  // Feedback Modal state
  const [activeFeedbackShooter, setActiveFeedbackShooter] = useState<Registration | null>(null);
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [strengthsText, setStrengthsText] = useState('');
  const [improvementsText, setImprovementsText] = useState('');
  const [focusTitle, setFocusTitle] = useState('');
  const [focusDescription, setFocusDescription] = useState('');
  const [focusPriority, setFocusPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [internalNote, setInternalNote] = useState('');

  const handleOpenFeedback = (reg: Registration) => {
    setActiveFeedbackShooter(reg);
    // Find any existing focus item for this shooter to inspect
    const existingFocus = focusItems.filter(f => f.userId === reg.userId && f.status !== 'completed');
    if (existingFocus.length > 0) {
      setFocusTitle(existingFocus[0].title);
      setFocusDescription(existingFocus[0].description);
      setFocusPriority(existingFocus[0].priority);
    } else {
      setFocusTitle('');
      setFocusDescription('');
      setFocusPriority('high');
    }
    setFeedbackSummary('');
    setStrengthsText('');
    setImprovementsText('');
    setInternalNote('');
  };

  const handleSaveFeedback = async (status: 'draft' | 'published') => {
    if (!activeFeedbackShooter || !currentTraining) return;

    const strengths = strengthsText.split('\n').map(s => s.trim()).filter(Boolean);
    const improvements = improvementsText.split('\n').map(s => s.trim()).filter(Boolean);

    const newFocusItem = focusTitle ? [{
      id: `focus-${Date.now()}`,
      userId: activeFeedbackShooter.userId,
      title: focusTitle,
      description: focusDescription,
      priority: focusPriority,
      status: 'in_progress' as const,
      createdTrainingId: currentTraining.id,
      createdDate: new Date().toISOString().split('T')[0],
      instructorName: currentUser?.fullName || 'דן גולן',
    }] : [];

    const saved = await saveFeedback({
      id: `fb-${Date.now()}`,
      trainingId: currentTraining.id,
      trainingDate: currentTraining.date,
      trainingTitle: currentTraining.title,
      userId: activeFeedbackShooter.userId,
      instructorId: currentUser?.id || 'user-dan',
      instructorName: currentUser?.fullName || 'דן גולן',
      status,
      summary: feedbackSummary,
      strengths,
      improvements,
      focusItems: newFocusItem,
      internalInstructorNote: internalNote,
      createdAt: new Date().toISOString(),
      publishedAt: status === 'published' ? new Date().toISOString() : undefined,
    });

    if(saved) setActiveFeedbackShooter(null);
  };

  return (
    <div className="workspace-dashboard instructor-workspace space-y-6 max-w-5xl mx-auto px-4 py-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#EFE6D5] shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 text-sm font-bold text-falcon-800 bg-[#F4EFE6] px-3 py-1 rounded-full border border-[#DFCEB0] mb-1">
            <Award size={14} className="text-falcon-600" />
            <span>אזור הדרכה וניהול מקצועי</span>
          </div>
          <h1 className="text-2xl font-black text-graphite-900">
            שלום מדריך, {currentUser?.fullName}
          </h1>
          <p className="text-sm text-graphite-500">
            ניהול נוכחות משתתפים, הזנת תוצאות תרגילים ומתן משוב מקצועי ליורים
          </p>
        </div>

        {/* Training Selector dropdown */}
        <div className="w-full sm:w-72">
          <label className="block text-sm font-bold text-graphite-600 mb-1">
            בחר אימון לעבודה:
          </label>
          <select
            value={selectedTrainingId}
            onChange={e => setSelectedTrainingId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] text-sm font-bold text-graphite-900 focus:outline-none focus:ring-2 focus:ring-falcon-500"
          >
            {trainings.map(t => (
              <option key={t.id} value={t.id}>
                {t.date} | {t.title} ({t.registeredCount}/{t.maxCapacity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentTraining ? (
        <div className="space-y-6">
          {/* Training Info Banner */}
          <div className="bg-gradient-to-r from-graphite-900 to-graphite-800 p-5 rounded-3xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-falcon-300 font-bold">{currentTraining.type}</div>
              <h2 className="text-lg font-black">{currentTraining.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-graphite-300 mt-1">
                <span className="flex items-center gap-1"><Calendar size={13} className="text-falcon-400" /> {currentTraining.date}</span>
                <span className="flex items-center gap-1"><Clock size={13} className="text-falcon-400" /> {currentTraining.startTime} - {currentTraining.endTime}</span>
                <a
                  href={currentTraining.locationMapUrl || getWazeNavigationUrl(currentTraining.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-falcon-300 hover:text-white underline font-semibold transition-colors"
                  title="פתיחה בניווט Waze"
                >
                  <MapPin size={13} className="text-falcon-400" />
                  <span>{currentTraining.location || 'מטווח נץ המדבר'}</span>
                  <Navigation size={11} className="text-falcon-400" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                <div className="text-xl font-black text-white">{trainingRegistrations.length}</div>
                <div className="text-sm text-graphite-300">רשומים בפועל</div>
              </div>
            </div>
          </div>

          <ExercisePlanner training={currentTraining}/>

          {/* Training Management Quick Actions Toolbar */}
          <div className="bg-white rounded-3xl border border-[#EFE6D5] p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-graphite-700">פעולות מהירות למדריך:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp Squad Share */}
              <button
                onClick={() => {
                  const text = createTrainingSquadWhatsAppMessage(currentTraining, registrations);
                  window.open(getWhatsAppUrl('', text), '_blank');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Share2 size={14} />
                <span>שיתוף רשימה בוואטסאפ</span>
              </button>

              {/* Copy Roster */}
              <button
                onClick={async () => {
                  const text = createTrainingSquadWhatsAppMessage(currentTraining, registrations);
                  try {
                    await navigator.clipboard.writeText(text);
                    showToast('רשימת המשתתפים הועתקה ללוח', 'success');
                  } catch {
                    showToast('שגיאה בהעתקת הרשימה', 'error');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-graphite-800 border border-[#DFCEB0] text-sm font-bold flex items-center gap-1.5 transition-all"
              >
                <Copy size={14} />
                <span>העתקת רשימה</span>
              </button>

              {/* CSV Export */}
              <button
                onClick={() => {
                  const currentResults = exerciseResults.filter(r => r.trainingId === currentTraining.id);
                  exportResultsToCsv(currentTraining, currentResults);
                  showToast('קובץ CSV הורד בהצלחה', 'success');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-graphite-800 border border-[#DFCEB0] text-sm font-bold flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet size={14} />
                <span>ייצוא תוצאות (CSV)</span>
              </button>

              {/* Print Summary */}
              <button
                onClick={() => {
                  const currentResults = exerciseResults.filter(r => r.trainingId === currentTraining.id);
                  printTrainingSummary(currentTraining, registrations, currentResults);
                }}
                className="px-3.5 py-2 rounded-xl bg-graphite-900 hover:bg-graphite-800 text-white text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Printer size={14} />
                <span>פרוטוקול / הדפסה</span>
              </button>
            </div>
          </div>

          {/* Attendance & Scoring Table */}
          <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-graphite-900">
                <Users size={18} className="text-falcon-600" />
                <span>דוח נוכחות ופעולות למשתתפים</span>
              </div>
              <span className="text-sm text-graphite-500">
                {trainingRegistrations.filter(r => r.attendance === 'attended').length} נכחו במגרש
              </span>
            </div>

            {trainingRegistrations.length === 0 ? (
              <div className="p-8 text-center text-graphite-500 text-sm">
                אין יורים רשומים לאימון זה
              </div>
            ) : (
              <div className="space-y-3">
                {trainingRegistrations.map((reg, idx) => {
                  const isAttended = reg.attendance === 'attended';
                  const isAbsent = reg.attendance === 'absent';

                  // Shooter document compliance check
                  const shooterUser = users.find(u => u.id === reg.userId);
                  const docCompliance = shooterUser ? checkUserDocuments(shooterUser) : null;

                  // Shooter open focus item to keep instructor informed!
                  const shooterFocus = focusItems.filter(f => f.userId === reg.userId && f.status !== 'completed');

                  return (
                    <div
                      key={reg.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isAttended
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isAbsent
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-[#FAF8F5] border-[#EFE6D5]'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Shooter Info & Previous Focus Notice */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-graphite-800 text-white flex items-center justify-center text-sm font-bold font-mono">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-graphite-900">{reg.userName}</span>
                            <span className="text-sm text-graphite-500 font-mono">({reg.userPhone})</span>

                            {/* Compliance Badges on Range */}
                            {docCompliance?.hasExpired && (
                              <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <ShieldAlert size={12} />
                                <span>מסמך פג תוקף!</span>
                              </span>
                            )}
                            {!docCompliance?.hasExpired && docCompliance?.hasExpiringSoon && (
                              <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                פג בקרוב
                              </span>
                            )}
                          </div>

                          {shooterFocus.length > 0 && (
                            <div className="text-sm text-falcon-900 bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#DFCEB0] inline-flex items-center gap-1.5 mt-1">
                              <Crosshair size={12} className="text-falcon-600 shrink-0" />
                              <span><strong>דגש פתוח מאימון קודם:</strong> {shooterFocus[0].title}</span><button type="button" className="button-small" onClick={()=>updateFocusItemStatus(shooterFocus[0].id,'completed')}>אישור השלמה</button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Attendance toggles */}
                          <div className="flex items-center bg-white rounded-xl border border-[#DFCEB0] p-1 gap-1">
                            <button
                              onClick={() => updateAttendance(reg.id, 'attended')}
                              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${
                                isAttended
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-graphite-600 hover:text-emerald-700'
                              }`}
                            >
                              <CheckCircle2 size={13} />
                              <span>נכח</span>
                            </button>

                            <button
                              onClick={() => updateAttendance(reg.id, 'absent')}
                              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${
                                isAbsent
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-graphite-600 hover:text-rose-700'
                              }`}
                            >
                              <XCircle size={13} />
                              <span>לא הגיע</span>
                            </button>
                          </div>

                          {/* Payment on site indicator */}
                          <button
                            disabled={!currentUser?.roles.includes('admin')} onClick={() => updateAttendance(reg.id, reg.attendance, !reg.paymentOnSite)}
                            className={`px-2.5 py-1.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-1 ${
                              reg.paymentOnSite
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700'
                            }`}
                            title="סימון תשלום במזומן/אשראי במקום"
                          >
                            <DollarSign size={13} />
                            <span>{reg.paymentOnSite ? 'שולם במקום' : 'טרם סומן תשלום'}</span>
                          </button>

                          {/* Enter Score button */}
                          <button
                            onClick={() => setActiveScoreShooter(reg)}
                            className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] border border-[#DFCEB0] text-graphite-900 text-sm font-bold transition-all flex items-center gap-1.5"
                          >
                            <TargetIcon size={14} className="text-falcon-600" />
                            <span>הזנת תוצאה</span>
                          </button>

                          {/* Feedback button */}
                          <button
                            onClick={() => handleOpenFeedback(reg)}
                            className="px-3 py-1.5 rounded-xl bg-[#8C6228] hover:bg-[#6E491C] text-white text-sm font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <MessageSquare size={13} />
                            <span>משוב ודגשים</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EFE6D5]">
          <p className="text-sm text-graphite-500">אין אימונים פעילים</p>
        </div>
      )}

      {activeScoreShooter&&currentTraining&&<ScoreEntry training={currentTraining} shooter={activeScoreShooter} onClose={()=>setActiveScoreShooter(null)} onNext={()=>{const index=trainingRegistrations.findIndex(r=>r.id===activeScoreShooter.id);setActiveScoreShooter(trainingRegistrations[index+1]||null);}}/>}

      {activeFeedbackShooter && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#EFE6D5] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-falcon-600 to-falcon-500 p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="text-sm text-falcon-100 font-bold">משוב אישי ודגשים לאימון הבא</div>
                <h3 className="text-lg font-black">{activeFeedbackShooter.userName}</h3>
              </div>
              <button
                onClick={() => setActiveFeedbackShooter(null)}
                className="text-white hover:opacity-80"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div>
                <label className="block font-bold text-graphite-700 mb-1">
                  סיכום מקצועי של האימון:
                </label>
                <textarea
                  rows={2}
                  value={feedbackSummary}
                  onChange={e => setFeedbackSummary(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-800 mb-1">
                    נקודות חוזק (כל שורה היא נקודה):
                  </label>
                  <textarea
                    rows={2}
                    value={strengthsText}
                    onChange={e => setStrengthsText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-800 mb-1">
                    נושאים לשיפור (כל שורה היא נקודה):
                  </label>
                  <textarea
                    rows={2}
                    value={improvementsText}
                    onChange={e => setImprovementsText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 text-sm"
                  />
                </div>
              </div>

              {/* Actionable Focus Point */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#DFCEB0] space-y-3">
                <div className="font-bold text-graphite-900 flex items-center gap-1.5">
                  <Crosshair size={14} className="text-falcon-600" />
                  <span>הגדרת דגש מרכזי לאימון הבא (יועבר אוטומטית ברצף):</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="כותרת הדגש (לדוגמה: עקביות בתוצאות)"
                      value={focusTitle}
                      onChange={e => setFocusTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <select
                      value={focusPriority}
                      onChange={e => setFocusPriority(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white text-sm font-bold"
                    >
                      <option value="high">עדיפות גבוהה</option>
                      <option value="medium">עדיפות בינונית</option>
                      <option value="low">עדיפות רגילה</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="פירוט והנחיות לתרגול..."
                  value={focusDescription}
                  onChange={e => setFocusDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white text-sm"
                />
              </div>

              {/* Private instructor notes (hidden from shooter) */}
              <div>
                <label className="block font-bold text-graphite-700 mb-1 flex items-center gap-1">
                  <span>הערה פנימית למדריכים בלבד (לא מוצגת ליורה):</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="הערה טקטית או מעקב סודי לצוות המדריכים..."
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 bg-gray-50 text-sm font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackShooter(null)}
                  className="px-4 py-2 rounded-xl text-graphite-600 hover:bg-gray-100 font-semibold"
                >
                  ביטול
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveFeedback('draft')}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-graphite-800 font-bold flex items-center gap-1.5"
                  >
                    <Save size={13} />
                    <span>שמור טיוטה</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveFeedback('published')}
                    className="px-5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>פרסם ליורה</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
