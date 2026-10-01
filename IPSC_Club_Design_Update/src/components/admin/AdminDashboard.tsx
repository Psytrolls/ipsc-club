import {MemberFields} from "../common/MemberFields";
import {ProfilePhoto} from "../common/ProfilePhoto";
import { PagesEditor } from './PagesEditor';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TrainingSession, LeadInquiry, User, NewsArticle, LeadStatus } from '../../types';
import { getWhatsAppUrl, createCredentialsWhatsAppMessage, createTrainingSquadWhatsAppMessage } from '../../lib/whatsapp';
import { checkUserDocuments } from '../../lib/documentStatus';
import { DEFAULT_RANGE_LOCATION, DEFAULT_WAZE_URL, getWazeNavigationUrl } from '../../lib/navigation';
import {
  Shield,
  Users,
  Calendar,
  Newspaper,
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Lock,
  Mail,
  Phone,
  Share2,
  Copy,
  ShieldAlert,
  MapPin,
  Navigation
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    trainings,
    leads,
    news,
    registrations,
    saveTrainingSession,
    deleteTrainingSession,
    updateLeadStatus,
    convertLeadToUser,
    saveUser,
    inviteUser,
    saveNewsArticle,
    deleteNewsArticle,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'leads' | 'trainings' | 'users' | 'news' | 'pages'>('leads');

  // Lead modal state
  const [selectedLead, setSelectedLead] = useState<LeadInquiry | null>(null);

  // Training modal state
  const [editingTraining, setEditingTraining] = useState<TrainingSession | null>(null);
  const [isNewTraining, setIsNewTraining] = useState(false);

  // User edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  // News article modal state
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isNewArticle, setIsNewArticle] = useState(false);

  const handleOpenNewUser = () => {
    setEditingUser({
      id: `usr-${Date.now()}`,
      fullName: '',
      phone: '',
      email: '',
      role: 'shooter',
      roles: ['shooter'],
      membershipStatus: 'active',
      ipscCourseVerified: false,
      joinedDate: new Date().toISOString().slice(0, 10),
    });
    setTemporaryPassword('');
    setIsNewUser(true);
  };

  // Stats calculation
  const totalActiveShooters = users.filter(u => u.membershipStatus === 'active' && u.role === 'shooter').length;
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const upcomingTrainingsCount = trainings.filter(t => t.status === 'scheduled').length;

  const handleOpenNewTraining = () => {
    setEditingTraining({
      id: `trn-${Date.now()}`,
      title: 'אימון מועדון חדש',
      type: 'אימון מועדון שבועי',
      description: 'תרגול מעברים וירי בעמדות דינמיות.',
      date: new Date(Date.now()+7*86400000).toISOString().slice(0,10),
      startTime: '18:00',
      endTime: '21:00',
      location: DEFAULT_RANGE_LOCATION,
      locationMapUrl: DEFAULT_WAZE_URL,
      instructorIds: [],
      instructorNames: [],
      maxCapacity: 12,
      registeredCount: 0,
      waitlistCount: 0,
      eligibilityRequirements: 'חברי מועדון פעילים בעלי רישיון בתוקף',
      registrationOpenDate: new Date().toISOString().slice(0,10),
      registrationCloseDate: new Date(Date.now()+7*86400000).toISOString().slice(0,10),
      cancelCutoffHours: 6,
      status: 'scheduled',
      priceNote: '80 ₪ (תשלום במקום בלבד)',
    });
    setIsNewTraining(true);
  };

  const handleOpenNewArticle = () => {
    setEditingArticle({
      id: `news-${Date.now()}`,
      category: 'club',
      title: 'כותרת הכתבה החדשה',
      excerpt: 'תקציר קצר שיופיע בכרטיס הראשי באתר...',
      content: 'תוכן הכתבה המלאה כאן...',
      imageUrl: '',
      publishDate: new Date().toISOString().slice(0,10),
      status: 'draft',
      author: 'הנהלת המועדון',
    });
    setIsNewArticle(true);
  };

  return (
    <div className="workspace-dashboard admin-workspace space-y-6 max-w-6xl mx-auto px-4 py-6 text-right">
      {/* Top Welcome & KPI Summary */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#EFE6D5] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-falcon-800 bg-[#F4EFE6] px-3 py-1 rounded-full border border-[#DFCEB0] mb-1">
              <Shield size={14} className="text-falcon-600" />
              <span>אזור מנהל</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-graphite-900">
              ניהול מועדון נץ המדבר
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewTraining}
              className="px-3.5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold shadow-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>אימון חדש</span>
            </button>
            <button
              onClick={handleOpenNewArticle}
              className="px-3.5 py-2 rounded-xl bg-graphite-900 hover:bg-black text-white text-sm font-bold shadow-sm flex items-center gap-1.5"
            >
              <Newspaper size={14} />
              <span>כתבה חדשה</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE6D5]">
            <div className="text-sm text-graphite-500 font-bold">פניות חדשות</div>
            <div className="text-2xl font-black text-amber-600 my-1">{newLeadsCount}</div>
            <div className="text-sm text-graphite-400">דורשות מענה ואימות</div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE6D5]">
            <div className="text-sm text-graphite-500 font-bold">יורים פעילים במועדון</div>
            <div className="text-2xl font-black text-emerald-600 my-1">{totalActiveShooters}</div>
            <div className="text-sm text-graphite-400">מורשי הרשמה לאימונים</div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE6D5]">
            <div className="text-sm text-graphite-500 font-bold">אימונים מתוזמנים</div>
            <div className="text-2xl font-black text-falcon-700 my-1">{upcomingTrainingsCount}</div>
            <div className="text-sm text-graphite-400">לוח אימונים</div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE6D5]">
            <div className="text-sm text-graphite-500 font-bold">כתבות ומאמרים</div>
            <div className="text-2xl font-black text-graphite-800 my-1">{news.length}</div>
            <div className="text-sm text-graphite-400">פורסמו באתר הציבורי</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3"><button className="button-outline" onClick={handleOpenNewUser}>משתמש חדש</button><button className="button-outline" onClick={()=>setActiveTab('pages')}>עריכת עמודי האתר</button></div>
      {activeTab==='pages'&&<PagesEditor/>}
      {/* Main Admin Tabs */}
      <div className="flex border-b border-[#DFCEB0] gap-2 overflow-x-auto text-sm sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('leads')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-t border-x ${
            activeTab === 'leads'
              ? 'bg-white text-falcon-800 border-[#DFCEB0] border-b-white font-black'
              : 'bg-[#FAF8F5] text-graphite-600 border-transparent hover:text-graphite-900'
          }`}
        >
          <span>פניות הצטרפות וקורס ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trainings')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-t border-x ${
            activeTab === 'trainings'
              ? 'bg-white text-falcon-800 border-[#DFCEB0] border-b-white font-black'
              : 'bg-[#FAF8F5] text-graphite-600 border-transparent hover:text-graphite-900'
          }`}
        >
          <span>ניהול אימונים ({trainings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-t border-x ${
            activeTab === 'users'
              ? 'bg-white text-falcon-800 border-[#DFCEB0] border-b-white font-black'
              : 'bg-[#FAF8F5] text-graphite-600 border-transparent hover:text-graphite-900'
          }`}
        >
          <span>משתמשים והרשאות ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`py-3 px-4 rounded-t-2xl transition-all border-t border-x ${
            activeTab === 'news'
              ? 'bg-white text-falcon-800 border-[#DFCEB0] border-b-white font-black'
              : 'bg-[#FAF8F5] text-graphite-600 border-transparent hover:text-graphite-900'
          }`}
        >
          <span>עריכת תוכן וחדשות ({news.length})</span>
        </button>
      </div>

      {/* TAB 1: Leads CRM */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-graphite-900">פניות ומתעניינים מהאתר הציבורי</h3>
            <span className="text-sm text-graphite-500">רק מנהל יוצר חשבון יורה לאחר אימות</span>
          </div>

          <div className="space-y-3">
            {leads.map(lead => {
              const isCourse = lead.type === 'course_inquiry';
              const isNew = lead.status === 'new';
              const isApproved = lead.status === 'approved';

              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isNew
                      ? 'bg-amber-50/50 border-amber-200'
                      : isApproved
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-[#FAF8F5] border-[#EFE6D5]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                          isCourse ? 'bg-falcon-100 text-falcon-800 border border-falcon-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {isCourse ? 'הרשמה לקורס ירי מעשי' : 'הצטרפות למועדון (יורה קיים)'}
                        </span>
                        <h4 className="font-bold text-sm text-graphite-900">{lead.fullName}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-graphite-600">
                        <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>
                        {lead.email && <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>}
                        <span>תאריך: {lead.createdAt.split('T')[0]}</span>
                      </div>

                      {lead.licenseStatus&&<p className="text-sm text-graphite-600"><strong>מסלול רישיון:</strong> {lead.licenseStatus==='licensed'?'רישיון פרטי קיים':lead.licenseStatus==='approval_needed'?'נדרשת בדיקת אישורים ללא רישיון':'בירור בשיחה'}</p>}
                      {lead.previousExperience && (
                        <p className="text-sm text-graphite-600"><strong>רקע:</strong> {lead.previousExperience}</p>
                      )}
                      {lead.courseDetails && (
                        <p className="text-sm text-graphite-600"><strong>פרטי קורס:</strong> {lead.courseDetails} ({lead.courseDate})</p>
                      )}
                      {lead.notes && (
                        <p className="text-sm text-graphite-500 italic">"{lead.notes}"</p>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                      <select
                        value={lead.status}
                        onChange={e => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className="px-2.5 py-1.5 rounded-xl border border-[#DFCEB0] bg-white text-sm font-bold"
                      >
                        <option value="new">חדש</option>
                        <option value="in_progress">בטיפול</option>
                        <option value="pending_docs">ממתין למסמכים</option>
                        <option value="approved">אושר</option>
                        <option value="rejected">נדחה</option>
                      </select>

                      {!isApproved && (
                        <button
                          onClick={() => convertLeadToUser(lead.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold flex items-center gap-1 shadow-sm"
                        >
                          <UserPlus size={13} />
                          <span>צור משתמש יורה</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Trainings Management */}
      {activeTab === 'trainings' && (
        <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-graphite-900">לוח אימוני מועדון (הגדרות וקיבולת)</h3>
            <button
              onClick={handleOpenNewTraining}
              className="px-3.5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold flex items-center gap-1"
            >
              <Plus size={14} />
              <span>הוסף אימון חדש</span>
            </button>
          </div>

          <div className="space-y-3">
            {trainings.map(t => {
              const regList = registrations.filter(r => r.trainingId === t.id && r.status === 'confirmed');
              const waitList = registrations.filter(r => r.trainingId === t.id && r.status === 'waitlist');

              return (
                <div key={t.id} className="p-4 rounded-2xl border border-[#EFE6D5] bg-[#FAF8F5] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-falcon-700">{t.type} | {t.date} ({t.startTime} - {t.endTime})</div>
                      <h4 className="font-bold text-base text-graphite-900">{t.title}</h4>
                      <div className="text-sm text-graphite-500">{t.location} | מדריכים: {t.instructorNames.join(', ')}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold px-3 py-1.5 bg-white border border-[#DFCEB0] rounded-xl">
                        נרשמו: {regList.length}/{t.maxCapacity} | ממתינים: {waitList.length}
                      </span>

                      {/* WhatsApp squad roster actions */}
                      <button
                        onClick={() => {
                          const text = createTrainingSquadWhatsAppMessage(t, registrations);
                          window.open(getWhatsAppUrl('', text), '_blank');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold flex items-center gap-1"
                        title="שתף רשימה בוואטסאפ"
                      >
                        <Share2 size={13} />
                        <span>וואטסאפ</span>
                      </button>

                      <button
                        onClick={async () => {
                          const text = createTrainingSquadWhatsAppMessage(t, registrations);
                          try {
                            await navigator.clipboard.writeText(text);
                            showToast('רשימת המשתתפים הועתקה ללוח', 'success');
                          } catch {
                            showToast('שגיאה בהעתקת הרשימה', 'error');
                          }
                        }}
                        className="p-2 rounded-xl bg-white border border-[#DFCEB0] text-graphite-700 hover:text-falcon-700"
                        title="העתק רשימת משתתפים"
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        onClick={() => {
                          setEditingTraining(t);
                          setIsNewTraining(false);
                        }}
                        className="p-2 rounded-xl bg-white border border-[#DFCEB0] text-graphite-700 hover:text-falcon-700"
                        title="ערוך אימון"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => deleteTrainingSession(t.id)}
                        className="p-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="בטל אימון"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-graphite-900">משתמשי המערכת, תפקידים וסטטוס חברות</h3>
            <button
              onClick={handleOpenNewUser}
              className="px-3.5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus size={15} />
              <span>הוסף משתמש חדש</span>
            </button>
          </div>

          <div className="space-y-3">
            {users.map(u => {
              const docCompliance = checkUserDocuments(u);

              return (
                <div key={u.id} className="p-4 rounded-2xl border border-[#EFE6D5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-graphite-900">{u.fullName}</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                        u.membershipStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.membershipStatus === 'active' ? 'חבר פעיל' : 'מושהה'}
                      </span>
                      <span className="text-sm font-mono text-falcon-800 bg-[#E8DCB8] px-2 py-0.5 rounded-full">
                        {u.role === 'admin' ? 'מנהל' : u.role === 'instructor' ? 'מדריך' : 'יורה'}
                      </span>

                      {/* Safety Document Compliance Badges */}
                      {docCompliance.hasExpired && (
                        <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <ShieldAlert size={12} />
                          <span>מסמך פג תוקף</span>
                        </span>
                      )}
                      {!docCompliance.hasExpired && docCompliance.hasExpiringSoon && (
                        <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          תוקף פג בקרוב
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-graphite-500 flex items-center gap-3">
                      {u.email && <span>דוא״ל: {u.email}</span>}
                      <span>טלפון: {u.phone}</span>
                      {u.division && <span>מחלקה: {u.division}</span>}
                      {u.isSuperAdmin && <strong>מנהל על — חשבון מוגן</strong>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* WhatsApp Quick Message Button */}
                    <a
                      href={getWhatsAppUrl(u.phone, createCredentialsWhatsAppMessage(u))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold flex items-center gap-1"
                      title="שלח פרטים בוואטסאפ"
                    >
                      <Share2 size={13} />
                      <span>וואטסאפ</span>
                    </a>

                    <button className="button-small" disabled={u.isSuperAdmin} onClick={()=>{if(window.confirm('יש לאמת את זהות המשתמש. יצירת קישור שחזור מחליפה את מפתחות הכניסה הקיימים לאחר הפעלה. להמשיך?'))inviteUser(u.id,true);}}>הפעלה / שחזור</button>
                    <button disabled={u.isSuperAdmin}
                      onClick={() => {
                        const nextStatus = u.membershipStatus === 'active' ? 'suspended' : 'active';
                        saveUser({ ...u, membershipStatus: nextStatus });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                        u.membershipStatus === 'active'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {u.membershipStatus === 'active' ? 'השהה חברות' : 'הפעל חברות'}
                    </button>

                    <button
                      disabled={u.isSuperAdmin&&u.id!==currentUser?.id} aria-label={`עריכת משתמש ${u.fullName}`} onClick={() => {setIsNewUser(false);setTemporaryPassword('');setEditingUser(u);}}
                      className="p-2 rounded-xl bg-white border border-[#DFCEB0] text-graphite-700 hover:text-falcon-700"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: News CMS */}
      {activeTab === 'news' && (
        <div className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-graphite-900">עריכת תוכן חדשות ומאמרים</h3>
            <button
              onClick={handleOpenNewArticle}
              className="px-3.5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold flex items-center gap-1"
            >
              <Plus size={14} />
              <span>הוסף כתבה חדשה</span>
            </button>
          </div>

          <div className="space-y-3">
            {news.map(art => (
              <div key={art.id} className="p-4 rounded-2xl border border-[#EFE6D5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={art.imageUrl} alt="" className="w-16 h-12 rounded-xl object-cover" />
                  <div>
                    <span className="text-sm font-bold text-falcon-700">
                      {art.category === 'club' ? 'חדשות מועדון' : art.category === 'world' ? 'עולם' : 'ישראל'} | {art.publishDate}
                    </span>
                    <h4 className="font-bold text-sm text-graphite-900">{art.title}</h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <button
                    onClick={() => {
                      setEditingArticle(art);
                      setIsNewArticle(false);
                    }}
                    className="p-2 rounded-xl bg-white border border-[#DFCEB0] text-graphite-700 hover:text-falcon-700"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteNewsArticle(art.id)}
                    className="p-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Training Modal */}
      {editingTraining && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#EFE6D5] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-graphite-900">
              {isNewTraining ? 'יצירת אימון מועדון חדש' : 'עריכת אימון'}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-bold mb-1">כותרת האימון:</label>
                <input
                  type="text"
                  value={editingTraining.title}
                  onChange={e => setEditingTraining({ ...editingTraining, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">תאריך (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    value={editingTraining.date}
                    onChange={e => setEditingTraining({ ...editingTraining, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">קיבולת מקסימלית (יורים):</label>
                  <input
                    type="number"
                    value={editingTraining.maxCapacity}
                    onChange={e => setEditingTraining({ ...editingTraining, maxCapacity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">שעת התחלה:</label>
                  <input
                    type="text"
                    value={editingTraining.startTime}
                    onChange={e => setEditingTraining({ ...editingTraining, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">שעת סיום:</label>
                  <input
                    type="text"
                    value={editingTraining.endTime}
                    onChange={e => setEditingTraining({ ...editingTraining, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">מיקום במטווח:</label>
                  <button
                    type="button"
                    onClick={() => setEditingTraining({
                      ...editingTraining,
                      location: DEFAULT_RANGE_LOCATION,
                      locationMapUrl: DEFAULT_WAZE_URL,
                    })}
                    className="text-sm text-falcon-700 hover:text-falcon-900 font-bold underline"
                  >
                    הגדר מטווח נץ המדבר (שדרות)
                  </button>
                </div>
                <input
                  type="text"
                  value={editingTraining.location}
                  onChange={e => setEditingTraining({ ...editingTraining, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">קישור ניווט Waze / מפות (אופציונלי):</label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://waze.com/ul?q=..."
                  value={editingTraining.locationMapUrl || ''}
                  onChange={e => setEditingTraining({ ...editingTraining, locationMapUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0] font-mono text-sm"
                />
              </div>

              <div>
                <fieldset><legend>מדריכים משויכים</legend>{users.filter(u=>u.roles.includes('instructor')).map(u=><label className="flex gap-2 py-2" key={u.id}><input type="checkbox" checked={editingTraining.instructorIds.includes(u.id)} onChange={e=>setEditingTraining({...editingTraining,instructorIds:e.target.checked?[...editingTraining.instructorIds,u.id]:editingTraining.instructorIds.filter(id=>id!==u.id)})}/>{u.fullName}</label>)}</fieldset><div className="grid grid-cols-2 gap-3"><label>פתיחת הרשמה<input type="date" value={editingTraining.registrationOpenDate.slice(0,10)} onChange={e=>setEditingTraining({...editingTraining,registrationOpenDate:e.target.value})}/></label><label>סגירת הרשמה<input type="date" value={editingTraining.registrationCloseDate.slice(0,10)} onChange={e=>setEditingTraining({...editingTraining,registrationCloseDate:e.target.value})}/></label><label>ביטול עד שעות לפני<input type="number" min="0" value={editingTraining.cancelCutoffHours} onChange={e=>setEditingTraining({...editingTraining,cancelCutoffHours:Number(e.target.value)})}/></label><label>סטטוס<select value={editingTraining.status} onChange={e=>setEditingTraining({...editingTraining,status:e.target.value as any})}><option value="scheduled">מתוכנן</option><option value="in_progress">מתקיים</option><option value="completed">הסתיים</option><option value="cancelled">בוטל</option></select></label></div><label className="block">תשלום במקום<input value={editingTraining.priceNote} onChange={e=>setEditingTraining({...editingTraining,priceNote:e.target.value})} className="w-full p-2 border rounded"/></label>
                <label className="block font-bold mb-1">תיאור ומערך תרגילים:</label>
                <textarea
                  rows={2}
                  value={editingTraining.description}
                  onChange={e => setEditingTraining({ ...editingTraining, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setEditingTraining(null)}
                className="px-4 py-2 rounded-xl text-graphite-600 hover:bg-gray-100 text-sm font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={async () => { if(await saveTrainingSession(editingTraining)) setEditingTraining(null); }}
                className="px-5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold"
              >
                שמור אימון
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Article Modal */}
      {editingArticle && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#EFE6D5] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-graphite-900">
              {isNewArticle ? 'יצירת כתבה חדשה' : 'עריכת כתבה'}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-bold mb-1">כותרת הכתבה:</label>
                <input
                  type="text"
                  value={editingArticle.title}
                  onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">קטגוריה:</label>
                <select
                  value={editingArticle.category}
                  onChange={e => setEditingArticle({ ...editingArticle, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                >
                  <option value="club">חדשות המועדון</option>
                  <option value="israel">ירי מעשי ישראל</option>
                  <option value="world">מהעולם (IPSC World)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">פרסום<select value={editingArticle.status} onChange={e=>setEditingArticle({...editingArticle,status:e.target.value as any})} className="w-full p-2 border rounded"><option value="draft">טיוטה</option><option value="published">פורסם</option><option value="archived">ארכיון</option></select></label><label className="block font-bold mb-1">קישור למקור<input type="url" value={editingArticle.sourceUrl||''} onChange={e=>setEditingArticle({...editingArticle,sourceUrl:e.target.value})} className="w-full p-2 border rounded"/></label>
                <label className="block font-bold mb-1">קישור לתמונה (Image URL):</label>
                <input
                  type="text"
                  value={editingArticle.imageUrl}
                  onChange={e => setEditingArticle({ ...editingArticle, imageUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">תקציר (Excerpt):</label>
                <textarea
                  rows={2}
                  value={editingArticle.excerpt}
                  onChange={e => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">תוכן מלא:</label>
                <textarea
                  rows={4}
                  value={editingArticle.content}
                  onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setEditingArticle(null)}
                className="px-4 py-2 rounded-xl text-graphite-600 hover:bg-gray-100 text-sm font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={async () => { if(await saveNewsArticle(editingArticle)) setEditingArticle(null); }}
                className="px-5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold"
              >
                שמור כתבה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create User Modal */}
      {editingUser && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-sm animate-fade-in text-right">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#EFE6D5] p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-graphite-900">
              {isNewUser ? 'הוספת חבר מועדון / משתמש חדש' : 'עריכת פרטי משתמש והרשאות'}
            </h3>

            <div className="space-y-4 text-sm">
              {/* Mandatory Fields */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#DFCEB0] rounded-2xl space-y-3">
                <div className="text-sm font-bold text-falcon-800 flex items-center gap-1">
                  <span>שדות חובה</span>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    שם מלא: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="שם פרטי ומשפחה"
                    value={editingUser.fullName}
                    onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    מספר טלפון: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    inputMode="tel"
                    placeholder="050-000-0000"
                    value={editingUser.phone}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white font-mono font-semibold"
                  />
                  <span className="text-sm text-graphite-500 mt-0.5 block">
                    מספר הטלפון משמש כשם המשתמש הראשי לכניסה למערכת
                  </span>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isNewUser ? 'סיסמה זמנית ראשונית:' : 'קביעת סיסמה זמנית חדשה:'}{' '}
                    {isNewUser && <span className="text-rose-600">*</span>}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    required={isNewUser}
                    minLength={6}
                    placeholder={isNewUser ? 'למשל: Falcon2026 (לפחות 6 תווים)' : 'השאר ריק אם אין צורך לשנות סיסמה'}
                    value={temporaryPassword}
                    onChange={e => setTemporaryPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#DFCEB0] bg-white font-mono font-semibold"
                  />
                  <span className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg mt-1 block">
                    🔒 המשתמש יחויב להחליף סיסמה זו לסיסמה אישית בכניסתו הראשונה למערכת.
                  </span>
                </div>
              </div>

              {/* Optional Fields Accordion / Section */}
              <details className="group border border-[#EFE6D5] rounded-2xl p-3 bg-white">
                <summary className="font-bold text-sm cursor-pointer text-graphite-700 flex items-center justify-between select-none">
                  <span>פרטים נוספים (רשות / אופציונלי)</span>
                  <span className="text-falcon-700 text-sm group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <div className="space-y-3 pt-3 mt-2 border-t border-[#EFE6D5]">
                  <div>
                    <label className="block font-bold mb-1">כתובת דוא״ל (אופציונלי):</label>
                    <input
                      aria-label="דוא״ל משתמש"
                      type="email"
                      dir="ltr"
                      placeholder="user@example.com"
                      value={editingUser.email || ''}
                      onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">תפקיד ראשי:</label>
                    <select
                      disabled={editingUser.isSuperAdmin}
                      value={editingUser.role}
                      onChange={e =>
                        setEditingUser({
                          ...editingUser,
                          role: e.target.value as any,
                          roles: Array.from(new Set([...editingUser.roles, e.target.value as any])),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                    >
                      <option value="shooter">יורה / חבר מועדון</option>
                      <option value="instructor">מדריך מוסמך</option>
                      <option value="admin">מנהל מערכת</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">סטטוס חברות:</label>
                    <select
                      disabled={editingUser.isSuperAdmin}
                      value={editingUser.membershipStatus}
                      onChange={e => setEditingUser({ ...editingUser, membershipStatus: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-[#DFCEB0]"
                    >
                      <option value="active">פעיל (רשאי להירשם לאימונים)</option>
                      <option value="suspended">מושהה (חסום מאימונים)</option>
                      <option value="pending">ממתין לאישור</option>
                      <option value="expired">חברות פגה</option>
                    </select>
                  </div>

                  <fieldset>
                    <legend className="font-bold mb-1">הרשאות נוספות:</legend>
                    <div className="flex gap-2">
                      {(['shooter', 'instructor', 'admin'] as const).map(r => (
                        <label key={r} className="inline-flex items-center gap-1.5 p-1">
                          <input
                            type="checkbox"
                            checked={editingUser.roles.includes(r)}
                            disabled={editingUser.isSuperAdmin || r === editingUser.role}
                            onChange={e =>
                              setEditingUser({
                                ...editingUser,
                                roles: e.target.checked
                                  ? [...editingUser.roles, r]
                                  : editingUser.roles.filter(x => x !== r),
                              })
                            }
                          />
                          <span>{r === 'admin' ? 'מנהל' : r === 'instructor' ? 'מדריך' : 'יורה'}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={editingUser.ipscCourseVerified}
                      onChange={e => setEditingUser({ ...editingUser, ipscCourseVerified: e.target.checked })}
                    />
                    <span>הקורס אומת על ידי המועדון</span>
                  </label>

                  <MemberFields value={editingUser} onChange={next => setEditingUser({ ...editingUser, ...next })} />
                  {users.some(u => u.id === editingUser.id) && (
                    <ProfilePhoto user={users.find(u => u.id === editingUser.id)!} editable />
                  )}
                </div>
              </details>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setIsNewUser(false);
                }}
                className="px-4 py-2 rounded-xl text-graphite-600 hover:bg-gray-100 text-sm font-semibold"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingUser.fullName.trim()) {
                    alert('יש להזין שם מלא');
                    return;
                  }
                  if (!editingUser.phone.trim()) {
                    alert('יש להזין מספר טלפון');
                    return;
                  }
                  if (isNewUser && (!temporaryPassword || temporaryPassword.length < 6)) {
                    alert('יש להזין סיסמה זמנית של לפחות 6 תווים הכוללת אותיות וספרות');
                    return;
                  }
                  const userToSave = {
                    ...editingUser,
                    temporaryPassword: temporaryPassword || undefined,
                  };
                  if (await saveUser(userToSave)) {
                    setEditingUser(null);
                    setIsNewUser(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-falcon-500 hover:bg-falcon-600 text-white text-sm font-bold"
              >
                {isNewUser ? 'צור משתמש חדש' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
