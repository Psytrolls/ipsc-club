import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { X, CheckCircle, ShieldCheck } from "lucide-react";
import { TargetIcon } from "../common/TargetIcon";

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose }) => {
  const { submitLeadInquiry } = useApp();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [courseDetails, setCourseDetails] = useState("");
  const [courseDate, setCourseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    const saved = await submitLeadInquiry({
      type: "club_join",
      fullName,
      phone,
      email,
      courseDetails,
      courseDate,
      notes,
    });

    if (!saved) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
      setCourseDetails("");
      setCourseDate("");
      setNotes("");
    }, 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="JoinModal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#EFE6D5] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-graphite-900 to-graphite-800 p-6 text-white relative">
          <button
            aria-label="סגירה"
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-falcon-500/20 border border-falcon-500/40 flex items-center justify-center">
              <ShieldCheck size={28} className="text-falcon-400" />
            </div>
            <div>
              <h3 id="JoinModal-title" className="text-xl font-black">
                בקשת הצטרפות למועדון
              </h3>
              <p className="text-xs text-graphite-300 mt-0.5">
                ליורים מוסמכי קורס ירי מעשי (IPSC) המעוניינים להתאמן קבוע
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={36} />
            </div>
            <h4 className="text-lg font-bold text-graphite-900">
              בקשתך נרשמה בהצלחה!
            </h4>
            <p className="text-sm text-graphite-600 max-w-xs mx-auto">
              הפנייה התקבלה. צוות המועדון ייצור איתכם קשר להמשך התהליך.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="content-demo-label">
              הפרטים יועברו לצוות המועדון לצורך יצירת קשר.
            </p>
            <div className="bg-[#FAF8F5] border border-[#EFE6D5] p-3.5 rounded-2xl text-xs text-graphite-700 leading-relaxed">
              <strong>שים לב:</strong> טופס זה מיועד למי שכבר עבר בהצלחה קורס
              ירי מעשי מוכר. לאחר אימות הנתונים מול המועדון / התאחדות הקליעה,
              יישלח אליך קישור להפעלת החשבון האישי.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1">
                  שם מלא <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="יוסי כהן"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1">
                  טלפון נייד <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="052-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 mb-1">
                דואר אלקטרוני
              </label>
              <input
                type="email"
                placeholder="yossi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1">
                  היכן עברת את הקורס?
                </label>
                <input
                  type="text"
                  placeholder="לדוגמה: מועדון מרכז / התאחדות"
                  value={courseDetails}
                  onChange={(e) => setCourseDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1">
                  שנת / חודש סיום הקורס
                </label>
                <input
                  type="text"
                  placeholder="לדוגמה: 2024"
                  value={courseDate}
                  onChange={(e) => setCourseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 mb-1">
                הערות, אקדח נוכחי וקליבר
              </label>
              <textarea
                rows={2}
                placeholder="סוג אקדח, קטגוריית ירי (Production / Standard / Optics) וכו'..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-graphite-600 hover:bg-gray-100 text-sm font-semibold transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-graphite-900 hover:bg-black text-white text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <span>הגשת בקשת הצטרפות</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
