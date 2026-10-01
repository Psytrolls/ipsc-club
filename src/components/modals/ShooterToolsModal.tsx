import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateDetailedHitFactor, simulateSpeedVsAccuracy, StageScoreInput } from '../../lib/hfCalculator';
import { evaluateShooterBadges } from '../../lib/badges';
import { IPSC_QUIZ_QUESTIONS } from '../../lib/ipscQuiz';
import { X, Calculator, Award, HelpCircle, Wrench, ChevronLeft, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export const ShooterToolsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'calc' | 'quiz' | 'badges' | 'log';
}> = ({ isOpen, onClose, defaultTab = 'calc' }) => {
  const { currentUser, getMyResults, getMyRegistrations } = useApp();
  const [tab, setTab] = useState<'calc' | 'quiz' | 'badges' | 'log'>(defaultTab);

  // HF Calculator State
  const [calcInput, setCalcInput] = useState<StageScoreInput>({
    powerFactor: 'minor',
    hitsA: 10,
    hitsC: 2,
    hitsD: 0,
    misses: 0,
    metalHits: 2,
    metalMisses: 0,
    noShootHits: 0,
    procedurals: 0,
    timeSeconds: 8.5,
  });

  const calcResult = calculateDetailedHitFactor(calcInput);
  
  // What-if simulation: 0.5s faster with 1 C instead of A vs 0.5s slower with all A
  const fasterSimulation = simulateSpeedVsAccuracy(calcInput, -0.5, { from: 'c', to: 'a', count: 0 });
  const cleanerSimulation = simulateSpeedVsAccuracy(calcInput, 0.4, { from: 'c', to: 'a', count: Math.min(2, calcInput.hitsC) });

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const correctCount = Object.entries(quizAnswers).filter(([id, ans]) => {
    const q = IPSC_QUIZ_QUESTIONS.find(item => item.id === id);
    return q && q.correctIndex === ans;
  }).length;

  // Gun Maintenance Log State (Persisted in localStorage for now)
  const [gunRounds, setGunRounds] = useState(() => {
    const saved = localStorage.getItem(`gun_rounds_${currentUser?.id}`);
    return saved ? Number(saved) : 1250;
  });
  const [lastCleanDate, setLastCleanDate] = useState(() => {
    return localStorage.getItem(`gun_clean_${currentUser?.id}`) || '2026-09-25';
  });
  const [recoilSpringRounds, setRecoilSpringRounds] = useState(() => {
    const saved = localStorage.getItem(`gun_spring_${currentUser?.id}`);
    return saved ? Number(saved) : 3400;
  });

  const handleSaveGunLog = () => {
    if (!currentUser) return;
    localStorage.setItem(`gun_rounds_${currentUser.id}`, String(gunRounds));
    localStorage.setItem(`gun_clean_${currentUser.id}`, lastCleanDate);
    localStorage.setItem(`gun_spring_${currentUser.id}`, String(recoilSpringRounds));
    alert('יומן התחזוקה נשמר בהצלחה!');
  };

  // Badges evaluation
  const badges = currentUser ? evaluateShooterBadges(currentUser, getMyResults(), getMyRegistrations()) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl border border-[#DFCEB0] shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EFE6D5] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F4EFE6] text-[#A67C37] flex items-center justify-center">
              {tab === 'calc' && <Calculator size={22} />}
              {tab === 'quiz' && <HelpCircle size={22} />}
              {tab === 'badges' && <Award size={22} />}
              {tab === 'log' && <Wrench size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {tab === 'calc' && 'מחשבון Hit Factor וסימולטור ירי'}
                {tab === 'quiz' && 'מבחן חוקי ובטיחות IPSC'}
                {tab === 'badges' && 'תגי הישגים ודרגות מועדון'}
                {tab === 'log' && 'יומן תחזוקת אקדח ותחמושת'}
              </h2>
              <span className="text-xs text-slate-500">נץ המדבר — ארגז הכלים המקצועי</span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F4EFE6] transition">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 p-2 bg-[#F4EFE6] border-b border-[#EFE6D5] text-xs font-bold text-slate-600 gap-1">
          <button
            onClick={() => setTab('calc')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${tab === 'calc' ? 'bg-[#A67C37] text-white shadow-sm' : 'hover:bg-white/60'}`}
          >
            <Calculator size={14} />
            <span>מחשבון HF</span>
          </button>
          <button
            onClick={() => setTab('quiz')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${tab === 'quiz' ? 'bg-[#A67C37] text-white shadow-sm' : 'hover:bg-white/60'}`}
          >
            <HelpCircle size={14} />
            <span>מבחן חוקה</span>
          </button>
          <button
            onClick={() => setTab('badges')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${tab === 'badges' ? 'bg-[#A67C37] text-white shadow-sm' : 'hover:bg-white/60'}`}
          >
            <Award size={14} />
            <span>הישגים</span>
          </button>
          <button
            onClick={() => setTab('log')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${tab === 'log' ? 'bg-[#A67C37] text-white shadow-sm' : 'hover:bg-white/60'}`}
          >
            <Wrench size={14} />
            <span>יומן נשק</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: HF CALCULATOR & SIMULATOR */}
          {tab === 'calc' && (
            <div className="space-y-5">
              {/* Power Factor & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Power Factor:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcInput({ ...calcInput, powerFactor: 'minor' })}
                      className={`py-2 rounded-xl font-bold text-xs border ${calcInput.powerFactor === 'minor' ? 'bg-[#A67C37] text-white border-[#A67C37]' : 'bg-white border-[#DFCEB0] text-slate-700'}`}
                    >
                      Minor (9 מ״מ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcInput({ ...calcInput, powerFactor: 'major' })}
                      className={`py-2 rounded-xl font-bold text-xs border ${calcInput.powerFactor === 'major' ? 'bg-[#A67C37] text-white border-[#A67C37]' : 'bg-white border-[#DFCEB0] text-slate-700'}`}
                    >
                      Major (.40 / .45)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">זמן בשניות (Time):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={calcInput.timeSeconds}
                    onChange={(e) => setCalcInput({ ...calcInput, timeSeconds: Number(e.target.value) || 0.1 })}
                    className="w-full p-2 rounded-xl border border-[#DFCEB0] bg-white font-mono text-center font-bold text-slate-900 text-base"
                  />
                </div>
              </div>

              {/* Hit Counter Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">פגיעות וענישות בתרגיל:</label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-[#DFCEB0] text-center">
                    <span className="text-xs font-bold text-emerald-700 block">Alpha (A)</span>
                    <input
                      type="number" min="0" value={calcInput.hitsA}
                      onChange={(e) => setCalcInput({ ...calcInput, hitsA: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full text-center font-mono font-bold text-lg text-slate-900 border-0 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-[#DFCEB0] text-center">
                    <span className="text-xs font-bold text-amber-700 block">Charlie (C)</span>
                    <input
                      type="number" min="0" value={calcInput.hitsC}
                      onChange={(e) => setCalcInput({ ...calcInput, hitsC: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full text-center font-mono font-bold text-lg text-slate-900 border-0 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-[#DFCEB0] text-center">
                    <span className="text-xs font-bold text-orange-700 block">Delta (D)</span>
                    <input
                      type="number" min="0" value={calcInput.hitsD}
                      onChange={(e) => setCalcInput({ ...calcInput, hitsD: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full text-center font-mono font-bold text-lg text-slate-900 border-0 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-rose-200 text-center">
                    <span className="text-xs font-bold text-rose-700 block">Miss (-10)</span>
                    <input
                      type="number" min="0" value={calcInput.misses}
                      onChange={(e) => setCalcInput({ ...calcInput, misses: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full text-center font-mono font-bold text-lg text-rose-600 border-0 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 bg-white rounded-xl border border-[#DFCEB0] text-center">
                    <span className="text-[11px] font-bold text-slate-700 block">מתכת (Steel +5)</span>
                    <input
                      type="number" min="0" value={calcInput.metalHits}
                      onChange={(e) => setCalcInput({ ...calcInput, metalHits: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full text-center font-mono font-bold text-slate-900 border-0 focus:outline-none"
                    />
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-rose-200 text-center">
                    <span className="text-[11px] font-bold text-rose-700 block">No-Shoot (-10)</span>
                    <input
                      type="number" min="0" value={calcInput.noShootHits}
                      onChange={(e) => setCalcInput({ ...calcInput, noShootHits: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full text-center font-mono font-bold text-rose-600 border-0 focus:outline-none"
                    />
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-rose-200 text-center">
                    <span className="text-[11px] font-bold text-rose-700 block">ענישות פקודה (-10)</span>
                    <input
                      type="number" min="0" value={calcInput.procedurals}
                      onChange={(e) => setCalcInput({ ...calcInput, procedurals: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full text-center font-mono font-bold text-rose-600 border-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Hit Factor Result Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#252C2A] to-[#3A4540] text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs text-amber-300 font-bold block">HIT FACTOR מחושב</span>
                  <div className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                    {calcResult.hitFactor.toFixed(4)}
                  </div>
                  <span className="text-xs text-slate-300">
                    נקודות סופיות: <b className="text-white font-mono">{calcResult.finalPoints}</b> / {calcResult.maxPossiblePoints}
                  </span>
                </div>

                <div className="text-left">
                  <div className="text-xs font-bold text-emerald-400">
                    {calcResult.accuracyPercent}% דיוק A
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    ענישות: <span className="font-mono text-rose-400">{calcResult.penalties} pts</span>
                  </div>
                </div>
              </div>

              {/* Tactical Simulation Breakdown */}
              <div className="p-4 bg-white rounded-2xl border border-[#EFE6D5] space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>💡</span> סימולציית תרחישי ירי (Speed vs Accuracy):
                </h4>
                <div className="text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EFE6D5]">
                    <span>⚡ ירי מהיר יותר ב-0.5 שנ׳ (באותו דיוק):</span>
                    <span className="font-mono font-bold text-emerald-700" dir="ltr">
                      HF: {fasterSimulation.newHitFactor.toFixed(2)} ({fasterSimulation.deltaHf >= 0 ? '+' : ''}{fasterSimulation.deltaHf.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EFE6D5]">
                    <span>🎯 עוד 0.4 שנ׳ לירי מבוקר (המרת 2 Charlie ל-Alpha):</span>
                    <span className="font-mono font-bold text-emerald-700" dir="ltr">
                      HF: {cleanerSimulation.newHitFactor.toFixed(2)} ({cleanerSimulation.deltaHf >= 0 ? '+' : ''}{cleanerSimulation.deltaHf.toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IPSC RULES & SAFETY QUIZ */}
          {tab === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">תרגול חוקת IPSC ובטיחות מטווח</h3>
                  <span className="text-xs text-slate-500">ענו על השאלות ובדקו את מוכנותכם למבחן ההסמכה</span>
                </div>
                {quizSubmitted && (
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300">
                    ציון: {correctCount}/{IPSC_QUIZ_QUESTIONS.length}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {IPSC_QUIZ_QUESTIONS.map((q, qIndex) => {
                  const selected = quizAnswers[q.id];
                  const isAnswered = selected !== undefined;
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <div key={q.id} className="p-4 bg-white rounded-2xl border border-[#EFE6D5] space-y-3">
                      <div className="flex items-start gap-2 font-bold text-xs text-slate-900">
                        <span className="w-5 h-5 rounded-full bg-[#F4EFE6] text-[#A67C37] flex items-center justify-center shrink-0">
                          {qIndex + 1}
                        </span>
                        <p>{q.question}</p>
                      </div>

                      <div className="space-y-1.5 pl-2">
                        {q.options.map((opt, optIndex) => {
                          let optStyle = 'bg-[#FAF8F5] border-[#EFE6D5] text-slate-700 hover:bg-[#F4EFE6]';
                          if (quizSubmitted) {
                            if (optIndex === q.correctIndex) {
                              optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                            } else if (selected === optIndex) {
                              optStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                            }
                          } else if (selected === optIndex) {
                            optStyle = 'bg-[#A67C37] border-[#A67C37] text-white font-bold';
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIndex })}
                              className={`w-full text-right p-2.5 rounded-xl border text-xs transition ${optStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                          {isCorrect ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />}
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                {quizSubmitted ? (
                  <button
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#A67C37] hover:bg-[#8C6228] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw size={15} /> מבחן חוזר
                  </button>
                ) : (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="px-6 py-2.5 rounded-xl bg-[#A67C37] hover:bg-[#8C6228] text-white font-bold text-xs shadow-sm"
                  >
                    בדיקת תשובות וציון
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACHIEVEMENT BADGES */}
          {tab === 'badges' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">תגי מועדון והישגי ירי</h3>
                <span className="text-xs text-slate-500">תגים אלו מוענקים אוטומטית לפי ביצועי הירי וההתמדה שלך</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition ${b.unlocked ? 'bg-white border-[#DFCEB0] shadow-sm' : 'bg-slate-50/60 border-slate-200 opacity-60'}`}
                  >
                    <div className="text-3xl shrink-0 p-2 bg-[#F4EFE6] rounded-2xl">
                      {b.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900">{b.title}</h4>
                        {b.unlocked ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                            הושג ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-md">
                            נעול 🔒
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">{b.description}</p>
                      <span className="text-[10px] font-mono text-amber-700 block">
                        סטטוס: {b.progressText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GUN & AMMO MAINTENANCE LOG */}
          {tab === 'log' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">מעקב בלאי אקדח ותחמושת</h3>
                <span className="text-xs text-slate-500">רישום כדורים, תאריכי ניקוי והחלפת חלקי בלאי</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EFE6D5] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">סה״כ כדורים שנורו (Round Count):</label>
                    <input
                      type="number"
                      value={gunRounds}
                      onChange={(e) => setGunRounds(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-[#DFCEB0] font-mono font-bold text-base text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">תאריך ניקוי נשק אחרון:</label>
                    <input
                      type="date"
                      value={lastCleanDate}
                      onChange={(e) => setLastCleanDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#DFCEB0] text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">קפיץ מחזיר (Recoil Spring) — כדורים מאז החלפה:</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={recoilSpringRounds}
                      onChange={(e) => setRecoilSpringRounds(Number(e.target.value))}
                      className="w-32 p-2.5 rounded-xl border border-[#DFCEB0] font-mono font-bold text-center"
                    />
                    <div className="flex-1">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full ${recoilSpringRounds > 5000 ? 'bg-rose-500' : recoilSpringRounds > 4000 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (recoilSpringRounds / 5000) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        מומלץ להחליף קפיץ כל 5,000 כדורים ({Math.max(0, 5000 - recoilSpringRounds)} נותרו)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveGunLog}
                  className="w-full py-2.5 rounded-xl bg-[#A67C37] hover:bg-[#8C6228] text-white font-bold text-xs shadow-sm transition"
                >
                  שמור יומן תחזוקה
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
