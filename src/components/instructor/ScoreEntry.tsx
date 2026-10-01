import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Registration, TrainingSession } from '../../types';
import { X, Target, Clock, ShieldAlert, Award, ChevronRight } from 'lucide-react';

export const ScoreEntry: React.FC<{
  training: TrainingSession;
  shooter: Registration;
  onClose: () => void;
  onNext: () => void;
}> = ({ training, shooter, onClose, onNext }) => {
  const { exerciseTemplates, addExerciseResult, users } = useApp();
  const templates = exerciseTemplates.filter(t => training.exerciseIds?.includes(t.id));

  const [selected, setSelected] = useState(templates[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState(false);
  const [pf, setPf] = useState<'minor' | 'major'>('minor');
  const [error, setError] = useState('');
  const [division, setDivision] = useState(users.find(u => u.id === shooter.userId)?.division || 'Production Optics');

  const [values, setValues] = useState({
    hitsA: 0,
    hitsC: 0,
    hitsD: 0,
    misses: 0,
    metalHits: 0,
    metalMisses: 0,
    noShootHits: 0,
    procedurals: 0,
    timeSeconds: 0
  });

  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    setValues({
      hitsA: 0,
      hitsC: 0,
      hitsD: 0,
      misses: 0,
      metalHits: 0,
      metalMisses: 0,
      noShootHits: 0,
      procedurals: 0,
      timeSeconds: 0
    });
    setError('');
    const u = users.find(u => u.id === shooter.userId);
    if (u?.division) setDivision(u.division);
  }, [selected, shooter.userId]);

  const tpl = templates.find(t => t.id === selected);
  const paperRequired = (tpl?.paper || 0) * (tpl?.hitsPerPaper || 0);
  const metalRequired = (tpl?.plates || 0) + (tpl?.poppers || 0);

  const paperEntered = values.hitsA + values.hitsC + values.hitsD + values.misses;
  const metalEntered = values.metalHits + values.metalMisses;

  const raw = Math.max(
    0,
    values.hitsA * 5 +
      values.hitsC * (pf === 'major' ? 4 : 3) +
      values.hitsD * (pf === 'major' ? 2 : 1) +
      values.metalHits * 5 -
      10 * (values.misses + values.metalMisses + values.noShootHits + values.procedurals)
  );

  const hitFactor = values.timeSeconds > 0 ? raw / values.timeSeconds : 0;

  const handleSubmit = async (e: React.FormEvent, proceedToNext: boolean) => {
    e.preventDefault();
    setError('');

    if (paperEntered !== paperRequired && paperRequired > 0) {
      setError(`סך פגיעות והחטאות בקרטון חייב להיות שווה ל-${paperRequired} (הוזנו: ${paperEntered})`);
      return;
    }

    if (metalEntered !== metalRequired && metalRequired > 0) {
      setError(`סך מטרות מתכת (פגיעות + החטאות) חייב להיות שווה ל-${metalRequired} (הוזנו: ${metalEntered})`);
      return;
    }

    if (!values.timeSeconds || values.timeSeconds <= 0) {
      setError('יש להזין זמן ריצה בשניות.');
      return;
    }

    setBusy(true);
    try {
      const saved = await addExerciseResult({
        trainingId: training.id,
        trainingDate: training.date,
        exerciseTemplateId: tpl!.id,
        exerciseTemplateName: tpl!.name,
        userId: shooter.userId,
        userName: shooter.userName,
        ...values,
        division,
        powerFactor: pf,
        rawPoints: raw,
        hitFactor
      });

      if (saved) {
        if (proceedToNext) {
          onNext();
        } else {
          onClose();
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const updateField = (key: keyof typeof values, delta: number) => {
    setValues(v => ({
      ...v,
      [key]: Math.max(0, (v[key] || 0) + delta)
    }));
  };

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right max-w-xl w-full mx-auto my-auto rounded-3xl border border-[#EFE6D5] bg-white shadow-2xl overflow-hidden"
    >
      <div className="w-full flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-graphite-900 to-graphite-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Target className="text-falcon-400" size={20} />
            <div>
              <h2 className="text-base font-black text-white">הזנת תוצאה — {shooter.userName}</h2>
              <span className="text-[11px] text-graphite-300">{training.title} | {training.date}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {!tpl ? (
          <div className="p-8 text-center text-xs text-graphite-600">
            יש להגדיר תרגילים לאימון לפני הזנת תוצאות.
          </div>
        ) : (
          <form
            onSubmit={e => handleSubmit(e, next)}
            className="p-4 space-y-4 overflow-y-auto text-xs text-graphite-800"
          >
            {/* Exercise & Division Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block font-bold mb-1">תרגיל:</label>
                <select
                  value={selected}
                  onChange={e => setSelected(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] font-bold"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">מחלקת ירי:</label>
                <select
                  value={division}
                  onChange={e => setDivision(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] font-bold"
                >
                  {['Open', 'Standard', 'Classic', 'Production', 'Production Optics', 'Optics', 'Revolver'].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Power Factor:</label>
                <select
                  value={pf}
                  onChange={e => setPf(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] font-bold"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                </select>
              </div>
            </div>

            {/* Target Breakdown Tracker */}
            <div className="flex items-center justify-between px-3 py-2 bg-falcon-50 border border-falcon-200 rounded-xl text-[11px] font-bold">
              <span>
                קרטון: {paperEntered}/{paperRequired} {paperEntered === paperRequired ? '✅' : '⚠️'}
              </span>
              <span>
                מתכת: {metalEntered}/{metalRequired} {metalEntered === metalRequired ? '✅' : '⚠️'}
              </span>
            </div>

            {/* Range Scoring Touch Pad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Hits A */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl text-center space-y-1">
                <span className="font-black text-sm text-emerald-900 block">Alpha (A)</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('hitsA', -1)}
                    className="w-9 h-9 rounded-xl bg-white text-emerald-900 font-black text-lg border border-emerald-300 active:scale-95 shadow-sm"
                  >
                    −
                  </button>
                  <span className="font-mono font-black text-xl text-emerald-950 w-7 text-center">
                    {values.hitsA}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField('hitsA', 1)}
                    className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-lg active:scale-95 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hits C */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-300 rounded-2xl text-center space-y-1">
                <span className="font-black text-sm text-amber-900 block">Charlie (C)</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('hitsC', -1)}
                    className="w-9 h-9 rounded-xl bg-white text-amber-900 font-black text-lg border border-amber-300 active:scale-95 shadow-sm"
                  >
                    −
                  </button>
                  <span className="font-mono font-black text-xl text-amber-950 w-7 text-center">
                    {values.hitsC}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField('hitsC', 1)}
                    className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-lg active:scale-95 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hits D */}
              <div className="p-2.5 bg-sky-50/70 border border-sky-300 rounded-2xl text-center space-y-1">
                <span className="font-black text-sm text-sky-900 block">Delta (D)</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('hitsD', -1)}
                    className="w-9 h-9 rounded-xl bg-white text-sky-900 font-black text-lg border border-sky-300 active:scale-95 shadow-sm"
                  >
                    −
                  </button>
                  <span className="font-mono font-black text-xl text-sky-950 w-7 text-center">
                    {values.hitsD}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField('hitsD', 1)}
                    className="w-9 h-9 rounded-xl bg-sky-600 text-white font-black text-lg active:scale-95 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Misses */}
              <div className="p-2.5 bg-rose-50/70 border border-rose-300 rounded-2xl text-center space-y-1">
                <span className="font-black text-sm text-rose-900 block">Miss (קרטון)</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('misses', -1)}
                    className="w-9 h-9 rounded-xl bg-white text-rose-900 font-black text-lg border border-rose-300 active:scale-95 shadow-sm"
                  >
                    −
                  </button>
                  <span className="font-mono font-black text-xl text-rose-950 w-7 text-center">
                    {values.misses}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField('misses', 1)}
                    className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-lg active:scale-95 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Metal Hits */}
              <div className="p-2.5 bg-[#FAF8F5] border border-[#DFCEB0] rounded-2xl text-center space-y-1">
                <span className="font-bold text-xs text-graphite-900 block">מתכת — פגע</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('metalHits', -1)}
                    className="w-8 h-8 rounded-lg bg-white text-graphite-800 font-black border border-gray-300 active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-mono font-bold text-base w-6 text-center">{values.metalHits}</span>
                  <button
                    type="button"
                    onClick={() => updateField('metalHits', 1)}
                    className="w-8 h-8 rounded-lg bg-graphite-800 text-white font-black active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Metal Misses */}
              <div className="p-2.5 bg-[#FAF8F5] border border-[#DFCEB0] rounded-2xl text-center space-y-1">
                <span className="font-bold text-xs text-graphite-900 block">מתכת — החטאה</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('metalMisses', -1)}
                    className="w-8 h-8 rounded-lg bg-white text-graphite-800 font-black border border-gray-300 active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-mono font-bold text-base w-6 text-center">{values.metalMisses}</span>
                  <button
                    type="button"
                    onClick={() => updateField('metalMisses', 1)}
                    className="w-8 h-8 rounded-lg bg-rose-700 text-white font-black active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* No-Shoot */}
              <div className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-2xl text-center space-y-1">
                <span className="font-bold text-xs text-rose-800 block">No-Shoot</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('noShootHits', -1)}
                    className="w-8 h-8 rounded-lg bg-white text-rose-800 font-black border border-rose-300 active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-mono font-bold text-base w-6 text-center">{values.noShootHits}</span>
                  <button
                    type="button"
                    onClick={() => updateField('noShootHits', 1)}
                    className="w-8 h-8 rounded-lg bg-rose-800 text-white font-black active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Procedurals */}
              <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-2xl text-center space-y-1">
                <span className="font-bold text-xs text-amber-800 block">ענישה (Proc)</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('procedurals', -1)}
                    className="w-8 h-8 rounded-lg bg-white text-amber-800 font-black border border-amber-300 active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-mono font-bold text-base w-6 text-center">{values.procedurals}</span>
                  <button
                    type="button"
                    onClick={() => updateField('procedurals', 1)}
                    className="w-8 h-8 rounded-lg bg-amber-800 text-white font-black active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Time input */}
            <div>
              <label className="block font-bold mb-1">זמן (שניות בטיימר):</label>
              <div className="relative">
                <input
                  dir="ltr"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  max={36000}
                  required
                  placeholder="0.00"
                  value={values.timeSeconds || ''}
                  onChange={e => setValues({ ...values, timeSeconds: Number(e.target.value) })}
                  className="w-full p-3 rounded-2xl border border-[#DFCEB0] bg-[#FAF8F5] text-lg font-mono font-black text-center"
                />
              </div>
            </div>

            {/* Live Real-time Hit Factor Summary Bar */}
            <div className="bg-gradient-to-r from-graphite-950 to-graphite-900 p-4 rounded-2xl text-white flex items-center justify-around shadow-inner border border-graphite-700">
              <div className="text-center">
                <div className="text-xl font-black text-falcon-300 font-mono">{raw}</div>
                <div className="text-[10px] text-graphite-300">נקודות גולמיות</div>
              </div>

              <div className="h-8 w-px bg-graphite-700" />

              <div className="text-center">
                <div className="text-2xl font-black text-[#DFCEB0] font-mono">
                  {values.timeSeconds > 0 ? hitFactor.toFixed(4) : '0.0000'}
                </div>
                <div className="text-[10px] text-falcon-400 font-bold">Hit Factor (HF)</div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy}
                onClick={() => setNext(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-xs font-bold transition-all shadow-sm"
              >
                שמור תוצאה
              </button>
              <button
                type="submit"
                disabled={busy}
                onClick={() => setNext(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-graphite-900 hover:bg-graphite-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <span>שמור והיורה הבא</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
