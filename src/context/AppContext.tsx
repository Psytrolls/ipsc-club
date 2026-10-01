import React, {createContext,useContext,useState,useEffect,useRef,useCallback} from 'react';

import {User,UserRole,TrainingSession,Registration,ExerciseResult,ExerciseTemplate,Feedback,FocusItem,FocusStatus,LeadInquiry,LeadStatus,NewsArticle,PublicPages} from '../types';
export async function api(path:string,method='GET',body?:unknown){const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:method==='GET'?{}:{'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw new Error(data.error||'הפעולה נכשלה');return data;}
interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  currentUser: User | null;
  activeRole: UserRole;
  users: User[];
  trainings: TrainingSession[];
  registrations: Registration[];
  exerciseTemplates: ExerciseTemplate[];
  exerciseResults: ExerciseResult[];
  focusItems: FocusItem[];
  feedbacks: Feedback[];
  leads: LeadInquiry[];
  news: NewsArticle[];
  toasts: ToastMessage[];

  // Authentication and assigned roles
  loginPassword: (login:string,password:string) => Promise<boolean>;
  activatePassword: (activation:string,password:string,phone?:string) => Promise<boolean>;
  saveProfile: (profile:Partial<User>) => Promise<boolean>;
  refresh: () => Promise<void>;
  activationUrl: string | null;
  clearActivationUrl: () => void;
  pages: PublicPages;
  savePages: (pages: PublicPages) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  setGuestMode: () => void;
  switchRole: (role: UserRole) => void;

  // Training & Registrations
  registerForTraining: (
    trainingId: string,
    userId?: string,
  ) => Promise<{ success: boolean; message: string; waitlist?: boolean }>;
  cancelRegistration: (registrationId: string) => Promise<{ success: boolean; message: string }>;
  updateAttendance: (
    registrationId: string,
    attendance: "not_marked" | "attended" | "absent",
    paymentOnSite?: boolean,
  ) => Promise<boolean>;
  saveTrainingSession: (session: TrainingSession) => Promise<boolean>;
  deleteTrainingSession: (sessionId: string) => Promise<boolean>;

  // Results & Feedback
  addExerciseResult: (result: Omit<ExerciseResult, "id">) => Promise<boolean>;
  saveFeedback: (feedback: Feedback) => Promise<boolean>;
  updateFocusItemStatus: (itemId: string, status: FocusStatus) => Promise<boolean>;

  // CRM & Leads
  submitLeadInquiry: (
    lead: Omit<LeadInquiry, "id" | "createdAt" | "status">,
  ) => Promise<boolean>;
  updateLeadStatus: (
    leadId: string,
    status: LeadStatus,
    internalNotes?: string,
    assignedTo?: string,
  ) => Promise<boolean>;
  convertLeadToUser: (leadId: string) => Promise<User | null>;
  inviteUser: (userId: string, confirmIdentity?: boolean) => Promise<boolean>;

  // Users Management
  saveUser: (user: User) => Promise<boolean>;

  // News CMS
  saveNewsArticle: (article: NewsArticle) => Promise<boolean>;
  deleteNewsArticle: (articleId: string) => Promise<boolean>;

  // Toast UI
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  dismissToast: (id: string) => void;

  // Helpers
  getMyUpcomingTraining: () => {
    session: TrainingSession;
    registration: Registration;
  } | null;
  getMyRegistrations: () => Registration[];
  getMyFeedbacks: () => Feedback[];
  getMyFocusItems: () => FocusItem[];
  getMyResults: () => ExerciseResult[];
}

const AppContext=createContext<AppContextType|undefined>(undefined);
const initialPages:PublicPages={id:'public',heroTitle:'מתאמנים יחד.',heroAccent:'מתקדמים יחד.',heroBody:'ברוכים הבאים לנץ המדבר.',aboutTitle:'הרבה מעבר לאימון במטווח.',aboutBody:'ספורט, קהילה והדרכה אישית.',sportTitle:'תנועה. ריכוז. ירי מעשי.',sportBody:'הכירו את ענף הירי המעשי.'};
const empty={currentUser:null as User|null,users:[] as User[],trainings:[] as TrainingSession[],registrations:[] as Registration[],exerciseTemplates:[] as ExerciseTemplate[],exerciseResults:[] as ExerciseResult[],focusItems:[] as FocusItem[],feedbacks:[] as Feedback[],leads:[] as LeadInquiry[],news:[] as NewsArticle[],pages:initialPages};
export const AppProvider:React.FC<{children:React.ReactNode}>=({children})=>{
 const [data,setData]=useState(empty);const [activeRole,setActiveRole]=useState<UserRole>('guest');const role=useRef<UserRole>('guest');const generation=useRef(0);const [toasts,setToasts]=useState<ToastMessage[]>([]);const [activationUrl,setActivationUrl]=useState<string|null>(null);
 const showToast=useCallback((message:string,type:'success'|'error'|'info'='info')=>{const id=crypto.randomUUID();setToasts(p=>[...p,{id,message,type}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),5000);},[]);
 const dismissToast=(id:string)=>setToasts(p=>p.filter(t=>t.id!==id));
 const reload=useCallback(async(preferred?:UserRole)=>{const n=++generation.current;const target=preferred||role.current;try{const result=await api('/state'+(target==='guest'?'':'?role='+target));if(n!==generation.current)return;setData(result);const chosen=result.currentUser?(target!=='guest'&&result.currentUser.roles.includes(target)?target:result.currentUser.role):'guest';role.current=chosen;setActiveRole(chosen);}catch(e){if(n===generation.current)showToast(e instanceof Error?e.message:'שגיאת חיבור','error');}},[showToast]);
 const refresh=()=>reload();
 useEffect(()=>{reload();const poll=setInterval(()=>{if(!document.hidden)reload();},20000);return()=>{clearInterval(poll);generation.current++;};},[reload]);
 const mutation=async(path:string,method:string,value?:unknown,message='נשמר בהצלחה')=>{try{const result=await api(path,method,value);if(result.activationUrl)setActivationUrl(result.activationUrl);await reload();showToast(result.message||message,'success');return {success:true,...result};}catch(e){const message=e instanceof Error?e.message:'הפעולה נכשלה';showToast(message,'error');return {success:false,message};}};
 const loginPassword=async(login:string,password:string)=>{try{await api('/auth/password/login','POST',{login,password});await reload('guest');showToast('התחברת בהצלחה','success');return true;}catch(e){showToast(e instanceof Error?e.message:'הכניסה נכשלה','error');return false;}};
 const activatePassword=async(activation:string,password:string,phone?:string)=>{try{await api('/auth/password/activate','POST',{activation,password,phone});history.replaceState(null,'',location.pathname+location.search);await reload('guest');showToast('החשבון הופעל בהצלחה','success');return true;}catch(e){showToast(e instanceof Error?e.message:'ההפעלה נכשלה','error');return false;}};
 const saveProfile=async(profile:Partial<User>)=>(await mutation('/profile','PATCH',profile)).success;
 const logoutUser=async()=>{try{await api('/auth/logout','POST',{});++generation.current;setData({...empty,pages:data.pages,news:data.news.filter(n=>n.status==='published')});role.current='guest';setActiveRole('guest');await reload('guest');}catch{showToast('ההתנתקות נכשלה. נסו שוב.','error');}};
 const setGuestMode=()=>{role.current='guest';reload('guest');};
 const switchRole=(r:UserRole)=>{if(data.currentUser?.roles.includes(r)){role.current=r;reload(r);}};
 const registerForTraining=async(trainingId:string,userId?:string)=>mutation('/trainings/'+encodeURIComponent(trainingId)+'/register','POST',userId?{userId}:{});
 const cancelRegistration=async(id:string)=>mutation('/registrations/'+encodeURIComponent(id)+'/cancel','POST',{});
 const updateAttendance=async(id:string,attendance:'not_marked'|'attended'|'absent',paymentOnSite?:boolean)=>(await mutation('/registrations/'+encodeURIComponent(id)+'/attendance','PATCH',{attendance,paymentOnSite})).success;
 const saveTrainingSession=async(t:TrainingSession)=>(await mutation('/trainings/'+encodeURIComponent(t.id),'PUT',t)).success;
 const deleteTrainingSession=async(id:string)=>(await mutation('/trainings/'+encodeURIComponent(id),'DELETE')).success;
 const addExerciseResult=async(r:Omit<ExerciseResult,'id'>)=>(await mutation('/results','POST',r)).success;
 const saveFeedback=async(f:Feedback)=>(await mutation('/feedbacks/'+encodeURIComponent(f.id),'PUT',f)).success;
 const updateFocusItemStatus=async(id:string,status:FocusStatus)=>(await mutation('/focus/'+encodeURIComponent(id),'PATCH',{status})).success;
 const submitLeadInquiry=async(l:Omit<LeadInquiry,'id'|'createdAt'|'status'>)=>(await mutation('/leads','POST',l,'הפנייה נשלחה למועדון')).success;
 const updateLeadStatus=async(id:string,status:LeadStatus,internalNotes?:string,assignedTo?:string)=>(await mutation('/leads/'+encodeURIComponent(id),'PATCH',{status,internalNotes,assignedTo})).success;
 const convertLeadToUser=async(id:string)=>{const r=await mutation('/leads/'+encodeURIComponent(id)+'/convert','POST',{});return r.success?r.user:null;};
 const saveUser=async(u:User)=>(await mutation('/users/'+encodeURIComponent(u.id),'PUT',u)).success;
 const inviteUser=async(id:string,confirmIdentity=false)=>(await mutation('/users/'+encodeURIComponent(id)+'/invite','POST',{confirmIdentity},'קישור ההפעלה נוצר')).success;
 const saveNewsArticle=async(n:NewsArticle)=>(await mutation('/news/'+encodeURIComponent(n.id),'PUT',n)).success;
 const deleteNewsArticle=async(id:string)=>(await mutation('/news/'+encodeURIComponent(id),'DELETE')).success;
 const savePages=async(p:PublicPages)=>(await mutation('/pages','PUT',p)).success;
 const getMyRegistrations=()=>data.registrations.filter(r=>r.userId===data.currentUser?.id);
 const getMyFeedbacks=()=>data.feedbacks.filter(f=>f.userId===data.currentUser?.id&&f.status==='published');
 const getMyFocusItems=()=>data.focusItems.filter(f=>f.userId===data.currentUser?.id);
 const getMyResults=()=>data.exerciseResults.filter(r=>r.userId===data.currentUser?.id);
 const getMyUpcomingTraining=()=>{const confirmed=getMyRegistrations().filter(r=>r.status==='confirmed');const t=[...data.trainings].filter(t=>t.status==='scheduled'&&new Date(`${t.date}T${t.startTime}:00`).getTime()>Date.now()&&confirmed.some(r=>r.trainingId===t.id)).sort((a,b)=>`${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))[0];return t?{session:t,registration:confirmed.find(r=>r.trainingId===t.id)!}:null;};
 return <AppContext.Provider value={{...data,activeRole,toasts,activationUrl,clearActivationUrl:()=>setActivationUrl(null),pages:data.pages,savePages,refresh,loginPassword,activatePassword,saveProfile,logoutUser,setGuestMode,switchRole,showToast,dismissToast,registerForTraining,cancelRegistration,updateAttendance,saveTrainingSession,deleteTrainingSession,addExerciseResult,saveFeedback,updateFocusItemStatus,submitLeadInquiry,updateLeadStatus,convertLeadToUser,saveUser,inviteUser,saveNewsArticle,deleteNewsArticle,getMyRegistrations,getMyFeedbacks,getMyFocusItems,getMyResults,getMyUpcomingTraining}}>{children}</AppContext.Provider>;
};
export const useApp=()=>{const value=useContext(AppContext);if(!value)throw Error('AppProvider is required');return value;};
