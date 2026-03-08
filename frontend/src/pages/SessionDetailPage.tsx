import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useSession,
  useUpdateSessionResources,
  useStartSession,
  useCompleteSession,
  useCancelSession,
} from "@/hooks/use-queries";
import { useUser } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { getRoles } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageSpinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Image,
  KeyRound,
  Link2,
  Play,
  Star,
  User,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";
import type { SessionStatus } from "@/types";

/* ── colour mappings ─────────────────────────────── */
const statusColor: Record<SessionStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  STARTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELED: "bg-red-50 text-red-700 border-red-200",
};

const receiptStatusColor: Record<string, string> = {
  NONE: "bg-zinc-100 text-zinc-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

/* ── reusable info-row ───────────────────────────── */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      <span className="mt-0.5 shrink-0 text-zinc-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
        <div className="text-sm font-medium text-zinc-900">{value}</div>
      </div>
    </div>
  );
}

/* ── resource-link row ───────────────────────────── */
function ResourceRow({
  icon,
  label,
  href,
  btnLabel,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  btnLabel: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
      <span className="flex items-center gap-2 text-sm text-zinc-600">
        {icon}
        {label}
      </span>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <ExternalLink className="mr-1 h-3 w-3" />
          {btnLabel}
        </Button>
      </a>
    </div>
  );
}

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const { data: session, isLoading, error } = useSession(id);
  const { user } = useUser();
  const roles = getRoles(
    user?.publicMetadata as Record<string, unknown> | undefined,
  );
  const isMentor = roles.includes("MENTOR");

  const resourcesMut = useUpdateSessionResources();
  const startMut = useStartSession();
  const completeMut = useCompleteSession();
  const cancelMut = useCancelSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [assessmentLink, setAssessmentLink] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [editingResources, setEditingResources] = useState(false);

  const handleSaveResources = () => {
    resourcesMut.mutate(
      {
        id,
        data: {
          meetingLink: meetingLink || undefined,
          meetingPassword: meetingPassword || undefined,
          recordingLink: recordingLink || undefined,
          resourceLink: resourceLink || undefined,
          assessmentLink: assessmentLink || undefined,
          sessionNotes: sessionNotes || undefined,
        },
      },
      { onSuccess: () => setEditingResources(false) },
    );
  };

  const startEditResources = () => {
    setMeetingLink(session?.meetingLink ?? "");
    setMeetingPassword(session?.meetingPassword ?? "");
    setRecordingLink(session?.recordingLink ?? "");
    setResourceLink(session?.resourceLink ?? "");
    setAssessmentLink(session?.assessmentLink ?? "");
    setSessionNotes(session?.sessionNotes ?? "");
    setEditingResources(true);
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  if (error) {
    const err = error as unknown as {
      response?: { status?: number };
      status?: number;
    };
    const status = err?.response?.status ?? err?.status;
    const isForbidden = status === 403;
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-500">
          {isForbidden
            ? "You do not have access to this session."
            : "Session not found."}
        </p>
        <Link
          to="/dashboard"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-500">Session not found.</p>
        <Link
          to="/dashboard"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const canAddResources =
    isMentor &&
    (session.sessionStatus === "SCHEDULED" ||
      session.sessionStatus === "STARTED" ||
      session.sessionStatus === "COMPLETED");
  const hasResources =
    session.recordingLink ||
    session.resourceLink ||
    session.assessmentLink ||
    session.sessionNotes;
  const canCancel =
    session.sessionStatus === "PENDING" ||
    session.sessionStatus === "SCHEDULED";

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* sticky page header */}
      <div className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={isMentor ? "/mentor/sessions" : "/dashboard"}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              {isMentor ? "My Sessions" : "Dashboard"}
            </Link>
            <Separator orientation="vertical" className="h-5 shrink-0" />
            <h1 className="text-base font-bold text-zinc-900 shrink-0">
              Session #{session.id}
            </h1>
            <Badge
              variant="secondary"
              className={`${statusColor[session.sessionStatus]} border text-xs font-semibold px-2.5 py-0.5 shrink-0`}
            >
              {session.sessionStatus}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isMentor && session.sessionStatus === "SCHEDULED" && (
              <Button
                size="sm"
                onClick={() =>
                  startMut.mutate(id, {
                    onSuccess: () => {
                      qc.refetchQueries({ queryKey: ["sessions", id] });
                    },
                  })
                }
                disabled={startMut.isPending}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {startMut.isPending ? "Starting" : "Start Session"}
              </Button>
            )}
            {isMentor && session.sessionStatus === "STARTED" && (
              <Button
                size="sm"
                onClick={() =>
                  completeMut.mutate(
                    { id },
                    {
                      onSuccess: () => {
                        qc.refetchQueries({ queryKey: ["sessions", id] });
                      },
                    },
                  )
                }
                disabled={completeMut.isPending}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {completeMut.isPending ? "Completing" : "Complete Session"}
              </Button>
            )}
            {!isMentor &&
              session.sessionStatus === "PENDING" &&
              (!session.receiptUrl || session.receiptStatus === "REJECTED") && (
                <Link to={`/payment/${session.id}`}>
                  <Button size="sm">Upload Payment</Button>
                </Link>
              )}
            {canCancel &&
              (cancelConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium hidden sm:block">
                    Cancel session?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelMut.isPending}
                    onClick={() =>
                      cancelMut.mutate(session.id, {
                        onSuccess: () => navigate("/dashboard"),
                      })
                    }
                  >
                    {cancelMut.isPending ? "" : "Yes, cancel"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelConfirm(false)}
                  >
                    Keep
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setCancelConfirm(true)}
                >
                  Cancel Session
                </Button>
              ))}
          </div>
        </div>
      </div>

      {/* status banners */}
      {isMentor && session.sessionStatus === "SCHEDULED" && (
        <div className="bg-blue-600 text-white px-6 py-2.5 flex items-center gap-3">
          <CalendarCheck className="h-4 w-4 shrink-0" />
          <span className="text-sm">
            Session is scheduled click <strong>Start Session</strong> once the
            student joins.
          </span>
        </div>
      )}
      {isMentor && session.sessionStatus === "STARTED" && (
        <div className="bg-indigo-600 text-white px-6 py-2.5 flex items-center gap-3">
          <Play className="h-4 w-4 shrink-0" />
          <span className="text-sm">
            Session is in progress click <strong>Complete Session</strong> when
            done.
          </span>
        </div>
      )}

      {/* 3-column grid */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT  session overview */}
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div
                className={`px-5 py-3 border-b ${statusColor[session.sessionStatus]}`}
              >
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Session Overview
                </p>
              </div>
              <CardContent className="p-5">
                <InfoRow
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Subject"
                  value={
                    <span className="text-base font-bold leading-snug">
                      {session.subjectName}
                    </span>
                  }
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Mentor"
                  value={session.mentorName}
                />
                {session.sessionType === "INDIVIDUAL" ? (
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="Student"
                    value={session.studentName ?? ""}
                  />
                ) : (
                  <InfoRow
                    icon={<Users className="h-4 w-4" />}
                    label="Participants"
                    value={
                      <span>
                        {session.currentParticipants}/{session.maxParticipants}
                        {session.studentNames.length > 0 && (
                          <span className="text-xs text-zinc-400 font-normal ml-1.5">
                            ({session.studentNames.join(", ")})
                          </span>
                        )}
                      </span>
                    }
                  />
                )}
                <InfoRow
                  icon={<CalendarCheck className="h-4 w-4" />}
                  label="Date & Time"
                  value={new Date(session.sessionAt).toLocaleString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Duration"
                  value={`${session.durationMinutes} minutes`}
                />
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Session Type"
                  value={
                    <Badge variant="outline" className="font-normal text-xs">
                      {session.sessionType === "INDIVIDUAL"
                        ? "1-on-1"
                        : "Group"}
                    </Badge>
                  }
                />
              </CardContent>
            </Card>

            {session.studentReview && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    Student Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= (session.studentRating ?? 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-zinc-200 text-zinc-200"
                        }`}
                      />
                    ))}
                    <span className="ml-1.5 text-sm font-bold text-zinc-700">
                      {session.studentRating}/5
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {session.studentReview}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* CENTER  payment + meeting */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  Payment Receipt
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={`${receiptStatusColor[session.receiptStatus] ?? "bg-zinc-100 text-zinc-600"} text-xs font-semibold`}
                >
                  {session.receiptStatus}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {session.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-sm text-red-700">
                    <strong>Rejection reason:</strong> {session.rejectionReason}
                  </div>
                )}
                {session.receiptUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Image className="h-3.5 w-3.5" /> Receipt
                      </span>
                      <a
                        href={session.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View full size
                      </a>
                    </div>
                    {session.receiptUrl.toLowerCase().endsWith(".pdf") ? (
                      <iframe
                        src={session.receiptUrl}
                        title="Payment receipt"
                        className="w-full h-72 rounded-lg border border-zinc-200"
                      />
                    ) : (
                      <img
                        src={session.receiptUrl}
                        alt="Payment receipt"
                        className="w-full rounded-lg border border-zinc-200 object-contain max-h-72"
                        onError={(e) => {
                          const t = e.currentTarget;
                          t.style.display = "none";
                          const m = document.createElement("p");
                          m.className = "text-sm text-zinc-400 italic";
                          m.textContent = "Image could not be loaded.";
                          t.parentNode?.appendChild(m);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-zinc-200 bg-zinc-50">
                    <Image className="h-8 w-8 text-zinc-300 mb-2" />
                    <p className="text-sm text-zinc-400">
                      No receipt uploaded yet
                    </p>
                    {!isMentor && session.sessionStatus === "PENDING" && (
                      <Link to={`/payment/${session.id}`} className="mt-3">
                        <Button size="sm" variant="outline">
                          Upload Receipt
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {session.meetingLink || session.meetingPassword ? (
              <Card className="border-blue-100 bg-blue-50/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Video className="h-4 w-4" /> Meeting Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {session.meetingLink && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-blue-700 truncate min-w-0 flex items-center gap-1.5">
                        <Link2 className="h-3 w-3 shrink-0" />
                        {session.meetingLink}
                      </span>
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-8 text-xs"
                        >
                          <ExternalLink className="mr-1.5 h-3 w-3" />
                          Join Meeting
                        </Button>
                      </a>
                    </div>
                  )}
                  {session.meetingPassword && (
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-blue-100 px-3 py-2">
                      <KeyRound className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span className="text-xs text-blue-500 mr-2">
                        Password
                      </span>
                      <span className="text-sm font-mono font-bold text-blue-900">
                        {session.meetingPassword}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : !isMentor && session.sessionStatus === "SCHEDULED" ? (
              <Card className="border-zinc-100">
                <CardContent className="p-5 flex items-center gap-3 text-zinc-400">
                  <Video className="h-5 w-5 shrink-0" />
                  <p className="text-sm">
                    Meeting link will appear here once confirmed by your mentor.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* RIGHT  resources + nav */}
          <div className="space-y-5">
            {(hasResources || canAddResources) && (
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-zinc-400" /> Session
                    Resources
                  </CardTitle>
                  {canAddResources && !editingResources && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={startEditResources}
                    >
                      {hasResources || session.meetingLink
                        ? "Edit"
                        : "Add Info"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {editingResources ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        Meeting
                      </p>
                      <div className="space-y-1">
                        <Label className="text-xs">Meeting Link</Label>
                        <Input
                          placeholder="https://zoom.us/j/"
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Meeting Password</Label>
                        <Input
                          placeholder="optional"
                          value={meetingPassword}
                          onChange={(e) => setMeetingPassword(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      {(session.sessionStatus === "STARTED" ||
                        session.sessionStatus === "COMPLETED") && (
                        <>
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide pt-1">
                            Post-Session
                          </p>
                          <div className="space-y-1">
                            <Label className="text-xs">Recording Link</Label>
                            <Input
                              placeholder="YouTube or Drive link"
                              value={recordingLink}
                              onChange={(e) => setRecordingLink(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Resource / Slides</Label>
                            <Input
                              placeholder="Slides, notes, doc URL"
                              value={resourceLink}
                              onChange={(e) => setResourceLink(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Assessment / Quiz</Label>
                            <Input
                              placeholder="Google Form, quiz URL"
                              value={assessmentLink}
                              onChange={(e) =>
                                setAssessmentLink(e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Mentor Notes</Label>
                            <Textarea
                              rows={3}
                              placeholder="Key takeaways, next steps"
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={handleSaveResources}
                          disabled={resourcesMut.isPending}
                        >
                          {resourcesMut.isPending ? "Saving" : "Save Changes"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingResources(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : hasResources ? (
                    <div>
                      {session.recordingLink && (
                        <ResourceRow
                          icon={<Video className="h-3.5 w-3.5 text-zinc-400" />}
                          label="Recording"
                          href={session.recordingLink}
                          btnLabel="Watch"
                        />
                      )}
                      {session.resourceLink && (
                        <ResourceRow
                          icon={
                            <FileText className="h-3.5 w-3.5 text-zinc-400" />
                          }
                          label="Resources"
                          href={session.resourceLink}
                          btnLabel="Open"
                        />
                      )}
                      {session.assessmentLink && (
                        <ResourceRow
                          icon={
                            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                          }
                          label="Assessment"
                          href={session.assessmentLink}
                          btnLabel="Take"
                        />
                      )}
                      {session.sessionNotes && (
                        <div className="mt-3 bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                          <p className="text-xs font-semibold text-zinc-500 mb-1.5">
                            Mentor Notes
                          </p>
                          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                            {session.sessionNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-7 rounded-lg border border-dashed border-zinc-200">
                      <BookOpen className="h-7 w-7 text-zinc-300 mb-2" />
                      <p className="text-xs text-zinc-400 text-center">
                        {canAddResources
                          ? "No resources added yet."
                          : "Resources will appear here after the session."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                  Quick Navigation
                </p>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-sm text-zinc-200 hover:text-white py-1.5 px-2 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-zinc-500" /> Dashboard
                </Link>
                {isMentor && (
                  <Link
                    to="/mentor/sessions"
                    className="flex items-center gap-2 text-sm text-zinc-200 hover:text-white py-1.5 px-2 rounded-md hover:bg-zinc-800 transition-colors"
                  >
                    <CalendarCheck className="h-3.5 w-3.5 text-zinc-500" /> My
                    Sessions
                  </Link>
                )}
                {!isMentor && session.meetingLink && (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 py-1.5 px-2 rounded-md hover:bg-zinc-800 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Join Meeting
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
