import { useUser } from "@clerk/clerk-react";
import {
  useCurrentStudent,
  useSessionsByStudent,
  useCancelSession,
} from "@/hooks/use-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  Star,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { SessionDTO } from "@/types";
import ReviewDialog from "@/components/ReviewDialog";
import {
  sessionStatusColor,
  receiptStatusColor,
  sessionTypeColor,
  sessionStatusLabel,
  receiptStatusLabel,
  getActionRequiredSessions,
  getUpcomingSessions,
  formatSessionDateTime,
} from "@/lib/session-utils";

export default function StudentDashboardPage() {
  const { user } = useUser();
  const { student, isLoading: studentLoading } = useCurrentStudent();

  const { data: sessions = [], isLoading: sessionsLoading } =
    useSessionsByStudent(student?.id ?? 0);

  const loading = studentLoading || sessionsLoading;

  const [tab, setTab] = useState("ALL");
  const [reviewSession, setReviewSession] = useState<SessionDTO | null>(null);
  const cancelMut = useCancelSession();

  // Derived data
  const completedCount = sessions.filter(
    (s) => s.sessionStatus === "COMPLETED",
  ).length;
  const upcomingCount = sessions.filter(
    (s) => s.sessionStatus === "SCHEDULED" || s.sessionStatus === "PENDING",
  ).length;
  const avgRating =
    sessions.filter((s) => s.studentRating).length > 0
      ? (
          sessions
            .filter((s) => s.studentRating)
            .reduce((sum, s) => sum + (s.studentRating ?? 0), 0) /
          sessions.filter((s) => s.studentRating).length
        ).toFixed(1)
      : "—";

  const actionItems = getActionRequiredSessions(sessions);
  const upcoming = getUpcomingSessions(sessions).slice(0, 3);
  const filtered = sessions.filter(
    (s) => tab === "ALL" || s.sessionStatus === tab,
  );

  const hasActions =
    actionItems.needsReceipt.length > 0 ||
    actionItems.receiptRejected.length > 0 ||
    actionItems.needsReview.length > 0 ||
    actionItems.startingSoon.length > 0;

  return (
    <div className="py-10 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Welcome back, {user?.firstName ?? "there"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track your sessions and manage your learning journey.
          </p>
        </div>

        {/* ── Action Required Banners ──────────────────────────── */}
        {hasActions && (
          <div className="space-y-3">
            {actionItems.startingSoon.map((s) => (
              <div
                key={`soon-${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-blue-500 bg-blue-50/50 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {s.subjectName} session starts soon
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatSessionDateTime(s.sessionAt)} &middot;{" "}
                      {s.durationMinutes}min
                    </p>
                  </div>
                </div>
                {s.meetingLink && (
                  <a
                    href={s.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Join
                      Meeting
                    </Button>
                  </a>
                )}
              </div>
            ))}

            {actionItems.receiptRejected.map((s) => (
              <div
                key={`rejected-${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-red-500 bg-red-50/50 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      Receipt rejected for {s.subjectName}
                    </p>
                    {s.rejectionReason && (
                      <p className="text-xs text-red-600 truncate">
                        {s.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                <Link to={`/payment/${s.id}`}>
                  <Button size="sm" variant="outline">
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Re-upload
                  </Button>
                </Link>
              </div>
            ))}

            {actionItems.needsReceipt.map((s) => (
              <div
                key={`receipt-${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-amber-500 bg-amber-50/50 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Upload className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      Upload payment receipt for {s.subjectName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Mentor: {s.mentorName}
                    </p>
                  </div>
                </div>
                <Link to={`/payment/${s.id}`}>
                  <Button size="sm">
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Receipt
                  </Button>
                </Link>
              </div>
            ))}

            {actionItems.needsReview.map((s) => (
              <div
                key={`review-${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Star className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      Rate your {s.subjectName} session
                    </p>
                    <p className="text-xs text-zinc-500">With {s.mentorName}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setReviewSession(s)}>
                  <Star className="mr-1.5 h-3.5 w-3.5" /> Write Review
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Sessions",
              value: sessions.length,
              icon: CalendarCheck,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Completed",
              value: completedCount,
              icon: CheckCircle,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Upcoming",
              value: upcomingCount,
              icon: Clock,
              color: "text-amber-600 bg-amber-50",
            },
            {
              label: "Avg Rating Given",
              value: avgRating,
              icon: Star,
              color: "text-purple-600 bg-purple-50",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-lg font-bold text-zinc-900">{s.value}</p>
                  )}
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Upcoming Sessions ──────────────────────────────────── */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Upcoming Sessions
              </h2>
            </div>
            <div className="grid gap-3">
              {upcoming.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  role="student"
                  onReview={() => setReviewSession(s)}
                  onCancel={() => cancelMut.mutate(s.id)}
                  cancelPending={cancelMut.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <div className="flex gap-3 flex-wrap">
          <Link to="/mentors">
            <Button variant="outline">Browse Mentors</Button>
          </Link>
          <Link to="/sessions/open">
            <Button variant="outline">
              <Users className="mr-1.5 h-4 w-4" /> Open Group Sessions
            </Button>
          </Link>
        </div>

        {/* ── All Sessions (tabbed) ──────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
            <TabsTrigger value="STARTED">In Progress</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="CANCELED">Canceled</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Your Sessions ({filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="space-y-3">
                    {filtered.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        role="student"
                        onReview={() => setReviewSession(s)}
                        onCancel={() => cancelMut.mutate(s.id)}
                        cancelPending={cancelMut.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarCheck className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-zinc-700">
                      No sessions found
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Book your first session with a mentor to start learning.
                    </p>
                    <Link to="/mentors" className="inline-block mt-4">
                      <Button variant="outline" size="sm">
                        Browse Mentors{" "}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review dialog */}
      <ReviewDialog
        session={reviewSession}
        onClose={() => setReviewSession(null)}
      />
    </div>
  );
}

/* ── Shared Session Card ─────────────────────────────────────────────── */

function SessionCard({
  session: s,
  role,
  onReview,
  onCancel,
  cancelPending,
}: {
  session: SessionDTO;
  role: "student" | "mentor";
  onReview?: () => void;
  onCancel?: () => void;
  cancelPending?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-white p-4 hover:border-zinc-300 transition-colors">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-zinc-900">{s.subjectName}</p>
          <Badge
            variant="secondary"
            className={`text-[11px] ${sessionStatusColor[s.sessionStatus]}`}
          >
            {sessionStatusLabel[s.sessionStatus]}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-[11px] ${sessionTypeColor[s.sessionType]}`}
          >
            {s.sessionType}
          </Badge>
        </div>
        <p className="text-sm text-zinc-500">
          {role === "student" ? `Mentor: ${s.mentorName} · ` : ""}
          {s.durationMinutes}min
          {s.sessionType === "GROUP" &&
            s.currentParticipants != null &&
            ` · ${s.currentParticipants}/${s.maxParticipants} joined`}
        </p>
        <p className="text-xs text-zinc-400">
          {formatSessionDateTime(s.sessionAt)}
        </p>

        {/* Receipt status */}
        {role === "student" &&
          s.receiptStatus &&
          s.receiptStatus !== "NONE" && (
            <Badge
              variant="secondary"
              className={`text-[11px] ${receiptStatusColor[s.receiptStatus]}`}
            >
              Receipt: {receiptStatusLabel[s.receiptStatus]}
            </Badge>
          )}

        {/* Rejection reason */}
        {s.rejectionReason && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <XCircle className="h-3 w-3 shrink-0" />
            {s.rejectionReason}
          </p>
        )}

        {/* Review display */}
        {s.studentReview && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {s.studentRating}/5
            <span className="text-zinc-400 truncate max-w-50">
              — "{s.studentReview}"
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap shrink-0">
        {/* Join meeting */}
        {s.meetingLink &&
          (s.sessionStatus === "SCHEDULED" ||
            s.sessionStatus === "STARTED") && (
            <a href={s.meetingLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                <ExternalLink className="mr-1 h-3 w-3" /> Join
              </Button>
            </a>
          )}

        {/* Upload receipt */}
        {role === "student" &&
          s.sessionStatus === "PENDING" &&
          (!s.receiptUrl || s.receiptStatus === "REJECTED") && (
            <Link to={`/payment/${s.id}`}>
              <Button variant="outline" size="sm">
                <Upload className="mr-1 h-3 w-3" />{" "}
                {s.receiptStatus === "REJECTED"
                  ? "Re-upload"
                  : "Upload Receipt"}
              </Button>
            </Link>
          )}

        {/* Cancel */}
        {role === "student" && s.sessionStatus === "PENDING" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onCancel}
            disabled={cancelPending}
          >
            Cancel
          </Button>
        )}

        {/* Write review */}
        {role === "student" &&
          s.sessionStatus === "COMPLETED" &&
          !s.studentReview && (
            <Button variant="outline" size="sm" onClick={onReview}>
              <Star className="mr-1 h-3 w-3" /> Write Review
            </Button>
          )}

        {/* View details */}
        <Link to={`/sessions/${s.id}`}>
          <Button variant="ghost" size="sm" className="text-zinc-500">
            Details <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
