import React, { useState } from 'react';
import { checkUserDocuments } from '../../lib/documentStatus';
import { getWazeNavigationUrl } from '../../lib/navigation';
import { accuracy } from '../../lib/statistics';
import { useApp } from '../../context/AppContext';
import { ShooterTab } from '../common/BottomNav';
import { ProfilePhoto } from '../common/ProfilePhoto';
import { ShooterProgress } from './ShooterProgress';
import { ShooterToolsModal } from '../modals/ShooterToolsModal';
import { DocumentRenewalModal } from '../modals/DocumentRenewalModal';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  MessageSquare,
  Crosshair,
  ChartNoAxesCombined,
  FileText,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Navigation,
  Calculator,
  Award,
  HelpCircle,
  Wrench,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

export const ShooterOverview: React.FC<{
  onSelectTab: (tab: ShooterTab) => void;
  onOpenTrainingDetails: (id: string) => void;
  onOpenFeedbackDetails: (id: string) => void;
}> = ({ onSelectTab, onOpenTrainingDetails, onOpenFeedbackDetails }) => {
  const { currentUser, getMyUpcomingTraining, getMyFocusItems, getMyFeedbacks, getMyResults } = useApp();
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [toolsTab, setToolsTab] = useState<'calc' | 'quiz' | 'badges' | 'log'>('calc');
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);

  const openTool = (selectedTab: 'calc' | 'quiz' | 'badges' | 'log') => {
    setToolsTab(selectedTab);
    setToolsModalOpen(true);
  };

  const docs = currentUser ? checkUserDocuments(currentUser) : null;
  const upcoming = getMyUpcomingTraining();
  const focus = getMyFocusItems().filter((f) => f.status !== 'completed');
  const feedback = [...getMyFeedbacks()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const results = [...getMyResults()].sort((a, b) =>
    (b.recordedAt || b.trainingDate).localeCompare(a.recordedAt || a.trainingDate)
  );
  const latest = results[0];
  const shots = latest ? latest.hitsA + latest.hitsC + latest.hitsD + latest.misses : 0;
  const date = upcoming ? new Date(`${upcoming.session.date}T12:00:00`) : null;

  return (
    <div className="overview-page overview-reference space-y-6">
      {docs?.hasExpired && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex flex-wrap items-center justify-between gap-3 text-right shadow-xs" role="status">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <strong className="text-sm font-black text-rose-900 block">רישיון נשק או מסמך פג תוקף!</strong>
              <p className="text-xs text-rose-700">על פי תקנות הבטיחות והרגולציה, חובה לחדש את המסמך לצורך השתתפות במטווח.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
              onClick={() => setRenewalModalOpen(true)}
            >
              <ExternalLink size={13} />
              <span>מרכז חידוש מקוון</span>
            </button>
            <button
              className="px-3 py-2 bg-white border border-rose-300 text-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
              onClick={() => onSelectTab('profile')}
            >
              לפרופיל
            </button>
          </div>
        </div>
      )}

      {!docs?.hasExpired && docs?.hasExpiringSoon && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-3 text-right shadow-xs" role="status">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <strong className="text-sm font-black text-amber-900 block">שים לב: מסמך עומד לפוג ב-30 הימים הקרובים</strong>
              <p className="text-xs text-amber-800">מומלץ להתחיל בהליך החידוש בהקדם כדי למנוע עיכובים באימונים הבאים.</p>
            </div>
          </div>
          <button
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
            onClick={() => setRenewalModalOpen(true)}
          >
            <ShieldCheck size={14} />
            <span>הנחיות חידוש ועדכון</span>
          </button>
        </div>
      )}

      <div className="dashboard-welcome">
        <div>
          <h1>האזור האישי שלי</h1>
          <p>שלום, {currentUser?.fullName.split(' ')[0]}</p>
        </div>
      </div>

      {currentUser && (
        <section className="member-profile-card dashboard-card" aria-label="פרטי החבר">
          <ProfilePhoto user={currentUser} />
          <div className="member-profile-copy">
            <h2>{currentUser.fullName}</h2>
            <p>
              {currentUser.membershipStatus === 'active'
                ? 'חבר מועדון פעיל'
                : 'סטטוס חברות: ' + currentUser.membershipStatus}
            </p>
            {currentUser.shooterNumber && (
              <span>
                מספר יורה: <b dir="ltr">{currentUser.shooterNumber}</b>
              </span>
            )}
            <span dir="ltr">
              {[currentUser.division, currentUser.classification && `Class ${currentUser.classification}`]
                .filter(Boolean)
                .join(' • ') || 'Division / Class — טרם הוגדרו'}
            </span>
          </div>
          <button className="button-outline" onClick={() => onSelectTab('profile')}>
            <Pencil size={18} />
            עריכת פרופיל
          </button>
        </section>
      )}

      {/* Quick Pro Tools Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => openTool('calc')}
          className="p-3 bg-white rounded-2xl border border-[#DFCEB0] hover:border-[#A67C37] shadow-xs flex items-center gap-2.5 transition text-right"
        >
          <div className="w-8 h-8 rounded-xl bg-[#F4EFE6] text-[#A67C37] flex items-center justify-center shrink-0">
            <Calculator size={18} />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">מחשבון HF</div>
            <div className="text-[10px] text-slate-500">סימולטור ירי</div>
          </div>
        </button>

        <button
          onClick={() => openTool('quiz')}
          className="p-3 bg-white rounded-2xl border border-[#DFCEB0] hover:border-[#A67C37] shadow-xs flex items-center gap-2.5 transition text-right"
        >
          <div className="w-8 h-8 rounded-xl bg-[#F4EFE6] text-[#A67C37] flex items-center justify-center shrink-0">
            <HelpCircle size={18} />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">מבחן חוקה</div>
            <div className="text-[10px] text-slate-500">בטיחות ו-IPSC</div>
          </div>
        </button>

        <button
          onClick={() => openTool('badges')}
          className="p-3 bg-white rounded-2xl border border-[#DFCEB0] hover:border-[#A67C37] shadow-xs flex items-center gap-2.5 transition text-right"
        >
          <div className="w-8 h-8 rounded-xl bg-[#F4EFE6] text-[#A67C37] flex items-center justify-center shrink-0">
            <Award size={18} />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">הישגי ירי</div>
            <div className="text-[10px] text-slate-500">תגי מועדון</div>
          </div>
        </button>

        <button
          onClick={() => openTool('log')}
          className="p-3 bg-white rounded-2xl border border-[#DFCEB0] hover:border-[#A67C37] shadow-xs flex items-center gap-2.5 transition text-right"
        >
          <div className="w-8 h-8 rounded-xl bg-[#F4EFE6] text-[#A67C37] flex items-center justify-center shrink-0">
            <Wrench size={18} />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">יומן נשק</div>
            <div className="text-[10px] text-slate-500">בלאי ותחמושת</div>
          </div>
        </button>
      </div>

      <div className="stat-strip performance-strip">
        <div>
          <Crosshair size={28} />
          <span>דיוק אלפא</span>
          <strong dir="ltr">{latest && shots ? `${Math.round(accuracy(latest) ?? 0)}%` : '—'}</strong>
        </div>
        <div>
          <Clock size={28} />
          <span>זמן אחרון</span>
          <strong dir="ltr">{latest ? `${latest.timeSeconds.toFixed(1)}s` : '—'}</strong>
        </div>
        <div>
          <ChartNoAxesCombined size={28} />
          <span dir="ltr">{latest?.measurementType === 'points' ? 'נקודות' : 'Hit Factor'}</span>
          <strong dir="ltr">
            {latest
              ? latest.measurementType === 'points'
                ? latest.rawPoints
                : latest.hitFactor.toFixed(2)
              : '—'}
          </strong>
        </div>
      </div>

      <p className="metric-context">
        {latest
          ? `התרגיל האחרון שנמדד: ${latest.exerciseTemplateName} · ${new Date(
              latest.trainingDate + 'T12:00:00'
            ).toLocaleDateString('he-IL')}`
          : 'מדדים יופיעו לאחר הזנת תוצאות על ידי המדריך.'}
      </p>

      <ShooterProgress compact />

      <div className="overview-action-grid">
        <section className="dashboard-card next-training">
          <div className="card-heading">
            <h2>
              <Calendar size={23} />
              האימון הבא
            </h2>
            {upcoming && (
              <span className="confirmed-pill">
                <Check size={15} />
                נרשמתם
              </span>
            )}
          </div>
          {upcoming ? (
            <>
              <div className="upcoming-summary">
                <strong>
                  {date?.toLocaleDateString('he-IL', { weekday: 'long' })} •{' '}
                  <b dir="ltr">{upcoming.session.startTime}</b>
                </strong>
                <h3>{upcoming.session.title}</h3>
                <span>{date?.toLocaleDateString('he-IL')}</span>
                <div className="training-meta">
                  <span>
                    <MapPin size={17} />
                    {upcoming.session.location}
                  </span>
                  {upcoming.session.instructorNames.length > 0 && (
                    <span>מדריך: {upcoming.session.instructorNames.join(', ')}</span>
                  )}
                </div>
              </div>
              <button className="button-primary" onClick={() => onOpenTrainingDetails(upcoming.session.id)}>
                פרטי האימון
              </button>
              <a
                className="button-outline training-navigation"
                href={upcoming.session.locationMapUrl || getWazeNavigationUrl(upcoming.session.location)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={18} />
                ניווט למטווח
              </a>
            </>
          ) : (
            <div className="training-empty">
              <p>אין כרגע אימון קרוב שנרשמתם אליו.</p>
              <button className="button-primary" onClick={() => onSelectTab('trainings')}>
                הרשמה לאימון
              </button>
            </div>
          )}
          <small className="payment-note">התשלום במקום בלבד</small>
        </section>

        <section className="dashboard-card feedback-focus">
          <div className="card-heading">
            <h2>
              <MessageSquare size={23} />
              דגשים מהמדריך
            </h2>
          </div>
          {feedback ? (
            <>
              <div className="feedback-author">
                <div className="avatar-circle">{feedback.instructorName.charAt(0)}</div>
                <div>
                  <strong>{feedback.instructorName}</strong>
                  <span>{feedback.trainingDate}</span>
                </div>
              </div>
              <blockquote>{feedback.summary}</blockquote>
            </>
          ) : (
            <p className="empty-state">משוב שיפורסם על ידי המדריך יופיע כאן.</p>
          )}
          {focus.length > 0 && (
            <div className="compact-focus-list">
              {focus.slice(0, 3).map((f) => (
                <div key={f.id}>
                  <span className="focus-circle" aria-hidden="true" />
                  <div>
                    <h3>{f.title}</h3>
                    <small>{f.status === 'in_progress' ? 'בתהליך' : 'להמשך עבודה'}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            className="text-link"
            onClick={() => (feedback ? onOpenFeedbackDetails(feedback.id) : onSelectTab('results'))}
          >
            כל הדגשים והמשוב
          </button>
        </section>
      </div>

      <section className="dashboard-card recent-results">
        <div className="card-heading">
          <h2>
            <FileText size={23} />
            תוצאות אחרונות
          </h2>
          <button className="text-link" onClick={() => onSelectTab('results')}>
            כל התוצאות
          </button>
        </div>
        {results.length ? (
          results.slice(0, 3).map((r) => (
            <button className="recent-result-row" key={r.id} onClick={() => onSelectTab('results')}>
              <time>{new Date(r.trainingDate + 'T12:00:00').toLocaleDateString('he-IL')}</time>
              <span>{r.exerciseTemplateName}</span>
              <strong dir="ltr">
                {r.measurementType === 'points' ? r.rawPoints : r.hitFactor.toFixed(2)}{' '}
                <small>{r.measurementType === 'points' ? 'pts' : 'HF'}</small>
              </strong>
            </button>
          ))
        ) : (
          <p className="empty-state">תוצאות מהאימונים שלכם יופיעו כאן.</p>
        )}
      </section>

      {/* Shooter Tools Modal */}
      <ShooterToolsModal
        isOpen={toolsModalOpen}
        onClose={() => setToolsModalOpen(false)}
        defaultTab={toolsTab}
      />

      {/* Document Renewal Helper Modal */}
      <DocumentRenewalModal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
      />
    </div>
  );
};
