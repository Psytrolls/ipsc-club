import React,{useState,useEffect} from "react";
import { useApp } from "../../context/AppContext";
import {MemberFields} from "../common/MemberFields";
import {ProfilePhoto} from "../common/ProfilePhoto";
import {api} from "../../context/AppContext";
import {User as ClubUser} from "../../types";
import { TargetIcon } from "../common/TargetIcon";
import {
  User,
  Phone,
  Mail,
  Award,
  ShieldCheck,
  Calendar,
  Lock,
  LogOut,
  CheckCircle2,
} from "lucide-react";

export const ShooterProfile: React.FC = () => {
  const { currentUser, logoutUser,saveProfile,showToast,refresh } = useApp();
 const [draft,setDraft]=useState<Partial<ClubUser>>({});const [busy,setBusy]=useState(false);const [oldPassword,setOldPassword]=useState(''),[newPassword,setNewPassword]=useState('');useEffect(()=>{if(currentUser)setDraft({birthDate:currentUser.birthDate||'',shooterNumber:currentUser.shooterNumber||'',division:currentUser.division||'',classification:currentUser.classification||''});},[currentUser?.id]);

  if (!currentUser) return null;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-12 text-right">
      <div className="pt-2">
        <h2 className="text-2xl font-black text-graphite-900">פרופיל יורה</h2>
        <p className="text-xs text-graphite-500">
          פרטים אישיים, סטטוס חברות והגדרות חשבון
        </p>
      </div>

      {/* Member Card */}
      <div className="bg-gradient-to-r from-graphite-900 to-graphite-800 rounded-3xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none">
          <TargetIcon size={160} className="text-white" />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <ProfilePhoto user={currentUser} editable/>
          <div>
            <h3 className="text-xl font-black">{currentUser.fullName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>
                  {currentUser.membershipStatus === "active"
                    ? "חבר מועדון פעיל"
                    : "מושהה / ממתין"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-graphite-700/80 grid grid-cols-2 gap-3 text-xs text-graphite-300 relative z-10">
          <div>
            <span className="text-graphite-400 block text-[11px]">
              תאריך הצטרפות:
            </span>
            <span className="font-mono text-white">
              {currentUser.joinedDate}
            </span>
          </div>
          <div>
            <span className="text-graphite-400 block text-[11px]">
              מזהה יורה:
            </span>
            <span className="font-mono text-white">{currentUser.shooterNumber||"טרם הוגדר"}</span>
          </div>
        </div>
      </div>

      <form className="dashboard-card space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await saveProfile(draft);}finally{setBusy(false);}}}><h3>פרטי יורה</h3><MemberFields value={draft} onChange={setDraft}/><button className="button-primary" disabled={busy}>שמירת פרטי יורה</button></form>
      {/* Course Verification Card */}
      <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-graphite-900">
          <Award size={18} className="text-falcon-600" />
          <span>אימות קורס והסמכת IPSC</span>
        </div>

        <div className="bg-falcon-50 border border-falcon-200 p-3.5 rounded-2xl text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-falcon-950">סטטוס אימות:</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
              {currentUser.ipscCourseVerified
                ? "מאומת ע״י הנהלת המועדון"
                : "בהמתנה לבדיקת מסמכים"}
            </span>
          </div>
          <p className="text-falcon-900 text-xs">
            {currentUser.ipscCourseDetails}
          </p>
        </div>
      </div>

      {/* Contact info list */}
      <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-graphite-900">פרטי קשר</h3>

        <div className="space-y-2.5 text-xs text-graphite-700">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFE6D5]">
            <span className="flex items-center gap-2 text-graphite-500">
              <Mail size={15} className="text-falcon-600" />
              <span>דוא״ל:</span>
            </span>
            <span className="font-bold font-mono">{currentUser.email}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFE6D5]">
            <span className="flex items-center gap-2 text-graphite-500">
              <Phone size={15} className="text-falcon-600" />
              <span>טלפון נייד:</span>
            </span>
            <span className="font-bold font-mono">{currentUser.phone}</span>
          </div>
        </div>
      </div>

      {/* Security & Password */}
      <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-graphite-900">
          <ShieldCheck size={18} className="text-falcon-600" />
          <span>אבטחה וכניסה</span>
        </div>

        <p className="text-xs text-graphite-600 leading-relaxed">
          הכניסה מתבצעת באמצעות שם משתמש או דוא״ל וסיסמה. במקרה של אובדן גישה
          פנו למנהל המועדון לאימות זהות ולקבלת קישור שחזור.
        </p>

        <form className="space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await api('/auth/password/change','POST',{currentPassword:oldPassword,password:newPassword});setOldPassword('');setNewPassword('');await refresh();showToast('הסיסמה עודכנה','success');}catch(e){showToast(e instanceof Error?e.message:'הפעולה נכשלה','error');}finally{setBusy(false);}}}><label className="block">סיסמה נוכחית<input type="password" className="activation-input" autoComplete="current-password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} required/></label><p>לפחות 6 תווים, כולל אותיות וספרות. מומלץ לבחור סיסמה ארוכה יותר.</p><label className="block">סיסמה חדשה<input type="password" className="activation-input" autoComplete="new-password" minLength={6} maxLength={72} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/></label><button className="button-outline" disabled={busy}>שינוי סיסמה</button></form>
        <div className="pt-2">
          <button
            onClick={logoutUser}
            className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>התנתקות מהחשבון</span>
          </button>
        </div>
      </div>
    </div>
  );
};
