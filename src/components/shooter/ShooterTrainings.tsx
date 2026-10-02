import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { TrainingSession } from "../../types";
import { downloadIcsFile, getGoogleCalendarUrl } from "../../lib/calendar";
import { getWazeNavigationUrl, getGoogleMapsNavigationUrl } from "../../lib/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ShieldCheck,
  X,
  CalendarPlus,
  ExternalLink,
  Navigation,
  Target,
  Trophy
} from "lucide-react";
import { IpscMatchesHub } from "../common/IpscMatchesHub";
import { TargetIcon } from "../common/TargetIcon";

interface ShooterTrainingsProps {
  onOpenTrainingDetails: (trainingId: string) => void;
}

export const ShooterTrainings: React.FC<ShooterTrainingsProps> = ({
  onOpenTrainingDetails,
}) => {
  const {
    trainings,
    registrations,
    currentUser,
    registerForTraining,
    cancelRegistration,
  } = useApp();
  const [scheduleType, setScheduleType] = useState<"club" | "matches">("club");
  const [filter, setFilter] = useState<"upcoming" | "my" | "past">("upcoming");

  const myRegs = registrations.filter(
    (r) => r.userId === currentUser?.id && r.status !== "cancelled",
  );

  const upcomingTrainings = trainings.filter(
    (t) =>
      t.status === "scheduled" &&
      new Date(`${t.date}T${t.startTime}:00`).getTime() >= Date.now(),
  );
  const pastTrainings = trainings.filter((t) => t.status === "completed");

  const displayedTrainings =
    filter === "my"
      ? trainings.filter((t) => myRegs.some((r) => r.trainingId === t.id))
      : filter === "past"
        ? pastTrainings
        : upcomingTrainings;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12 text-right">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-black text-graphite-900">לוח אימונים ותחרויות</h2>
          <p className="text-sm text-graphite-500">
            אימוני מועדון פנימיים ותחרויות IPSC ארציות ב-End of Scoring
          </p>
        </div>
      </div>

      {/* Main Switcher: Club Trainings vs Israeli IPSC Matches */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-white rounded-2xl border border-[#DFCEB0] shadow-xs">
        <button
          onClick={() => setScheduleType("club")}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
            scheduleType === "club"
              ? "bg-[#A67C37] text-white shadow-sm"
              : "text-slate-700 hover:bg-[#FAF8F5]"
          }`}
        >
          <Target size={15} />
          <span>אימוני מועדון נץ המדבר</span>
        </button>

        <button
          onClick={() => setScheduleType("matches")}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
            scheduleType === "matches"
              ? "bg-[#252C2A] text-amber-400 shadow-sm"
              : "text-slate-700 hover:bg-[#FAF8F5]"
          }`}
        >
          <Trophy size={15} />
          <span>תחרויות ארציות (EOS)</span>
        </button>
      </div>

      {scheduleType === "matches" ? (
        <IpscMatchesHub compact />
      ) : (
        <>
          {/* Filter Tabs for Club Trainings */}
          <div className="flex gap-2 p-1 bg-[#EFE6D5]/60 rounded-2xl border border-[#DFCEB0] text-sm font-bold">
        <button
          onClick={() => setFilter("upcoming")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === "upcoming"
              ? "bg-[#8C6228] text-white shadow-sm"
              : "text-graphite-700 hover:text-graphite-900"
          }`}
        >
          אימונים קרובים
        </button>
        <button
          onClick={() => setFilter("my")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === "my"
              ? "bg-[#8C6228] text-white shadow-sm"
              : "text-graphite-700 hover:text-graphite-900"
          }`}
        >
          ההרשמות שלי ({myRegs.length})
        </button>
        <button
          onClick={() => setFilter("past")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === "past"
              ? "bg-[#8C6228] text-white shadow-sm"
              : "text-graphite-700 hover:text-graphite-900"
          }`}
        >
          היסטוריה
        </button>
      </div>

      {/* Trainings List */}
      <div className="space-y-3">
        {displayedTrainings.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#EFE6D5] space-y-2">
            <Calendar size={32} className="text-falcon-400 mx-auto" />
            <p className="text-sm font-bold text-graphite-800">
              אין אימונים להצגה בסינון זה
            </p>
          </div>
        ) : (
          displayedTrainings.map((training) => {
            const userReg = myRegs.find((r) => r.trainingId === training.id);
            const isRegistered = !!userReg && userReg.status === "confirmed";
            const isWaitlisted = !!userReg && userReg.status === "waitlist";
            const isFull = training.registeredCount >= training.maxCapacity;

            return (
              <div
                key={training.id}
                className="bg-white rounded-3xl border border-[#EFE6D5] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-falcon-700">
                      {training.type}
                    </div>
                    <h3 className="text-base font-black text-graphite-900">
                      {training.title}
                    </h3>
                  </div>

                  {isRegistered ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold px-2.5 py-1 rounded-full shrink-0">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>נרשמת</span>
                    </span>
                  ) : isWaitlisted ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold px-2.5 py-1 rounded-full shrink-0">
                      <AlertCircle size={13} className="text-amber-600" />
                      <span>המתנה #{userReg?.waitlistPosition}</span>
                    </span>
                  ) : isFull ? (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 text-sm font-bold px-2.5 py-1 rounded-full shrink-0">
                      מלא (רשימת המתנה)
                    </span>
                  ) : (
                    <span className="bg-[#FAF8F5] text-graphite-700 border border-[#DFCEB0] text-sm font-bold px-2.5 py-1 rounded-full shrink-0">
                      פתוח להרשמה
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm text-graphite-600 bg-[#FAF8F5] p-3 rounded-2xl border border-[#EFE6D5]">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-falcon-600" />
                    <span>
                      {training.date} (יום{" "}
                      {new Date(training.date).toLocaleDateString("he-IL", {
                        weekday: "narrow",
                      })}
                      )
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-falcon-600" />
                    <span>
                      {training.startTime} - {training.endTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={14} className="text-falcon-600 shrink-0" />
                      <span className="truncate font-semibold">
                        {training.location || 'מטווח נץ המדבר'}
                      </span>
                    </div>
                    <a
                      href={training.locationMapUrl || getWazeNavigationUrl(training.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 hover:bg-sky-100 shrink-0"
                      title="ניווט ב-Waze"
                    >
                      <Navigation size={11} />
                      <span>Waze</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-falcon-600" />
                    <span>
                      {training.registeredCount}/{training.maxCapacity} יורים
                    </span>
                  </div>
                </div>

                <p className="text-sm text-graphite-600 line-clamp-2 leading-relaxed">
                  {training.description}
                </p>

                {/* Card Actions */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenTrainingDetails(training.id)}
                      className="py-2 px-3 text-sm font-bold text-graphite-700 hover:text-graphite-900 border border-[#DFCEB0] rounded-xl hover:bg-[#F4EFE6] transition-all"
                    >
                      פרטים
                    </button>

                    {isRegistered && (
                      <button
                        onClick={() => downloadIcsFile(training)}
                        className="py-2 px-2.5 text-sm font-bold text-falcon-800 bg-falcon-50 hover:bg-falcon-100 border border-falcon-200 rounded-xl transition-all flex items-center gap-1"
                        title="הוסף ליומן (Apple / Outlook / Google)"
                      >
                        <CalendarPlus size={13} />
                        <span>ליומן</span>
                      </button>
                    )}
                  </div>

                  {isRegistered ? (
                    <button
                      onClick={() => userReg && cancelRegistration(userReg.id)}
                      className="py-2 px-4 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                    >
                      ביטול הרשמה
                    </button>
                  ) : isWaitlisted ? (
                    <button
                      onClick={() => userReg && cancelRegistration(userReg.id)}
                      className="py-2 px-4 text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
                    >
                      ביטול המתנה
                    </button>
                  ) : (
                    <button
                      onClick={() => registerForTraining(training.id)}
                      className={`py-2 px-4 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                        isFull
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-falcon-500 hover:bg-falcon-600"
                      }`}
                    >
                      {isFull ? "כניסה לרשימת המתנה" : "הרשמה לאימון"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </>
      )}
    </div>
  );
};

export const TrainingDetailsModal: React.FC<{
  trainingId: string | null;
  onClose: () => void;
}> = ({ trainingId, onClose }) => {
  const {
    trainings,
    registrations,
    currentUser,
    registerForTraining,
    cancelRegistration,
  } = useApp();

  if (!trainingId || !currentUser || currentUser.membershipStatus !== "active")
    return null;
  const training = trainings.find((t) => t.id === trainingId);
  if (!training) return null;

  const userReg = registrations.find(
    (r) =>
      r.trainingId === training.id &&
      r.userId === currentUser?.id &&
      r.status !== "cancelled",
  );
  const isRegistered = !!userReg && userReg.status === "confirmed";
  const isWaitlisted = !!userReg && userReg.status === "waitlist";
  const isFull = training.registeredCount >= training.maxCapacity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#EFE6D5] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-falcon-600 to-falcon-500 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="text-sm font-bold text-falcon-100">
            {training.type}
          </div>
          <h3 className="text-xl font-black">{training.title}</h3>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-graphite-800 text-sm leading-relaxed">
          <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE6D5] text-sm">
            <div>
              <span className="text-graphite-500 block">תאריך:</span>
              <span className="font-bold text-graphite-900">
                {training.date}
              </span>
            </div>
            <div>
              <span className="text-graphite-500 block">שעות:</span>
              <span className="font-bold text-graphite-900">
                {training.startTime} - {training.endTime}
              </span>
            </div>
            <div>
              <span className="text-graphite-500 block mb-0.5">מיקום:</span>
              <span className="font-bold text-graphite-900 block mb-1">
                {training.location || 'מטווח נץ המדבר, מתחם מול 7, שדרות'}
              </span>
              <a
                href={training.locationMapUrl || getWazeNavigationUrl(training.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200"
              >
                <Navigation size={11} />
                <span>נווט ב-Waze</span>
              </a>
            </div>
            <div>
              <span className="text-graphite-500 block">מדריך אחראי:</span>
              <span className="font-bold text-graphite-900">
                {training.instructorNames.join(", ")}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-graphite-700 mb-1">
              תיאור האימון ומערך תרגילים:
            </h4>
            <p className="text-sm text-graphite-600">{training.description}</p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-graphite-700 mb-1">
              תנאי זכאות וציוד נדרש:
            </h4>
            <p className="text-sm text-graphite-600">
              {training.eligibilityRequirements}
            </p>
          </div>

          {isRegistered && (
            <div className="p-3 bg-falcon-50 border border-falcon-200 rounded-2xl flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-falcon-950 flex items-center gap-1.5">
                <CalendarPlus size={16} className="text-falcon-700" />
                <span>הוספה ליומן האישי:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadIcsFile(training)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#DFCEB0] text-graphite-800 text-sm font-bold hover:bg-[#FAF8F5]"
                >
                  קובץ יומן (.ics)
                </button>
                <a
                  href={getGoogleCalendarUrl(training)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold flex items-center gap-1"
                >
                  <span>Google Calendar</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-sm text-amber-900">
            <strong>מדיניות תשלום וביטולים:</strong> {training.priceNote}. ניתן
            לבטל ללא חיוב עד {training.cancelCutoffHours} שעות לפני מועד האימון.
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-graphite-600 hover:bg-gray-100 text-sm font-semibold"
            >
              סגור
            </button>

            {isRegistered ? (
              <button
                onClick={async () => { if(userReg && (await cancelRegistration(userReg.id)).success) onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-sm"
              >
                ביטול הרשמה לאימון
              </button>
            ) : isWaitlisted ? (
              <button
                onClick={async () => { if(userReg && (await cancelRegistration(userReg.id)).success) onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-sm"
              >
                ביטול מקום ברשימת המתנה
              </button>
            ) : (
              <button
                onClick={async () => { if((await registerForTraining(training.id)).success) onClose(); }}
                className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md ${
                  isFull
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-falcon-500 hover:bg-falcon-600"
                }`}
              >
                {isFull ? "כניסה לרשימת המתנה" : "אישור הרשמה"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
