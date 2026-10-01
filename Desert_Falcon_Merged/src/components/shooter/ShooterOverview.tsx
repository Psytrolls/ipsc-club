import React from 'react';
import {accuracy} from '../../lib/statistics';
import {useApp} from '../../context/AppContext';
import {ShooterTab} from '../common/BottomNav';
import {ProfilePhoto} from '../common/ProfilePhoto';
import {ShooterProgress} from './ShooterProgress';
import {Calendar,Clock,MapPin,Check,MessageSquare,Crosshair,ChartNoAxesCombined,FileText,Pencil} from 'lucide-react';
export const ShooterOverview:React.FC<{onSelectTab:(tab:ShooterTab)=>void;onOpenTrainingDetails:(id:string)=>void;onOpenFeedbackDetails:(id:string)=>void}>=({onSelectTab,onOpenTrainingDetails,onOpenFeedbackDetails})=>{
 const {currentUser,getMyUpcomingTraining,getMyFocusItems,getMyFeedbacks,getMyResults}=useApp();
 const upcoming=getMyUpcomingTraining();const focus=getMyFocusItems().filter(f=>f.status!=='completed');
 const feedback=[...getMyFeedbacks()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
 const results=[...getMyResults()].sort((a,b)=>(b.recordedAt||b.trainingDate).localeCompare(a.recordedAt||a.trainingDate));const latest=results[0];
 const shots=latest?latest.hitsA+latest.hitsC+latest.hitsD+latest.misses:0;
 const date=upcoming?new Date(`${upcoming.session.date}T12:00:00`):null;
 return <div className="overview-page overview-reference">
  <div className="dashboard-welcome"><div><h1>האזור האישי שלי</h1><p>שלום, {currentUser?.fullName.split(' ')[0]}</p></div></div>
  {currentUser&&<section className="member-profile-card dashboard-card" aria-label="פרטי החבר"><ProfilePhoto user={currentUser}/><div className="member-profile-copy"><h2>{currentUser.fullName}</h2><p>{currentUser.membershipStatus==='active'?'חבר מועדון פעיל':'סטטוס חברות: '+currentUser.membershipStatus}</p>{currentUser.shooterNumber&&<span>מספר יורה: <b dir="ltr">{currentUser.shooterNumber}</b></span>}<span dir="ltr">{[currentUser.division,currentUser.classification&&`Class ${currentUser.classification}`].filter(Boolean).join(' • ')||'Division / Class — טרם הוגדרו'}</span></div><button className="button-outline" onClick={()=>onSelectTab('profile')}><Pencil size={18}/>עריכת פרופיל</button></section>}
  <div className="stat-strip performance-strip">
   <div><Crosshair size={28}/><span>דיוק אלפא</span><strong dir="ltr">{latest&&shots?`${Math.round(accuracy(latest)??0)}%`:'—'}</strong></div>
   <div><Clock size={28}/><span>זמן אחרון</span><strong dir="ltr">{latest?`${latest.timeSeconds.toFixed(1)}s`:'—'}</strong></div>
   <div><ChartNoAxesCombined size={28}/><span dir="ltr">{latest?.measurementType==='points'?'נקודות':'Hit Factor'}</span><strong dir="ltr">{latest?(latest.measurementType==='points'?latest.rawPoints:latest.hitFactor.toFixed(2)):'—'}</strong></div>
  </div>
  <p className="metric-context">{latest?`התרגיל האחרון שנמדד: ${latest.exerciseTemplateName} · ${new Date(latest.trainingDate+'T12:00:00').toLocaleDateString('he-IL')}`:'מדדים יופיעו לאחר הזנת תוצאות על ידי המדריך.'}</p>
  <ShooterProgress compact/>
  <div className="overview-action-grid">
   <section className="dashboard-card next-training"><div className="card-heading"><h2><Calendar size={23}/>האימון הבא</h2>{upcoming&&<span className="confirmed-pill"><Check size={15}/>נרשמתם</span>}</div>
    {upcoming?<><div className="upcoming-summary"><strong>{date?.toLocaleDateString('he-IL',{weekday:'long'})} • <b dir="ltr">{upcoming.session.startTime}</b></strong><h3>{upcoming.session.title}</h3><span>{date?.toLocaleDateString('he-IL')}</span><div className="training-meta"><span><MapPin size={17}/>{upcoming.session.location}</span>{upcoming.session.instructorNames.length>0&&<span>מדריך: {upcoming.session.instructorNames.join(', ')}</span>}</div></div><button className="button-primary" onClick={()=>onOpenTrainingDetails(upcoming.session.id)}>פרטי האימון</button></>:<div className="training-empty"><p>אין כרגע אימון קרוב שנרשמתם אליו.</p><button className="button-primary" onClick={()=>onSelectTab('trainings')}>הרשמה לאימון</button></div>}
    <small className="payment-note">התשלום במקום בלבד</small>
   </section>
   <section className="dashboard-card feedback-focus"><div className="card-heading"><h2><MessageSquare size={23}/>דגשים מהמדריך</h2></div>
    {feedback?<><div className="feedback-author"><div className="avatar-circle">{feedback.instructorName.charAt(0)}</div><div><strong>{feedback.instructorName}</strong><span>{feedback.trainingDate}</span></div></div><blockquote>{feedback.summary}</blockquote></>:<p className="empty-state">משוב שיפורסם על ידי המדריך יופיע כאן.</p>}
    {focus.length>0&&<div className="compact-focus-list">{focus.slice(0,3).map(f=><div key={f.id}><span className="focus-circle" aria-hidden="true"/><div><h3>{f.title}</h3><small>{f.status==='in_progress'?'בתהליך':'להמשך עבודה'}</small></div></div>)}</div>}
    <button className="text-link" onClick={()=>feedback?onOpenFeedbackDetails(feedback.id):onSelectTab('results')}>כל הדגשים והמשוב</button>
   </section>
  </div>
  <section className="dashboard-card recent-results"><div className="card-heading"><h2><FileText size={23}/>תוצאות אחרונות</h2><button className="text-link" onClick={()=>onSelectTab('results')}>כל התוצאות</button></div>{results.length?results.slice(0,3).map(r=><button className="recent-result-row" key={r.id} onClick={()=>onSelectTab('results')}><time>{new Date(r.trainingDate+'T12:00:00').toLocaleDateString('he-IL')}</time><span>{r.exerciseTemplateName}</span><strong dir="ltr">{r.measurementType==='points'?r.rawPoints:r.hitFactor.toFixed(2)} <small>{r.measurementType==='points'?'pts':'HF'}</small></strong></button>):<p className="empty-state">תוצאות מהאימונים שלכם יופיעו כאן.</p>}</section>
 </div>;
};
