import { useUser } from "@clerk/clerk-react";
import {
  useCurrentStudent,
  useSessionsByStudent,
  useCancelSession,
  useUploadStudentProfileImage,
  useUploadStudentCoverImage,
} from "@/hooks/use-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Camera,
  CheckCircle,
  Clock,
  ExternalLink,
  Star,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
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
  const uploadProfileImageMut = useUploadStudentProfileImage();
  const uploadCoverImageMut = useUploadStudentCoverImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // resolved profile image: custom upload > Clerk imageUrl
  const avatarSrc = student?.profileImageUrl ?? user?.imageUrl ?? undefined;

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
        {/* ── Header / Profile Hero ───────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          {/* Cover banner */}
          <div className="relative h-48">
            {student?.coverImageUrl ? (
              <img
                src={student.coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-600" />
            )}
            {student && (
              <>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadCoverImageMut.isPending}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 text-white text-xs px-3 py-1.5 hover:bg-black/80 transition-colors disabled:opacity-60"
                  title="Change cover photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {uploadCoverImageMut.isPending ? "Uploading…" : "Edit cover"}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !student) return;
                    const MAX = 10 * 1024 * 1024;
                    if (file.size > MAX) {
                      toast.error("Cover image is too large. Max 10 MB.");
                      e.target.value = "";
                      return;
                    }
                    uploadCoverImageMut.mutate({ id: student.id, file });
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>

          {/* Avatar + name row */}
          <div className="px-6 pb-5">
            {/* Top row: avatar (overlaps cover) + edit button placeholder */}
            <div className="flex items-start justify-between">
              <div className="relative -mt-12 shrink-0">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-1 ring-zinc-200">
                  <AvatarImage src={avatarSrc} alt={user?.fullName ?? ""} />
                  <AvatarFallback className="text-2xl font-bold bg-zinc-200 text-zinc-700">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {student && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadProfileImageMut.isPending}
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-md hover:bg-zinc-700 transition-colors disabled:opacity-60"
                      title="Change profile photo"
                    >
                      {uploadProfileImageMut.isPending ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file || !student) return;
                        uploadProfileImageMut.mutate({ id: student.id, file });
                        e.target.value = "";
                      }}
                    />
                  </>
                )}
              </div>
            </div>
            {/* Name + greeting below avatar */}
            <div className="mt-3">
              <h1 className="text-xl font-bold text-zinc-900 leading-tight">
                {user?.fullName ?? user?.firstName ?? "there"}
              </h1>
              <p className="text-sm text-zinc-500">Student</p>
            </div>
          </div>
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
                    <Spinner className="h-4 w-4 text-zinc-400" />
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
                  <div className="flex justify-center py-8">
                    <Spinner className="h-6 w-6 text-zinc-400" />
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
