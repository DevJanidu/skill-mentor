import {
  useCurrentMentor,
  useSessionsByMentor,
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
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image,
  Play,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { SessionDTO, SessionStatus } from "@/types";

const statusColor: Record<SessionStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  STARTED: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELED: "bg-red-50 text-red-700",
};

const receiptStatusColor: Record<string, string> = {
  NONE: "bg-zinc-100 text-zinc-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default function MentorInboxPage() {
  const { mentor } = useCurrentMentor();
  const { data: sessions, isLoading } = useSessionsByMentor(mentor?.id ?? 0);

  const approveMut = useApproveSession();
  const rejectMut = useRejectSession();
  const startMut = useStartSession();
  const completeMut = useCompleteSession();

  const PAGE_SIZE = 10;
  const [tab, setTab] = useState("PENDING");
  const [page, setPage] = useState(1);

  // Approve dialog state
  const [approveSession, setApproveSession] = useState<SessionDTO | null>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");

  // Reject dialog state
  const [rejectSession, setRejectSession] = useState<SessionDTO | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Receipt preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleApprove = () => {
    if (!approveSession || !meetingLink) return;
    approveMut.mutate(
      {
        id: approveSession.id,
        data: {
          meetingLink,
          meetingPassword: meetingPassword || undefined,
        },
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
      {
        id: rejectSession.id,
        data: { reason: rejectReason },
      },
      {
        onSuccess: () => {
          setRejectSession(null);
          setRejectReason("");
        },
      },
    );
  };

  const filtered = (sessions ?? []).filter(
    (s) => tab === "ALL" || s.sessionStatus === tab,
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount = (sessions ?? []).filter(
    (s) => s.sessionStatus === "PENDING",
  ).length;
  const scheduledCount = (sessions ?? []).filter(
    (s) => s.sessionStatus === "SCHEDULED",
  ).length;

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Booking Inbox</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review student bookings, approve payments, and manage sessions.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 text-amber-600 bg-amber-50">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">
                  {pendingCount}
                </p>
                <p className="text-xs text-zinc-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 text-blue-600 bg-blue-50">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">
                  {scheduledCount}
                </p>
                <p className="text-xs text-zinc-500">Scheduled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 text-green-600 bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">
                  {
                    (sessions ?? []).filter(
                      (s) => s.sessionStatus === "COMPLETED",
                    ).length
                  }
                </p>
                <p className="text-xs text-zinc-500">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg p-2 text-zinc-600 bg-zinc-100">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">
                  {(sessions ?? []).length}
                </p>
                <p className="text-xs text-zinc-500">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
        >
          <div className="overflow-x-auto pb-0.5">
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">
                Pending {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
              <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
              <TabsTrigger value="STARTED">In Progress</TabsTrigger>
              <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
              <TabsTrigger value="CANCELED">Canceled</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Sessions ({filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="h-6 w-6 text-zinc-400" />
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="space-y-3">
                    {paginated.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-zinc-900">
                                {s.subjectName}
                              </p>
                              <Badge
                                variant="secondary"
                                className={statusColor[s.sessionStatus]}
                              >
                                {s.sessionStatus}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={
                                  receiptStatusColor[s.receiptStatus] ??
                                  "bg-zinc-100 text-zinc-600"
                                }
                              >
                                Receipt: {s.receiptStatus}
                              </Badge>
                              <Badge variant="outline">{s.sessionType}</Badge>
                            </div>
                            {s.sessionType === "INDIVIDUAL" &&
                              s.studentName && (
                                <p className="text-sm text-zinc-600 font-medium">
                                  {s.studentName}
                                </p>
                              )}
                            {s.sessionType === "GROUP" && (
                              <p className="text-sm text-zinc-600 font-medium">
                                {s.currentParticipants}/{s.maxParticipants}{" "}
                                participants
                                {s.studentNames.length > 0 && (
                                  <span className="font-normal text-zinc-400 ml-1 text-xs">
                                    ({s.studentNames.join(", ")})
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="text-sm text-zinc-500">
                              {s.durationMinutes}min ·{" "}
                              {new Date(s.sessionAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {/* View receipt */}
                            {s.receiptUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewUrl(s.receiptUrl)}
                              >
                                <Image className="mr-1 h-3 w-3" /> View Receipt
                              </Button>
                            )}

                            {/* Approve: Only when receipt is SUBMITTED and session is PENDING */}
                            {s.receiptStatus === "SUBMITTED" &&
                              s.sessionStatus === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setApproveSession(s);
                                      setMeetingLink(s.meetingLink ?? "");
                                      setMeetingPassword(
                                        s.meetingPassword ?? "",
                                      );
                                    }}
                                  >
                                    <ThumbsUp className="mr-1 h-3 w-3" />{" "}
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setRejectSession(s)}
                                  >
                                    <ThumbsDown className="mr-1 h-3 w-3" />{" "}
                                    Reject
                                  </Button>
                                </>
                              )}

                            {/* Start session */}
                            {s.sessionStatus === "SCHEDULED" && (
                              <Button
                                size="sm"
                                onClick={() => startMut.mutate(s.id)}
                                disabled={startMut.isPending}
                              >
                                <Play className="mr-1 h-3 w-3" /> Start
                              </Button>
                            )}

                            {/* Complete session */}
                            {s.sessionStatus === "STARTED" && (
                              <Button
                                size="sm"
                                onClick={() => completeMut.mutate({ id: s.id })}
                                disabled={completeMut.isPending}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />{" "}
                                Complete
                              </Button>
                            )}

                            {/* Meeting link */}
                            {s.meetingLink && (
                              <a
                                href={s.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="mr-1 h-3 w-3" />{" "}
                                  Meeting
                                </Button>
                              </a>
                            )}

                            {/* Detail link */}
                            <Link to={`/sessions/${s.id}`}>
                              <Button variant="ghost" size="sm">
                                Details →
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Rejection reason shown if rejected */}
                        {s.rejectionReason && (
                          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                            <XCircle className="inline h-3 w-3 mr-1" />
                            Rejected: {s.rejectionReason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-8">
                    No sessions found.
                  </p>
                )}

                {/* Pagination controls */}
                {filtered.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <p className="text-xs text-zinc-500">
                      Showing{" "}
                      {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                      {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                      {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-zinc-600 font-medium">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve dialog */}
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
            <DialogTitle>Approve Session #{approveSession?.id}</DialogTitle>
            <DialogDescription>
              Provide a meeting link so the student can join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Meeting URL *</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting Password (optional)</Label>
              <Input
                placeholder="password123"
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
              {approveMut.isPending ? "Approving…" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
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
            <DialogTitle>Reject Session #{rejectSession?.id}</DialogTitle>
            <DialogDescription>
              Explain why the payment receipt is being rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason *</Label>
            <Textarea
              rows={3}
              placeholder="e.g. Payment amount doesn't match, receipt is unclear…"
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
              {rejectMut.isPending ? "Rejecting…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt preview dialog */}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
