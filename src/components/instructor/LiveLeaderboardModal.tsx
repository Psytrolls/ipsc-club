import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExerciseResult, TrainingSession } from '../../types';
import { X, Trophy, Maximize2, Minimize2, Tv, Users, Target, Clock, ArrowUpDown } from 'lucide-react';

export const LiveLeaderboardModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialExerciseName?: string;
  training?: TrainingSession;
}> = ({ isOpen, onClose, initialExerciseName, training }) => {
  const { exerciseResults, exerciseTemplates, users } = useApp();
  const [fullscreen, setFullscreen] = useState(false);

  // Group results by exercise template (filtered by training if provided and has results, else all)
  const scopedResults = training
    ? exerciseResults.filter(r => r.trainingId === training.id)
    : exerciseResults;
  
  const resultsSource = scopedResults.length > 0 ? scopedResults : exerciseResults;
  const availableExercises = Array.from(new Set(resultsSource.map(r => r.exerciseTemplateName)));
  const [selectedExercise, setSelectedExercise] = useState(
    initialExerciseName || availableExercises[0] || ''
  );

  const stageResults = resultsSource
    .filter(r => r.exerciseTemplateName === (selectedExercise || availableExercises[0]))
    .sort((a, b) => b.hitFactor - a.hitFactor);

  const maxHitFactor = stageResults[0]?.hitFactor || 0;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md ${fullscreen ? 'p-0' : ''}`}>
      <div className={`bg-[#FAF8F5] w-full rounded-3xl border border-[#DFCEB0] shadow-2xl flex flex-col overflow-hidden ${fullscreen ? 'h-full rounded-none max-w-none border-0' : 'max-w-4xl max-h-[92dvh]'}`}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 bg-[#252C2A] text-white border-b border-black/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#A67C37] flex items-center justify-center text-white shadow-md">
              <Trophy size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 font-mono tracking-wider">LIVE MATCH TV</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">לוח תוצאות ודירוג אימון חי</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title={fullscreen ? 'יציאה ממסך מלא' : 'מסך מלא למטווח (TV Mode)'}
            >
              {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Exercise Selector Bar */}
        <div className="p-3 sm:p-4 bg-[#F4EFE6] border-b border-[#EFE6D5] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">בחר תרגיל:</span>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#DFCEB0] text-xs font-bold text-slate-900"
            >
              {availableExercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-3">
            <span>יורים שביצעו: <b className="text-slate-900">{stageResults.length}</b></span>
            <span>שיא מקצה: <b className="text-[#A67C37] font-mono">{maxHitFactor.toFixed(4)} HF</b></span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {stageResults.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Tv size={48} className="mx-auto text-slate-300" />
              <p className="font-bold text-base">טרם הוזנו תוצאות לתרגיל זה</p>
              <span className="text-xs">תוצאות שיוזנו על ידי המדריכים יופיעו כאן בזמן אמת</span>
            </div>
          ) : (
            <div className="space-y-2">
              {stageResults.map((res, index) => {
                const shooter = users.find(u => u.id === res.userId);
                const percent = maxHitFactor > 0 ? (res.hitFactor / maxHitFactor) * 100 : 0;
                const isWinner = index === 0;

                return (
                  <div
                    key={res.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isWinner
                        ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/40 border-amber-300 shadow-md ring-1 ring-amber-200'
                        : 'bg-white border-[#EFE6D5] hover:border-[#DFCEB0] shadow-xs'
                    }`}
                  >
                    {/* Rank & Shooter */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        index === 0 ? 'bg-[#A67C37] text-white shadow-sm' :
                        index === 1 ? 'bg-slate-300 text-slate-800' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900">
                          {shooter?.fullName || res.userId}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {res.division} • {res.powerFactor}
                        </span>
                      </div>
                    </div>

                    {/* Hits & Time Breakdown */}
                    <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-600">
                      <span className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                        {res.hitsA}A / {res.hitsC}C / {res.hitsD}D {res.misses > 0 && <b className="text-rose-600">/{res.misses}M</b>}
                      </span>
                      <span>
                        ⏱️ <b className="text-slate-900">{res.timeSeconds.toFixed(2)}s</b>
                      </span>
                      <span>
                        🎯 <b className="text-slate-900">{res.rawPoints} pts</b>
                      </span>
                    </div>

                    {/* Hit Factor & Stage % */}
                    <div className="text-left flex items-center gap-4">
                      <div className="w-24 hidden sm:block">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                          <span>{percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full ${isWinner ? 'bg-[#A67C37]' : 'bg-slate-700'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block tracking-wider">HIT FACTOR</span>
                        <div className={`text-xl sm:text-2xl font-black font-mono leading-none ${isWinner ? 'text-[#A67C37]' : 'text-slate-900'}`}>
                          {res.hitFactor.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
