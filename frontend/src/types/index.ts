// ---------------------------------------------------------------------------
// Shared TypeScript types that mirror the backend DTOs
// ---------------------------------------------------------------------------

/* ── Enums ─────────────────────────────────────────────────────────────── */

export type UserRole = "USER" | "MENTOR" | "STUDENT" | "ADMIN";
export type SessionStatus =
  | "PENDING"
  | "SCHEDULED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELED";
export type SessionType = "INDIVIDUAL" | "GROUP";
export type ReceiptStatus = "NONE" | "SUBMITTED" | "APPROVED" | "REJECTED";

/* ── User / Onboarding ─────────────────────────────────────────────────── */

export interface UserDTO {
  id: number;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: UserRole[];
  profileImageUrl: string | null;
  onboardingCompleted: boolean;
  lastLogin: string | null;
}

export interface OnboardingRequest {
  role: UserRole;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  userId?: string;
  clerkId?: string;
  email?: string;
  roles?: UserRole[];
}

export interface OnboardingStatus {
  completed: boolean;
  clerkId: string;
  email: string;
  roles: UserRole[];
  error?: string;
}

export interface MyRolesResponse {
  clerkId: string;
  email: string;
  roles: UserRole[];
}

/* ── Mentor ────────────────────────────────────────────────────────────── */

export interface MentorDTO {
  id: number;
  userId: number;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  title: string;
  profession: string;
  company: string;
  experienceYears: number;
  bio: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  hourlyRate: number | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  averageRating: number;
  totalReviews: number;
  linkedinUrl: string | null;
  githubUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorDTO {
  phoneNumber: string;
  title: string;
  profession: string;
  company: string;
  experienceYears: number;
  bio?: string;
  hourlyRate: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export type UpdateMentorDTO = CreateMentorDTO;

/* ── Student ───────────────────────────────────────────────────────────── */

export interface StudentDTO {
  id: number;
  userId: number;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  learningGoals: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
}

export interface CreateStudentDTO {
  studentCode: string;
  learningGoals?: string;
}

export interface UpdateStudentDTO {
  learningGoals?: string;
}

/* ── Subject ───────────────────────────────────────────────────────────── */

export interface SubjectDTO {
  id: number;
  subjectName: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  mentorId: number;
  mentorName: string;
  averageRating: number;
  totalReviews: number;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectDTO {
  name: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  mentorId: number;
}

export interface UpdateSubjectDTO {
  name: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
}

/* ── Session ───────────────────────────────────────────────────────────── */

export interface SessionDTO {
  id: number;
  mentorId: number;
  mentorName: string;
  subjectId: number;
  subjectName: string;
  /** Primary student (INDIVIDUAL) — populated by backend from enrolled students list */
  studentId: number | null;
  studentName: string | null;
  /** All enrolled student names — useful for GROUP sessions */
  studentNames: string[];
  sessionAt: string;
  durationMinutes: number;
  maxParticipants: number;
  currentParticipants: number;
  sessionType: SessionType;
  sessionStatus: SessionStatus;
  receiptStatus: ReceiptStatus;
  meetingLink: string | null;
  meetingPassword: string | null;
  sessionNotes: string | null;
  studentReview: string | null;
  studentRating: number | null;
  receiptUrl: string | null;
  rejectionReason: string | null;
  /** Post-session resources added by mentor */
  recordingLink: string | null;
  resourceLink: string | null;
  assessmentLink: string | null;
}

export interface CreateSessionDTO {
  studentIds: number[];
  mentorId: number;
  subjectId: number;
  sessionType: SessionType;
  maxParticipants?: number;
  sessionAt: string;
  durationMinutes: number;
}

export interface UpdateSessionDTO {
  sessionAt?: string;
  durationMinutes?: number;
  sessionStatus: SessionStatus;
  sessionType: SessionType;
  maxParticipants?: number;
  meetingLink?: string;
  sessionNotes?: string;
  studentReview?: string;
  studentRating?: number;
  receiptUrl?: string;
}

/** Student self-booking (no studentIds – backend resolves from JWT) */
export interface BookSessionDTO {
  mentorId: number;
  subjectId: number;
  sessionAt: string;
  durationMinutes: number;
  sessionType?: SessionType;
  /** For GROUP sessions only — max number of participants (2–20) */
  maxParticipants?: number;
}

/* ── New action DTOs ───────────────────────────────────────────────────── */

export interface SubmitReceiptDTO {
  receiptUrl: string;
}

export interface ApproveSessionDTO {
  meetingLink: string;
  meetingPassword?: string;
}

export interface RejectSessionDTO {
  reason: string;
}

export interface CompleteSessionDTO {
  sessionNotes?: string;
}

/** Mentor updates session info — meeting link/password (SCHEDULED+) and post-session resources (STARTED+) */
export interface UpdateSessionResourcesDTO {
  meetingLink?: string;
  meetingPassword?: string;
  recordingLink?: string;
  resourceLink?: string;
  assessmentLink?: string;
  sessionNotes?: string;
}

export interface ReviewSessionDTO {
  rating: number;
  review: string;
}

/* ── Mentor Availability ───────────────────────────────────────────────── */

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface MentorAvailabilityDTO {
  id: number;
  mentorId: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isActive: boolean;
}

export interface CreateMentorAvailabilityDTO {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isActive?: boolean;
}
