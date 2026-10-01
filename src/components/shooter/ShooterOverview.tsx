import React from "react";
import { useApp } from "../../context/AppContext";
import { ShooterTab } from "../common/BottomNav";
import { ShooterProgress } from "./ShooterProgress";
import { checkUserDocuments } from "../../lib/documentStatus";
import { downloadIcsFile } from "../../lib/calendar";
import {
  ArrowUpLeft,
  Calendar,
  Clock,
  MapPin,
  Check,
  MessageSquare,
  ShieldAlert,
  CalendarPlus,
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
  return (
    <div className="overview-page">
      {docCompliance?.hasExpired && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-3xl flex items-center justify-between gap-3 text-right shadow-sm mb-2">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="text-rose-600 shrink-0" size={22} />
            <div>
              <h4 className="font-bold text-xs text-rose-950">תשומת לב: מסמך או רישיון פג תוקף!</h4>
              <p className="text-[11px] text-rose-800">נא לעדכן את תוקף הרישיון או הצהרת הבריאות בפרופיל האישי.</p>
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

      <div className="dashboard-welcome">
        <div>
          <div className="eyebrow">MY DESERT FALCON</div>
          <h1>
            שלום, {currentUser?.fullName.split(" ")[0]}
            <span>.</span>
          </h1>
          <p>עוד אימון. עוד צעד קדימה.</p>
        </div>
        <span className="membership-pill">
          <span />
          חבר מועדון פעיל
        </span>
      </div>
      <div className="stat-strip">
        <div>
          <strong>{attended}</strong>
          <span>אימונים שהשתתפתי</span>
        </div>
        <div>
          <strong>{results.length}</strong>
          <span>תוצאות שנמדדו</span>
        </div>
        <div>
          <strong>{focus.length}</strong>
          <span>דגשים להמשך</span>
        </div>
      </div>
      <div className="overview-grid">
        <section className="dashboard-card next-training">
          <div className="card-heading">
            <span className="eyebrow">האימון הבא שלי</span>
            {upcoming && (
              <span className="confirmed-pill">
                <Check size={14} />
                נרשמתם
              </span>
            )}
          </div>
          {upcoming ? (
            <>
              <div className="next-training-main">
                <div className="date-tile">
                  <strong>{date?.getDate()}</strong>
                  <span>
                    {date?.toLocaleDateString("he-IL", { month: "long" })}
                  </span>
                </div>
                <div>
                  <h2>{upcoming.session.title}</h2>
                  <p>
                    {date?.toLocaleDateString("he-IL", { weekday: "long" })} ·{" "}
                    {upcoming.session.type}
                  </p>
                </div>
              </div>
              <div className="training-meta">
                <span>
                  <Clock size={16} />
                  <b dir="ltr">
                    {upcoming.session.startTime}–{upcoming.session.endTime}
                  </b>
                </span>
                <span>
                  <MapPin size={16} />
                  {upcoming.session.location}
                </span>
              </div>
              <button
                className="button-primary"
                onClick={() => onOpenTrainingDetails(upcoming.session.id)}
              >
                פרטי האימון <ArrowUpLeft size={18} />
              </button>
            </>
          ) : (
            <div className="training-empty">
              <Calendar size={30} />
              <h2>מוכנים לאימון הבא?</h2>
              <p>אין כרגע אימון קרוב שנרשמתם אליו.</p>
              <button
                className="button-primary"
                onClick={() => onSelectTab("trainings")}
              >
                ללוח האימונים <ArrowUpLeft size={18} />
              </button>
            </div>
          )}
          <small className="payment-note">התשלום מתבצע במקום בלבד</small>
        </section>
        <ShooterProgress compact />
        <section className="dashboard-card focus-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">עם כיוון ברור</span>
              <h2>דגשים לאימון הבא</h2>
            </div>
            <span className="focus-count">{focus.length}</span>
          </div>
          {focus.length === 0 ? (
            <p className="empty-state">אין דגשים פתוחים כרגע.</p>
          ) : (
            <div className="focus-list">
              {focus.slice(0, 3).map((f, i) => (
                <div key={f.id}>
                  <span className="focus-number">0{i + 1}</span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                    <small>
                      {f.instructorName} ·{" "}
                      {f.status === "in_progress" ? "בתהליך" : "להמשך עבודה"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="text-link" onClick={() => onSelectTab("results")}>
            כל הדגשים והתוצאות <ArrowUpLeft size={17} />
          </button>
        </section>
        <section className="dashboard-card feedback-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">מבט של המדריך</span>
              <h2>המשוב האחרון</h2>
            </div>
            <MessageSquare size={23} />
          </div>
          {feedback ? (
            <>
              <blockquote>{feedback.summary}</blockquote>
              <div className="feedback-author">
                <div className="avatar-circle">
                  {feedback.instructorName.charAt(0)}
                </div>
                <div>
                  <strong>{feedback.instructorName}</strong>
                  <span>
                    {feedback.trainingDate} · {feedback.trainingTitle}
                  </span>
                </div>
              </div>
              <button
                className="text-link"
                onClick={() => onOpenFeedbackDetails(feedback.id)}
              >
                למשוב המלא <ArrowUpLeft size={17} />
              </button>
            </>
          ) : (
            <p className="empty-state">משוב שיפורסם על ידי המדריך יופיע כאן.</p>
          )}
        </section>
      </div>
    </div>
  );
};
