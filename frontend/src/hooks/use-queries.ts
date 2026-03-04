// ---------------------------------------------------------------------------
// TanStack Query hooks – centralised data fetching
// ---------------------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  mentorsApi,
  studentsApi,
  subjectsApi,
  sessionsApi,
  usersApi,
  onboardingApi,
} from "@/services/api";
import type {
  BookSessionDTO,
  CreateMentorDTO,
  CreateSessionDTO,
  CreateStudentDTO,
  CreateSubjectDTO,
  UpdateMentorDTO,
  UpdateSessionDTO,
  UpdateStudentDTO,
  UpdateSubjectDTO,
  OnboardingRequest,
} from "@/types";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api";

/* ── Users ─────────────────────────────────────────────────────────────── */

export const useCurrentUser = () =>
  useQuery({ queryKey: ["currentUser"], queryFn: usersApi.getCurrentUser });

export const useSyncUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.syncCurrentUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUser"] }),
  });
};

/* ── Onboarding ────────────────────────────────────────────────────────── */

export const useOnboardingStatus = () =>
  useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: onboardingApi.getStatus,
  });

export const useCompleteOnboarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingRequest) => onboardingApi.complete(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding"] });
      qc.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Onboarding completed!");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

/* ── Mentors ───────────────────────────────────────────────────────────── */

export const useMentors = () =>
  useQuery({ queryKey: ["mentors"], queryFn: mentorsApi.getAll });

export const useMentor = (id: number) =>
  useQuery({
    queryKey: ["mentors", id],
    queryFn: () => mentorsApi.getById(id),
    enabled: !!id,
  });

export const useMentorSessions = (id: number) =>
  useQuery({
    queryKey: ["mentors", id, "sessions"],
    queryFn: () => mentorsApi.getSessions(id),
    enabled: !!id,
  });

export const useCreateMentor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMentorDTO) => mentorsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Mentor created successfully");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useUpdateMentor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMentorDTO }) =>
      mentorsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Mentor updated successfully");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useDeleteMentor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mentorsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Mentor deleted");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

/* ── Students ──────────────────────────────────────────────────────────── */

export const useStudents = () =>
  useQuery({ queryKey: ["students"], queryFn: studentsApi.getAll });

export const useStudent = (id: number) =>
  useQuery({
    queryKey: ["students", id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });

export const useStudentSessions = (id: number) =>
  useQuery({
    queryKey: ["students", id, "sessions"],
    queryFn: () => studentsApi.getSessions(id),
    enabled: !!id,
  });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentDTO) => studentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student profile created");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentDTO }) =>
      studentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

/* ── Subjects ──────────────────────────────────────────────────────────── */

export const useSubjects = () =>
  useQuery({ queryKey: ["subjects"], queryFn: subjectsApi.getAll });

export const useSubject = (id: number) =>
  useQuery({
    queryKey: ["subjects", id],
    queryFn: () => subjectsApi.getById(id),
    enabled: !!id,
  });

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubjectDTO) => subjectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject created successfully");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useUpdateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubjectDTO }) =>
      subjectsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject updated");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subjectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

/* ── Sessions ──────────────────────────────────────────────────────────── */

export const useSessions = () =>
  useQuery({ queryKey: ["sessions"], queryFn: sessionsApi.getAll });

export const useSession = (id: number) =>
  useQuery({
    queryKey: ["sessions", id],
    queryFn: () => sessionsApi.getById(id),
    enabled: !!id,
  });

export const useSessionsByStudent = (studentId: number) =>
  useQuery({
    queryKey: ["sessions", "student", studentId],
    queryFn: () => sessionsApi.getByStudent(studentId),
    enabled: !!studentId,
  });

export const useSessionsByMentor = (mentorId: number) =>
  useQuery({
    queryKey: ["sessions", "mentor", mentorId],
    queryFn: () => sessionsApi.getByMentor(mentorId),
    enabled: !!mentorId,
  });

export const useCreateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessionDTO) => sessionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session booked!");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useBookSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookSessionDTO) => sessionsApi.book(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session booked successfully!");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useUpdateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<UpdateSessionDTO>;
    }) => sessionsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session updated");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

export const useDeleteSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sessionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session deleted");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};
