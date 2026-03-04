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
  mentorId: number;
  mentorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectDTO {
  name: string;
  description?: string;
  mentorId: number;
}

export interface UpdateSubjectDTO {
  name: string;
  description?: string;
}

/* ── Session ───────────────────────────────────────────────────────────── */

export interface SessionDTO {
  id: number;
  mentorId: number;
  mentorName: string;
  subjectId: number;
  subjectName: string;
  sessionAt: string;
  durationMinutes: number;
  maxParticipants: number;
  sessionType: SessionType;
  sessionStatus: SessionStatus;
  meetingLink: string | null;
  sessionNotes: string | null;
  studentReview: string | null;
  studentRating: number | null;
  receiptUrl: string | null;
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
}
