import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FalconLogo } from '../common/FalconLogo';
import { Lock, Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';

export const ForcePasswordChangeModal: React.FC = () => {
  const { currentUser, showToast, refresh } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  // If user does not need to change password, do not render
  if (!currentUser?.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('יש להזין את הסיסמה הזמנית שקיבלת מהמנהל', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('הסיסמה החדשה חייבת להכיל לפחות 6 תווים', 'error');
      return;
    }
    if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
      showToast('הסיסמה חייבת לכלול אותיות וספרות', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('הסיסמאות החדשות אינן תואמות', 'error');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'שינוי הסיסמה נכשל');
      }
      showToast('הסיסמה הוחלפה בהצלחה! ברוכים הבאים למועדון', 'success');
      await refresh();
    } catch (err: any) {
      showToast(err.message || 'אירעה שגיאה בעת שינוי הסיסמה', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/80 backdrop-blur-md animate-fade-in text-right">
      <div className="bg-[#FAF8F5] border border-[#DFCEB0] w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="flex justify-center mb-2">
          <FalconLogo size="lg" />
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
            <ShieldAlert size={14} />
            <span>החלפת סיסמה ראשונית</span>
          </div>
          <h2 className="text-xl font-bold text-graphite-900">שלום, {currentUser.fullName}</h2>
          <p className="text-xs text-graphite-600 leading-relaxed max-w-sm mx-auto">
            התחברת באמצעות סיסמה זמנית. למען אבטחת חשבונך, עליך לקבוע סיסמה אישית וקבועה לפני המשך השימוש באתר.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-graphite-800">
          <div>
            <label className="block mb-1 font-bold">סיסמה זמנית נוכחית:</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                dir="ltr"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="הסיסמה שקיבלת מהמנהל"
                className="w-full p-3 rounded-xl border border-[#DFCEB0] bg-white focus:outline-none focus:border-falcon-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-700"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1 border-t border-[#EFE6D5]">
            <div>
              <label className="block mb-1 font-bold">סיסמה קבועה חדשה:</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  dir="ltr"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים, אותיות וספרות"
                  className="w-full p-3 rounded-xl border border-[#DFCEB0] bg-white focus:outline-none focus:border-falcon-500 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-700"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold">אימות סיסמה חדשה:</label>
              <input
                type={showNew ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="הקלד שוב את הסיסמה החדשה"
                className="w-full p-3 rounded-xl border border-[#DFCEB0] bg-white focus:outline-none focus:border-falcon-500 font-mono text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 px-4 bg-falcon-500 hover:bg-falcon-600 active:bg-falcon-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {busy ? (
              <span>שומר ומעדכן...</span>
            ) : (
              <>
                <Check size={16} />
                <span>שמור סיסמה קבועה והמשך</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
