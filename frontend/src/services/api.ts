// ---------------------------------------------------------------------------
// API service functions – one per backend endpoint
// ---------------------------------------------------------------------------
import api from "@/lib/api";
import type {
  BookSessionDTO,
  CreateMentorDTO,
  CreateSessionDTO,
  CreateStudentDTO,
  CreateSubjectDTO,
  MentorDTO,
  MyRolesResponse,
  OnboardingRequest,
  OnboardingResponse,
  OnboardingStatus,
  SessionDTO,
  StudentDTO,
  SubjectDTO,
  UpdateMentorDTO,
  UpdateSessionDTO,
  UpdateStudentDTO,
  UpdateSubjectDTO,
  UserDTO,
} from "@/types";

/* ── Users ─────────────────────────────────────────────────────────────── */

export const usersApi = {
  syncCurrentUser: () =>
    api.post<UserDTO>("/api/users/sync").then((r) => r.data),
  getCurrentUser: () => api.get<UserDTO>("/api/users/me").then((r) => r.data),
};

/* ── Onboarding ────────────────────────────────────────────────────────── */

export const onboardingApi = {
  getStatus: () =>
    api.get<OnboardingStatus>("/api/onboarding/status").then((r) => r.data),
  complete: (data: OnboardingRequest) =>
    api
      .post<OnboardingResponse>("/api/onboarding/complete", data)
      .then((r) => r.data),
  getMyRoles: () =>
    api.get<MyRolesResponse>("/api/onboarding/my-roles").then((r) => r.data),
  updateRoles: (data: { clerkId: string; roles: string[] }) =>
    api
      .put<OnboardingResponse>("/api/onboarding/roles", data)
      .then((r) => r.data),
};

/* ── Mentors ───────────────────────────────────────────────────────────── */

export const mentorsApi = {
  getAll: () => api.get<MentorDTO[]>("/api/mentors").then((r) => r.data),
  getById: (id: number) =>
    api.get<MentorDTO>(`/api/mentors/${id}`).then((r) => r.data),
  getSessions: (id: number) =>
    api.get<SessionDTO[]>(`/api/mentors/${id}/sessions`).then((r) => r.data),
  create: (data: CreateMentorDTO) =>
    api.post<MentorDTO>("/api/mentors", data).then((r) => r.data),
  update: (id: number, data: UpdateMentorDTO) =>
    api.put<MentorDTO>(`/api/mentors/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<string>(`/api/mentors/${id}`).then((r) => r.data),
};

/* ── Students ──────────────────────────────────────────────────────────── */

export const studentsApi = {
  getAll: () => api.get<StudentDTO[]>("/api/students").then((r) => r.data),
  getById: (id: number) =>
    api.get<StudentDTO>(`/api/students/${id}`).then((r) => r.data),
  getSessions: (id: number) =>
    api.get<SessionDTO[]>(`/api/students/${id}/sessions`).then((r) => r.data),
  create: (data: CreateStudentDTO) =>
    api.post<StudentDTO>("/api/students", data).then((r) => r.data),
  update: (id: number, data: UpdateStudentDTO) =>
    api.put<StudentDTO>(`/api/students/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<string>(`/api/students/${id}`).then((r) => r.data),
};

/* ── Subjects ──────────────────────────────────────────────────────────── */

export const subjectsApi = {
  getAll: () => api.get<SubjectDTO[]>("/api/subjects").then((r) => r.data),
  getById: (id: number) =>
    api.get<SubjectDTO>(`/api/subjects/${id}`).then((r) => r.data),
  create: (data: CreateSubjectDTO) =>
    api.post<SubjectDTO>("/api/subjects", data).then((r) => r.data),
  update: (id: number, data: UpdateSubjectDTO) =>
    api.put<SubjectDTO>(`/api/subjects/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<string>(`/api/subjects/${id}`).then((r) => r.data),
};

/* ── Sessions ──────────────────────────────────────────────────────────── */

export const sessionsApi = {
  getAll: () => api.get<SessionDTO[]>("/api/sessions").then((r) => r.data),
  getById: (id: number) =>
    api.get<SessionDTO>(`/api/sessions/${id}`).then((r) => r.data),
  getByStudent: (studentId: number) =>
    api
      .get<SessionDTO[]>(`/api/sessions/student/${studentId}`)
      .then((r) => r.data),
  getByMentor: (mentorId: number) =>
    api
      .get<SessionDTO[]>(`/api/sessions/mentor/${mentorId}`)
      .then((r) => r.data),
  create: (data: CreateSessionDTO) =>
    api.post<SessionDTO>("/api/sessions", data).then((r) => r.data),
  /** Student self-booking – backend determines student from JWT */
  book: (data: BookSessionDTO) =>
    api.post<SessionDTO>("/api/sessions/book", data).then((r) => r.data),
  update: (id: number, data: Partial<UpdateSessionDTO>) =>
    api.put<SessionDTO>(`/api/sessions/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete<string>(`/api/sessions/${id}`).then((r) => r.data),
};
