import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useCurrentMentor,
  useSessionsByMentor,
  useSubjects,
  useApproveSession,
  useRejectSession,
  useStartSession,
  useCompleteSession,
} from "@/hooks/use-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  Filter,
  Image,
  Play,
  ThumbsDown,
  ThumbsUp,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type {
  SessionDTO,
  SessionStatus,
  SessionType,
  ReceiptStatus,
} from "@/types";
import {
  sessionStatusColor,
  sessionStatusLabel,
  receiptStatusColor,
  receiptStatusLabel,
  sessionTypeColor,
  formatSessionDateTime,
} from "@/lib/session-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Filter types
// ─────────────────────────────────────────────────────────────────────────────
type StatusFilter = SessionStatus | "ALL";
type TypeFilter = SessionType | "ALL";
type ReceiptFilter = ReceiptStatus | "ALL";

const RECEIPT_OPTIONS: { value: ReceiptFilter; label: string }[] = [
  { value: "ALL", label: "All Payment" },
  { value: "NONE", label: "No Receipt" },
  { value: "SUBMITTED", label: "Receipt Submitted" },
  { value: "APPROVED", label: "Payment Verified" },
  { value: "REJECTED", label: "Payment Rejected" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function MentorSessionsPage() {
  const { mentor, isLoading: mentorLoading } = useCurrentMentor();
  const { data: sessions = [], isLoading: sessionsLoading } =
    useSessionsByMentor(mentor?.id ?? 0);
  const { data: allSubjects } = useSubjects();

  const approveMut = useApproveSession();
  const rejectMut = useRejectSession();
  const startMut = useStartSession();
  const completeMut = useCompleteSession();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [approveSession, setApproveSession] = useState<SessionDTO | null>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");

  const [rejectSession, setRejectSession] = useState<SessionDTO | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loading = mentorLoading || sessionsLoading;

  // ── Mentor subjects for filter dropdown ───────────────────────────────────
  const mySubjects = useMemo(
    () => allSubjects?.filter((s) => s.mentorId === mentor?.id) ?? [],
    [allSubjects, mentor?.id],
  );

  // ── Filtered sessions ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchSubject =
        subjectFilter === "ALL" || s.subjectId === Number(subjectFilter);
      const matchStatus =
        statusFilter === "ALL" || s.sessionStatus === statusFilter;
      const matchType = typeFilter === "ALL" || s.sessionType === typeFilter;
      const matchReceipt =
        receiptFilter === "ALL" || s.receiptStatus === receiptFilter;
      const matchDate =
        !dateFilter ||
        new Date(s.sessionAt).toLocaleDateString("en-CA") === dateFilter;
      return (
        matchSubject && matchStatus && matchType && matchReceipt && matchDate
      );
    });
  }, [
    sessions,
    subjectFilter,
    statusFilter,
    typeFilter,
    receiptFilter,
    dateFilter,
  ]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      pending: sessions.filter((s) => s.sessionStatus === "PENDING").length,
      scheduled: sessions.filter((s) => s.sessionStatus === "SCHEDULED").length,
      completed: sessions.filter((s) => s.sessionStatus === "COMPLETED").length,
      needsReview: sessions.filter(
        (s) => s.sessionStatus === "PENDING" && s.receiptStatus === "SUBMITTED",
      ).length,
    }),
    [sessions],
  );

  const hasActiveFilters =
    subjectFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    receiptFilter !== "ALL" ||
    dateFilter !== "";

  const clearFilters = () => {
    setSubjectFilter("ALL");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setReceiptFilter("ALL");
    setDateFilter("");
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleApprove = () => {
    if (!approveSession || !meetingLink) return;
    approveMut.mutate(
      {
        id: approveSession.id,
        data: { meetingLink, meetingPassword: meetingPassword || undefined },
      },
      {
        onSuccess: () => {
          setApproveSession(null);
          setMeetingLink("");
          setMeetingPassword("");
        },
      },
    );
  };

  const handleReject = () => {
    if (!rejectSession || !rejectReason) return;
    rejectMut.mutate(
      { id: rejectSession.id, data: { reason: rejectReason } },
      {
        onSuccess: () => {
          setRejectSession(null);
          setRejectReason("");
        },
      },
    );
  };

  // ── Quick status chips ───────────────────────────────────────────────────
  const quickChips: { label: string; status: StatusFilter }[] = [
    { label: "All", status: "ALL" },
    {
      label: `Pending${stats.pending > 0 ? ` (${stats.pending})` : ""}`,
      status: "PENDING",
    },
    { label: "Scheduled", status: "SCHEDULED" },
    { label: "In Progress", status: "STARTED" },
    { label: "Completed", status: "COMPLETED" },
    { label: "Canceled", status: "CANCELED" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Sessions</h1>
        <p className="text-sm text-zinc-500 mt-1">
          View and manage all bookings and sessions across your subjects.
        </p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Review",
            value: stats.needsReview,
            icon: AlertCircle,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Scheduled",
            value: stats.scheduled,
            icon: CalendarCheck,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: CheckCircle2,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Total",
            value: sessions.length,
            icon: Users,
            color: "text-zinc-600 bg-zinc-100",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-10" />
                ) : (
                  <p className="text-lg font-bold text-zinc-900">{s.value}</p>
                )}
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter panel ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            Filters
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Subject</Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All subjects</SelectItem>
                  {mySubjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Payment Status</Label>
              <Select
                value={receiptFilter}
                onValueChange={(v) => setReceiptFilter(v as ReceiptFilter)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All payment" />
                </SelectTrigger>
                <SelectContent>
                  {RECEIPT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Session Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as TypeFilter)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="INDIVIDUAL">1-on-1</SelectItem>
                  <SelectItem value="GROUP">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Date</Label>
              <Input
                type="date"
                className="h-9"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Quick status chips */}
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <button
                key={chip.status}
                onClick={() => setStatusFilter(chip.status)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  statusFilter === chip.status
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Session list ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-zinc-700">
            {filtered.length} session{filtered.length !== 1 ? "s" : ""} found
            {hasActiveFilters && (
              <span className="ml-1 text-zinc-400">(filtered)</span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilter={hasActiveFilters}
            statusFilter={statusFilter}
            subjectFilter={subjectFilter}
            mySubjects={mySubjects}
            onClearFilters={clearFilters}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onViewReceipt={setPreviewUrl}
                onApprove={(sess) => {
                  setApproveSession(sess);
                  setMeetingLink(sess.meetingLink ?? "");
                  setMeetingPassword(sess.meetingPassword ?? "");
                }}
                onReject={setRejectSession}
                onStart={(id) => startMut.mutate(id)}
                onComplete={(id) => completeMut.mutate({ id })}
                startPending={startMut.isPending}
                completePending={completeMut.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Approve dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={!!approveSession}
        onOpenChange={(o) => {
          if (!o) {
            setApproveSession(null);
            setMeetingLink("");
            setMeetingPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment & Schedule Session</DialogTitle>
            <DialogDescription>
              The payment receipt has been submitted. Verify it and provide a
              meeting link to confirm this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {approveSession?.receiptUrl && (
              <div className="rounded-lg border overflow-hidden">
                <p className="text-xs text-zinc-500 px-3 py-2 border-b bg-zinc-50 flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5" /> Payment Receipt
                </p>
                <img
                  src={approveSession.receiptUrl}
                  alt="Payment receipt"
                  className="w-full max-h-48 object-contain p-2"
                />
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <Label>Meeting URL *</Label>
              <Input
                placeholder="https://meet.google.com/... or Zoom / Teams link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting Password (optional)</Label>
              <Input
                placeholder="Leave blank if not required"
                value={meetingPassword}
                onChange={(e) => setMeetingPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveSession(null);
                setMeetingLink("");
                setMeetingPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!meetingLink || approveMut.isPending}
            >
              {approveMut.isPending ? "Scheduling…" : "Verify & Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={!!rejectSession}
        onOpenChange={(o) => {
          if (!o) {
            setRejectSession(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Explain why the payment receipt is not acceptable. The student
              will be able to re-submit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason *</Label>
            <Textarea
              rows={3}
              placeholder="e.g. Payment amount doesn't match, receipt is unclear, wrong account…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectSession(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectMut.isPending}
            >
              {rejectMut.isPending ? "Rejecting…" : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Receipt preview ───────────────────────────────────────────────── */}
      <Dialog
        open={!!previewUrl}
        onOpenChange={(o) => {
          if (!o) setPreviewUrl(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Payment receipt"
              className="w-full rounded-lg border"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewUrl(null)}>
              Close
            </Button>
            <a
              href={previewUrl ?? "#"}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">Download</Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION CARD
// ─────────────────────────────────────────────────────────────────────────────
function SessionCard({
  session: s,
  onViewReceipt,
  onApprove,
  onReject,
  onStart,
  onComplete,
  startPending,
  completePending,
}: {
  session: SessionDTO;
  onViewReceipt: (url: string) => void;
  onApprove: (s: SessionDTO) => void;
  onReject: (s: SessionDTO) => void;
  onStart: (id: number) => void;
  onComplete: (id: number) => void;
  startPending: boolean;
  completePending: boolean;
}) {
  const canApprove =
    s.receiptStatus === "SUBMITTED" && s.sessionStatus === "PENDING";
  const canReject =
    s.receiptStatus === "SUBMITTED" && s.sessionStatus === "PENDING";
  const paymentMissing =
    s.sessionStatus === "PENDING" &&
    (s.receiptStatus === "NONE" || !s.receiptStatus);

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3 hover:border-zinc-300 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left — session info */}
        <div className="space-y-1.5 min-w-0">
          {/* Subject + status badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-900">{s.subjectName}</span>
            <Badge
              variant="secondary"
              className={`text-[11px] ${sessionStatusColor[s.sessionStatus]}`}
            >
              {sessionStatusLabel[s.sessionStatus]}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-[11px] ${receiptStatusColor[s.receiptStatus]}`}
            >
              {receiptStatusLabel[s.receiptStatus]}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-[11px] ${sessionTypeColor[s.sessionType]}`}
            >
              {s.sessionType === "INDIVIDUAL" ? "1-on-1" : "Group"}
            </Badge>
          </div>

          {/* Student info */}
          <div className="flex items-center gap-1.5 text-sm text-zinc-600">
            {s.sessionType === "INDIVIDUAL" ? (
              <>
                <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>{s.studentName ?? "No student assigned"}</span>
              </>
            ) : (
              <>
                <Users className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>
                  {s.currentParticipants}/{s.maxParticipants} participants
                  {s.studentNames.length > 0 && (
                    <span className="text-zinc-400 ml-1">
                      ({s.studentNames.slice(0, 2).join(", ")}
                      {s.studentNames.length > 2 &&
                        ` +${s.studentNames.length - 2} more`}
                      )
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Date + duration */}
          <p className="text-xs text-zinc-400">
            <CalendarCheck className="inline h-3 w-3 mr-1" />
            {formatSessionDateTime(s.sessionAt)} &middot; {s.durationMinutes}min
          </p>

          {/* Payment warning */}
          {paymentMissing && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Waiting for student to submit payment receipt
            </p>
          )}

          {/* Rejection reason */}
          {s.rejectionReason && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Rejected: {s.rejectionReason}
            </p>
          )}
        </div>

        {/* Right — action buttons */}
        <div className="flex gap-2 flex-wrap shrink-0">
          {/* View receipt */}
          {s.receiptUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewReceipt(s.receiptUrl!)}
            >
              <Image className="mr-1 h-3 w-3" /> Receipt
            </Button>
          )}

          {/* Verify & Schedule (approve) */}
          {canApprove && (
            <Button size="sm" onClick={() => onApprove(s)}>
              <ThumbsUp className="mr-1 h-3 w-3" /> Verify & Schedule
            </Button>
          )}

          {/* Reject payment */}
          {canReject && (
            <Button variant="destructive" size="sm" onClick={() => onReject(s)}>
              <ThumbsDown className="mr-1 h-3 w-3" /> Reject
            </Button>
          )}

          {/* Start */}
          {s.sessionStatus === "SCHEDULED" && (
            <Button
              size="sm"
              onClick={() => onStart(s.id)}
              disabled={startPending}
            >
              <Play className="mr-1 h-3 w-3" /> Start
            </Button>
          )}

          {/* Complete */}
          {s.sessionStatus === "STARTED" && (
            <Button
              size="sm"
              onClick={() => onComplete(s.id)}
              disabled={completePending}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
            </Button>
          )}

          {/* Meeting link */}
          {s.meetingLink && (
            <a href={s.meetingLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1 h-3 w-3" /> Meeting
              </Button>
            </a>
          )}

          {/* Detail */}
          <Link to={`/sessions/${s.id}`}>
            <Button variant="ghost" size="sm" className="text-zinc-500">
              Details →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({
  hasFilter,
  statusFilter,
  subjectFilter,
  mySubjects,
  onClearFilters,
}: {
  hasFilter: boolean;
  statusFilter: string;
  subjectFilter: string;
  mySubjects: { id: number; subjectName: string }[];
  onClearFilters: () => void;
}) {
  const subjectName =
    mySubjects.find((s) => String(s.id) === subjectFilter)?.subjectName ?? "";

  let message = "No sessions found.";
  let detail = "Sessions will appear here once students start booking.";

  if (hasFilter) {
    if (subjectFilter !== "ALL" && statusFilter !== "ALL") {
      message = `No ${statusFilter.toLowerCase()} sessions for ${subjectName}.`;
      detail =
        "Try adjusting your filters or clearing them to see all sessions.";
    } else if (subjectFilter !== "ALL") {
      message = `No sessions found for ${subjectName}.`;
      detail = "This subject hasn't received any bookings yet.";
    } else if (statusFilter === "PENDING") {
      message = "No pending bookings to review.";
      detail = "All clear — no pending sessions require your attention.";
    } else if (statusFilter === "SCHEDULED") {
      message = "No upcoming scheduled sessions.";
      detail = "Approve a pending booking to see it here.";
    } else {
      message = "No sessions match your filters.";
      detail = "Try adjusting or clearing your filters.";
    }
  }

  return (
    <Card>
      <CardContent className="py-16 text-center space-y-3">
        <CalendarCheck className="h-10 w-10 text-zinc-200 mx-auto" />
        <p className="font-medium text-zinc-700">{message}</p>
        <p className="text-sm text-zinc-400">{detail}</p>
        {hasFilter && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onClearFilters}
          >
            <X className="mr-1.5 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
