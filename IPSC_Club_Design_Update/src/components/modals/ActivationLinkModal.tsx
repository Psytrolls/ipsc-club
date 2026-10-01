import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Copy, Share2 } from 'lucide-react';
import { getWhatsAppUrl } from '../../lib/whatsapp';

export const ActivationLinkModal: React.FC = () => {
  const { activationUrl, clearActivationUrl, showToast } = useApp();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (activationUrl) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [activationUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activationUrl || '');
      showToast('הקישור הועתק ללוח', 'success');
    } catch {
      showToast('סמנו והעתיקו את הקישור ידנית', 'info');
    }
  };

  const shareText = `שלום!
מצורף קישור אישי וחד-פעמי להפעלת חשבונך במערכת מועדון הירי נץ המדבר 🦅:
${activationUrl}

הקישור בתוקף ל-24 שעות.`;

  return (
    <dialog ref={ref} className="demo-dialog text-right" onCancel={clearActivationUrl}>
      <div className="dialog-heading">
        <span className="eyebrow">קישור אישי ומאובטח</span>
        <button className="icon-button" aria-label="סגירה" onClick={clearActivationUrl}>
          <X size={20} />
        </button>
      </div>
      <h2>הפעלת חשבון והגדרת סיסמה</h2>
      <p className="text-xs text-graphite-600 leading-relaxed">
        קישור חד־פעמי בתוקף ל־24 שעות. העבירו אותו ישירות למשתמש לאחר אימות זהותו.
      </p>

      <input
        className="activation-input font-mono text-xs"
        aria-label="קישור הפעלה"
        readOnly
        value={activationUrl || ''}
        dir="ltr"
      />

      <div className="flex flex-wrap gap-2 pt-2">
        <button className="button-primary flex-1 flex items-center justify-center gap-2" onClick={handleCopy}>
          <Copy size={16} />
          <span>העתקת קישור</span>
        </button>
        <a
          href={getWhatsAppUrl('', shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className="button-outline flex items-center justify-center gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
        >
          <Share2 size={16} />
          <span>שליחה בוואטסאפ</span>
        </a>
      </div>
    </dialog>
  );
};
