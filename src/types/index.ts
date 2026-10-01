export type UserRole = 'guest' | 'shooter' | 'instructor' | 'admin';

export type MembershipStatus = 'active' | 'suspended' | 'expired' | 'pending';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  roles: UserRole[]; // user can have multiple roles e.g. instructor & shooter
  membershipStatus: MembershipStatus;
  ipscCourseVerified: boolean;
  ipscCourseDetails?: string;
  joinedDate: string;
  avatar?: string;
  username?: string;
  isSuperAdmin?: boolean;
  birthDate?: string;
  shooterNumber?: string;
  division?: string;
  classification?: string;
  avatarVersion?: string;
  twoFactorEnabled?: boolean;
  mustChangePassword?: boolean;
  temporaryPassword?: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  type: string; // 'אימון מועדון פתוח', 'אימון טקטי / ירי בתנועה', 'אימון מתקדמים', 'סימולציית תחרות Level I'
  description: string;
  date: string; // ISO string or YYYY-MM-DD
  startTime: string; // '18:00'
  endTime: string; // '21:00'
  location: string;
  locationMapUrl?: string;
  instructorIds: string[];
  instructorNames: string[];
  maxCapacity: number;
  registeredCount: number;
  waitlistCount: number;
  eligibilityRequirements: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  cancelCutoffHours: number; // e.g. 24 hours before
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  exerciseIds?: string[];
  priceNote: string; // '80 ₪ (תשלום במקום בלבד)'
}

export type AttendanceStatus = 'not_marked' | 'attended' | 'absent';
export type RegistrationStatus = 'confirmed' | 'waitlist' | 'cancelled';

export interface Registration {
  id: string;
  trainingId: string;
  userId: string;
  userName: string;
  userPhone: string;
  registeredAt: string;
  status: RegistrationStatus;
  waitlistPosition?: number;
  attendance: AttendanceStatus;
  paymentOnSite: boolean;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  targetCount: number;
  maxPoints: number;
  measurementType: 'hit_factor' | 'time_plus_penalties' | 'points';
  version?: string;trainingId?:string;paper?:number;hitsPerPaper?:number;plates?:number;poppers?:number;noShoots?:number;conditions?:string;sourceUrl?:string;diagramUrl?:string;approvedForRange?:boolean;
}

export interface ExerciseResult {
  id: string;
  trainingId: string;
  trainingDate: string;
  exerciseTemplateId: string;
  exerciseTemplateName: string;
  userId: string;
  userName: string;
  hitsA: number;
  hitsC: number;
  hitsD: number;
  misses: number;
  procedurals: number;
  timeSeconds: number;
  rawPoints: number;
  hitFactor: number; // rawPoints / timeSeconds
  scorePercentage?: number;
  metalHits?:number;metalMisses?:number;noShootHits?:number;powerFactor?:'minor'|'major';division?:string;exerciseVersion?:string;exerciseSnapshot?:ExerciseTemplate;measurementType?:string;recordedAt?:string;
  notes?: string;
}

export type FocusStatus = 'open' | 'in_progress' | 'completed';
export type FocusPriority = 'high' | 'medium' | 'low';

export interface FocusItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: FocusPriority;
  status: FocusStatus;
  createdTrainingId: string;
  createdDate: string;
  updatedDate?: string;
  completedDate?: string;
  instructorName: string;
}

export interface Feedback {
  id: string;
  trainingId: string;
  trainingDate: string;
  trainingTitle: string;
  userId: string;
  instructorId: string;
  instructorName: string;
  status: 'draft' | 'published';
  summary: string;
  strengths: string[];
  improvements: string[];
  focusItems: FocusItem[];
  internalInstructorNote?: string; // Private for instructors only
  createdAt: string;
  publishedAt?: string;
  updatedAt?: string;
}

export type LeadType = 'course_inquiry' | 'club_join';
export type LeadStatus = 'new' | 'in_progress' | 'pending_docs' | 'approved' | 'rejected' | 'closed';

export interface LeadInquiry {
  id: string;
  type: LeadType;
  fullName: string;
  phone: string;
  email: string;
  availability?: string;
  previousExperience?: string;
  licenseStatus?: 'licensed'|'approval_needed'|'discuss';
  courseDetails?: string;
  courseDate?: string;
  notes?: string;
  status: LeadStatus;
  assignedTo?: string;
  internalNotes?: string;
  createdAt: string;
}

export type NewsCategory = 'club' | 'israel' | 'world';
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface NewsArticle {
  id: string;
  category: NewsCategory;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  publishDate: string;
  status: ArticleStatus;
  author: string;
  sourceUrl?: string;
}

export interface PublicPages {id:'public';heroTitle:string;heroAccent:string;heroBody:string;aboutTitle:string;aboutBody:string;sportTitle:string;sportBody:string;whatsappUrl?:string;instagramUrl?:string;facebookUrl?:string;}
