import { useUser } from "@clerk/clerk-react";
import { useCurrentMentor, useSessionsByMentor } from "@/hooks/use-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  Inbox,
  Play,
  Plus,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { SessionDTO } from "@/types";
import {
  sessionStatusColor,
  sessionStatusLabel,
  sessionTypeColor,
  getMentorActionQueue,
  formatSessionDateTime,
} from "@/lib/session-utils";

export default function MentorDashboardPage() {
  const { user } = useUser();
  const { mentor, isLoading: mentorLoading } = useCurrentMentor();

  const { data: sessions = [], isLoading: sessionsLoading } =
    useSessionsByMentor(mentor?.id ?? 0);

  const loading = mentorLoading || sessionsLoading;

  // Derived stats
  const pendingCount = sessions.filter(
    (s) => s.sessionStatus === "PENDING",
  ).length;
  const scheduledCount = sessions.filter(
    (s) => s.sessionStatus === "SCHEDULED",
  ).length;
  const completedCount = sessions.filter(
    (s) => s.sessionStatus === "COMPLETED",
  ).length;
  const avgRating = mentor?.averageRating
    ? mentor.averageRating.toFixed(1)
    : "—";

  const actionQueue = getMentorActionQueue(sessions);
  const hasActions =
    actionQueue.readyToApprove.length > 0 ||
    actionQueue.readyToStart.length > 0 ||
    actionQueue.inProgress.length > 0;

  const recentSessions = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.sessionAt).getTime() - new Date(a.sessionAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Welcome back, {user?.firstName ?? "Mentor"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {mentor?.profession
            ? `${mentor.profession} at ${mentor.company}`
            : "Manage your teaching operations."}
        </p>
      </div>

      {/* ── Key Metrics ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Approvals",
            value: pendingCount,
            icon: AlertCircle,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Scheduled",
            value: scheduledCount,
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
            label: "Average Rating",
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

      {/* ── Requires Action Queue ─────────────────────────────── */}
      {hasActions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Requires Your Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionQueue.inProgress.map((s) => (
              <ActionItem
                key={`progress-${s.id}`}
                session={s}
                accent="border-l-indigo-500 bg-indigo-50/50"
                icon={<Play className="h-4 w-4 text-indigo-600" />}
                label="In progress — ready to complete"
                cta={
                  <Link to={`/mentor/inbox`}>
                    <Button size="sm">Complete Session</Button>
                  </Link>
                }
              />
            ))}

            {actionQueue.readyToApprove.map((s) => (
              <ActionItem
                key={`approve-${s.id}`}
                session={s}
                accent="border-l-amber-500 bg-amber-50/50"
                icon={<Inbox className="h-4 w-4 text-amber-600" />}
                label="Receipt submitted — pending your approval"
                cta={
                  <Link to={`/mentor/inbox`}>
                    <Button size="sm" variant="outline">
                      Review & Approve
                    </Button>
                  </Link>
                }
              />
            ))}

            {actionQueue.readyToStart.map((s) => (
              <ActionItem
                key={`start-${s.id}`}
                session={s}
                accent="border-l-blue-500 bg-blue-50/50"
                icon={<Clock className="h-4 w-4 text-blue-600" />}
                label="Scheduled — ready to start"
                cta={
                  <div className="flex gap-2">
                    {s.meetingLink && (
                      <a
                        href={s.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <ExternalLink className="mr-1 h-3 w-3" /> Open Meeting
                        </Button>
                      </a>
                    )}
                    <Link to={`/mentor/inbox`}>
                      <Button size="sm">Start Session</Button>
                    </Link>
                  </div>
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/mentor/create-session">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Create Session
          </Button>
        </Link>
        <Link to="/mentor/subjects">
          <Button variant="outline">
            <BookOpen className="mr-1.5 h-4 w-4" /> Manage Subjects
          </Button>
        </Link>
        <Link to="/mentor/inbox">
          <Button variant="outline">
            <Inbox className="mr-1.5 h-4 w-4" /> Booking Inbox
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0">
                {pendingCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* ── Recent Sessions ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Sessions</CardTitle>
          <Link to="/mentor/sessions">
            <Button variant="ghost" size="sm" className="text-zinc-500">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3 hover:border-zinc-300 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-zinc-900">
                        {s.subjectName}
                      </p>
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
                    {s.studentName && (
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <span className="font-medium">{s.studentName}</span>
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatSessionDateTime(s.sessionAt)} &middot;{" "}
                      {s.durationMinutes}min
                    </p>
                  </div>
                  <Link to={`/sessions/${s.id}`}>
                    <Button variant="ghost" size="sm" className="text-zinc-500">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarCheck className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-700">
                No sessions yet
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Create your first subject to start accepting bookings.
              </p>
              <Link to="/mentor/subjects" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  Create Subject <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Action Queue Item ─────────────────────────────────────────────── */

function ActionItem({
  session: s,
  accent,
  icon,
  label,
  cta,
}: {
  session: SessionDTO;
  accent: string;
  icon: React.ReactNode;
  label: string;
  cta: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border-l-4 p-4 ${accent}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900">{s.subjectName}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          <p className="text-xs text-zinc-400">
            {formatSessionDateTime(s.sessionAt)} &middot; {s.durationMinutes}min
          </p>
        </div>
      </div>
      <div className="shrink-0">{cta}</div>
    </div>
  );
}
