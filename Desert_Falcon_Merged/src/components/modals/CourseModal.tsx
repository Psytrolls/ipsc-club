import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { X, CheckCircle, Award } from "lucide-react";
import { TargetIcon } from "../common/TargetIcon";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { submitLeadInquiry } = useApp();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [availability, setAvailability] = useState("בוקר");
  const [previousExperience, setPreviousExperience] = useState("");
  const [notes, setNotes] = useState("");
  const [licenseStatus,setLicenseStatus]=useState<''|'licensed'|'approval_needed'|'discuss'>('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    const saved = await submitLeadInquiry({
      type: "course_inquiry",
      fullName,
      phone,
      email,
      availability,
      previousExperience,
      licenseStatus:licenseStatus||undefined,
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
      setPreviousExperience("");
      setNotes("");
      setLicenseStatus("");
    }, 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="CourseModal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right"
    >
      <div className="bg-white w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl shadow-2xl border border-[#EFE6D5]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-falcon-600 to-falcon-500 p-6 text-white relative">
          <button
            aria-label="סגירה"
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <TargetIcon size={28} className="text-white" />
            </div>
            <div>
              <h3 id="CourseModal-title" className="text-xl font-black">
                הרשמה לקורס ירי מעשי
              </h3>
              <p className="text-xs text-falcon-100 mt-0.5">
                הכשרה מקיפה להסמכת יורה ספורטיבי IPSC בישראל
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={36} />
            </div>
            <h4 className="text-lg font-bold text-graphite-900">
              פנייתך נרשמה בהצלחה!
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
            <div className="bg-falcon-50 border border-falcon-200 p-3.5 rounded-2xl text-xs text-falcon-900 leading-relaxed flex items-start gap-2.5">
              <Award size={18} className="text-falcon-600 shrink-0 mt-0.5" />
              <div>
                <strong>למי מתאים הקורס?</strong> למי שרוצים להתחיל בירי מעשי ספורטיבי. רישיון נשק פרטי אינו תמיד תנאי מוקדם: ללא רישיון נדרשים אישורים מראש מהרשויות ומהתאחדות הקליעה. תנאי הקבלה כוללים בדיקת התאמה, בריאות ורישום באיגוד. לקטינים נבדקים גם גיל ואישור הורים. ההרשמה באתר היא תחילת התהליך; השתתפות מותנית באישור המועדון.
                
              </div>
            </div>

            <label className="block">רישיון נשק<select className="activation-input" required value={licenseStatus} onChange={e=>setLicenseStatus(e.target.value as typeof licenseStatus)}><option value="">בחרו</option><option value="licensed">יש לי רישיון פרטי בתוקף</option><option value="approval_needed">אין לי רישיון — מבקש/ת לבדוק מסלול אישורים</option><option value="discuss">אעדכן בשיחה עם המועדון</option></select></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1">
                  שם מלא <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ישראל ישראלי"
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
                  placeholder="050-1234567"
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
                placeholder="israel@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 mb-1">
                זמינות עיקרית לאימונים
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
              >
                <option value="בוקר">בוקר</option>
                <option value="ערב">ערב</option>
                <option value="סוף שבוע">סוף שבוע</option>
                <option value="גמיש לכל שעה">גמיש לכל שעה</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 mb-1">
                ניסיון קודם בנשק / סוג אקדח
              </label>
              <input
                type="text"
                placeholder="לדוגמה: מחזיק גלוק 19 מזה שנתיים, ללא רקע תחרותי"
                value={previousExperience}
                onChange={(e) => setPreviousExperience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCEB0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-falcon-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-graphite-700 mb-1">
                הערות או שאלות נוספות
              </label>
              <textarea
                rows={2}
                placeholder="שאלות לגבי ציוד, ציוד נדרש או תאריכי פתיחה..."
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
                className="px-6 py-2.5 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold shadow-md transition-all"
              >
                הרשמה לקורס
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
