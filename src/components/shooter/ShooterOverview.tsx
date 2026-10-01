import React from "react";
import { useApp } from "../../context/AppContext";
import { ShooterTab } from "../common/BottomNav";
import { checkUserDocuments } from "../../lib/documentStatus";
import { getWazeNavigationUrl } from "../../lib/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  ShieldAlert,
  Navigation,
  ChevronLeft,
  Home,
  BarChart2,
  MessageSquare,
} from "lucide-react";

export const ShooterOverview: React.FC<{
  onSelectTab: (tab: ShooterTab) => void;
  onOpenTrainingDetails: (id: string) => void;
  onOpenFeedbackDetails: (id: string) => void;
}> = ({ onSelectTab, onOpenTrainingDetails, onOpenFeedbackDetails }) => {
  const {
    currentUser,
    getMyUpcomingTraining,
    getMyRegistrations,
    getMyFocusItems,
    getMyFeedbacks,
    getMyResults,
  } = useApp();

  const upcoming = getMyUpcomingTraining();
  const attended = getMyRegistrations().filter(
    (r) => r.attendance === "attended",
  ).length;
  const focus = getMyFocusItems().filter((f) => f.status !== "completed");
  const feedback = [...getMyFeedbacks()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  const results = getMyResults();
  const date = upcoming ? new Date(`${upcoming.session.date}T12:00:00`) : null;
  const docCompliance = currentUser ? checkUserDocuments(currentUser) : null;

  // Format date as DD.MM
  const formattedDate = date
    ? `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`
    : "11.10";
  const formattedWeekday = date
    ? date.toLocaleDateString("he-IL", { weekday: "long" })
    : "יום שבת";

  return (
    <div className="overview-page space-y-4 max-w-md md:max-w-xl mx-auto pb-10">
      {/* Document compliance alert */}
      {docCompliance?.hasExpired && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between gap-3 text-right shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="text-rose-600 shrink-0" size={22} />
            <div>
              <h4 className="font-bold text-xs text-rose-950">
                תשומת לב: מסמך או רישיון פג תוקף!
              </h4>
              <p className="text-[11px] text-rose-800">
                נא לעדכן את תוקף הרישיון או הצהרת הבריאות בפרופיל האישי.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab("profile")}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 shadow-sm"
          >
            לפרופיל
          </button>
        </div>
      )}

      {/* Hero Welcome Banner with Range Target Stand Background */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#EFE6D5] p-6 shadow-sm min-h-[110px] flex items-center">
        <img
          src="/assets/shooter-banner.png"
          alt="Desert Falcon Range Targets"
          className="absolute left-0 top-0 bottom-0 w-44 md:w-56 object-cover object-left opacity-95 pointer-events-none"
        />
        <div className="relative z-10 space-y-2 max-w-[200px]">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            שלום {currentUser?.fullName.split(" ")[0] || "יבגני"}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4EFE6] rounded-full text-xs font-semibold text-[#6E491C] border border-[#DFCEB0]/60">
            <span>👤</span>
            <span>חבר פעיל</span>
          </div>
        </div>
      </div>

      {/* 3-Segment Switcher (Overview, Progress, Feedback) */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-white rounded-xl border border-[#EFE6D5] shadow-xs">
        <button
          onClick={() => onSelectTab("overview")}
          className="py-2.5 rounded-lg text-xs font-bold bg-[#A67C37] text-white flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Home size={15} />
          <span>סקירה</span>
        </button>
        <button
          onClick={() => onSelectTab("results")}
          className="py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#FAF8F5] flex items-center justify-center gap-1.5 transition"
        >
          <BarChart2 size={15} />
          <span>התקדמות</span>
        </button>
        <button
          onClick={() => {
            if (feedback) onOpenFeedbackDetails(feedback.id);
            else onSelectTab("results");
          }}
          className="py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#FAF8F5] flex items-center justify-center gap-1.5 transition"
        >
          <MessageSquare size={15} />
          <span>משוב</span>
        </button>
      </div>

      {/* Card: Next Training */}
      <section className="bg-white rounded-2xl border border-[#EFE6D5] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span>📅</span>
            <span>האימון הבא</span>
          </h2>
        </div>

        {upcoming ? (
          <>
            <div className="flex items-center gap-4">
              {/* Target Image with Registered Badge */}
              <div className="relative w-36 sm:w-44 h-28 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                <img
                  src="/assets/training-target.png"
                  alt="מטרת ירי מעשי באימון"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Check size={11} strokeWidth={3} />
                  <span>נרשמת</span>
                </span>
              </div>

              {/* Date, Time & Range info */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">
                      {formattedDate}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formattedWeekday}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-lg font-black text-slate-900 leading-none">
                      {upcoming.session.startTime}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>
                        {upcoming.session.location || "מטווח נץ המדבר (שדרות)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="w-full py-3 rounded-xl bg-[#A67C37] hover:bg-[#8C6228] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              onClick={() => onOpenTrainingDetails(upcoming.session.id)}
            >
              <span>פרטי האימון</span>
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative w-36 h-28 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
              <img
                src="/assets/training-target.png"
                alt="מטרת ירי מעשי באימון"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2 flex-1">
              <div className="text-sm font-bold text-slate-900">
                מוכנים לאימון הבא?
              </div>
              <p className="text-xs text-slate-500">
                צפו בלוח האימונים הקרובים והירשמו.
              </p>
              <button
                className="px-4 py-2 rounded-xl bg-[#A67C37] hover:bg-[#8C6228] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                onClick={() => onSelectTab("trainings")}
              >
                <span>ללוח האימונים</span>
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <span>ℹ️</span>
          <span>התשלום במקום</span>
        </div>
      </section>

      {/* Card: Focus Items */}
      <section className="bg-white rounded-2xl border border-[#EFE6D5] p-4 shadow-sm flex items-center gap-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
          <img
            src="/assets/focus-target.png"
            alt="דגש אימונים על מטרה"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>🎯</span>
              <span>הדגשים שלך</span>
            </span>
          </div>
          <h3 className="font-black text-sm text-slate-900">
            {focus[0]?.title || "עקביות בתוצאות"}
          </h3>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold rounded-md">
            <span>📊</span>
            <span>במעקב</span>
          </div>
          <div>
            <button
              onClick={() => onSelectTab("results")}
              className="text-xs font-semibold text-slate-500 hover:text-[#A67C37] inline-flex items-center gap-1"
            >
              <span>למשוב המלא</span>
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 2-Column Row (Attended Count & Progress Line Chart) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Progress Line Chart Card */}
        <div className="bg-white rounded-2xl border border-[#EFE6D5] p-4 shadow-sm flex flex-col justify-between min-h-[150px]">
          <div>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>📊</span>
              <span>ההתקדמות שלך</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {results[0]?.exerciseTemplateName || "תרגיל מועדון א"}
            </div>
          </div>

          <div className="my-2">
            <svg viewBox="0 0 160 60" className="w-full h-14 overflow-visible">
              <polyline
                fill="none"
                stroke="#A67C37"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="10,48 45,34 80,38 115,22 150,12"
              />
              <circle cx="10" cy="48" r="3.5" fill="#A67C37" />
              <text
                x="10"
                y="42"
                fontSize="8"
                fontWeight="bold"
                fill="#252C2A"
                textAnchor="middle"
              >
                62
              </text>

              <circle cx="45" cy="34" r="3.5" fill="#A67C37" />
              <text
                x="45"
                y="28"
                fontSize="8"
                fontWeight="bold"
                fill="#252C2A"
                textAnchor="middle"
              >
                71
              </text>

              <circle cx="80" cy="38" r="3.5" fill="#A67C37" />
              <text
                x="80"
                y="32"
                fontSize="8"
                fontWeight="bold"
                fill="#252C2A"
                textAnchor="middle"
              >
                69
              </text>

              <circle cx="115" cy="22" r="3.5" fill="#A67C37" />
              <text
                x="115"
                y="16"
                fontSize="8"
                fontWeight="bold"
                fill="#252C2A"
                textAnchor="middle"
              >
                78
              </text>

              <circle cx="150" cy="12" r="3.5" fill="#A67C37" />
              <text
                x="150"
                y="6"
                fontSize="8"
                fontWeight="bold"
                fill="#252C2A"
                textAnchor="middle"
              >
                83
              </text>
            </svg>
            <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono">
              <span>14.08</span>
              <span>28.08</span>
              <span>11.09</span>
              <span>25.09</span>
              <span>09.10</span>
            </div>
          </div>
        </div>

        {/* Attended Trainings Card with Desert Target Background */}
        <div className="bg-white rounded-2xl border border-[#EFE6D5] p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[150px]">
          <img
            src="/assets/stat-bg.png"
            alt="Target Silhouette on Desert Mountain"
            className="absolute bottom-0 left-0 right-0 h-16 object-cover opacity-60 pointer-events-none"
          />
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>📅</span>
            <span>אימונים שהשתתפת</span>
          </div>

          <div className="relative z-10 text-center my-2">
            <span className="text-4xl font-black text-slate-900">
              {attended > 0 ? attended : 8}
            </span>
            <div className="text-[10px] text-slate-500 mt-1">
              בחודשיים האחרונים
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
