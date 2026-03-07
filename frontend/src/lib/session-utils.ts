import type { SessionDTO, SessionStatus, ReceiptStatus } from "@/types";

/* ── Status badge colors ─────────────────────────────────────────────── */

export const sessionStatusColor: Record<SessionStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  STARTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELED: "bg-red-50 text-red-700 border-red-200",
};

export const receiptStatusColor: Record<ReceiptStatus, string> = {
  NONE: "bg-zinc-100 text-zinc-500",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export const sessionTypeColor = {
  INDIVIDUAL: "bg-zinc-100 text-zinc-700",
  GROUP: "bg-violet-50 text-violet-700",
};

/* ── Session status labels (human-readable) ───────────────────────────── */

export const sessionStatusLabel: Record<SessionStatus, string> = {
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  STARTED: "In Progress",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

export const receiptStatusLabel: Record<ReceiptStatus, string> = {
  NONE: "No Receipt",
  SUBMITTED: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/* ── Session helpers ──────────────────────────────────────────────────── */

export function getUpcomingSessions(sessions: SessionDTO[]): SessionDTO[] {
  return sessions
    .filter(
      (s) => s.sessionStatus === "SCHEDULED" || s.sessionStatus === "PENDING",
    )
    .sort(
      (a, b) =>
        new Date(a.sessionAt).getTime() - new Date(b.sessionAt).getTime(),
    );
}

export function getActionRequiredSessions(sessions: SessionDTO[]): {
  needsReceipt: SessionDTO[];
  receiptRejected: SessionDTO[];
  needsReview: SessionDTO[];
  startingSoon: SessionDTO[];
} {
  const now = Date.now();
  const fifteenMin = 15 * 60 * 1000;

  return {
    needsReceipt: sessions.filter(
      (s) =>
        s.sessionStatus === "PENDING" &&
        (!s.receiptUrl || s.receiptStatus === "NONE"),
    ),
    receiptRejected: sessions.filter(
      (s) => s.sessionStatus === "PENDING" && s.receiptStatus === "REJECTED",
    ),
    needsReview: sessions.filter(
      (s) => s.sessionStatus === "COMPLETED" && !s.studentReview,
    ),
    startingSoon: sessions.filter(
      (s) =>
        s.sessionStatus === "SCHEDULED" &&
        s.meetingLink &&
        new Date(s.sessionAt).getTime() - now < fifteenMin &&
        new Date(s.sessionAt).getTime() - now > -fifteenMin * 4,
    ),
  };
}

export function getMentorActionQueue(sessions: SessionDTO[]): {
  readyToApprove: SessionDTO[];
  readyToStart: SessionDTO[];
  inProgress: SessionDTO[];
  waitingForPayment: SessionDTO[];
} {
  const now = Date.now();
  const thirtyMin = 30 * 60 * 1000;

  return {
    readyToApprove: sessions.filter(
      (s) => s.sessionStatus === "PENDING" && s.receiptStatus === "SUBMITTED",
    ),
    readyToStart: sessions.filter(
      (s) =>
        s.sessionStatus === "SCHEDULED" &&
        new Date(s.sessionAt).getTime() - now < thirtyMin,
    ),
    inProgress: sessions.filter((s) => s.sessionStatus === "STARTED"),
    waitingForPayment: sessions.filter(
      (s) =>
        s.sessionStatus === "PENDING" &&
        (s.receiptStatus === "NONE" || !s.receiptStatus),
    ),
  };
}

export function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatSessionTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatSessionDateTime(dateStr: string): string {
  return `${formatSessionDate(dateStr)} at ${formatSessionTime(dateStr)}`;
}
