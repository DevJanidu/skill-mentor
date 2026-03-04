import { useUser } from "@clerk/clerk-react";
import {
  useCurrentUser,
  useMentors,
  useSessionsByMentor,
  useSessionsByStudent,
  useStudents,
  useUpdateSession,
} from "@/hooks/use-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  CalendarCheck,
  Clock,
  ExternalLink,
  GraduationCap,
  Link2,
  Star,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { SessionDTO, SessionStatus } from "@/types";
import ReviewDialog from "@/components/ReviewDialog";

const statusColor: Record<SessionStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  STARTED: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELED: "bg-red-50 text-red-700",
};

export default function DashboardPage() {
  const { user } = useUser();
  const { data: currentUser, isLoading: ul } = useCurrentUser();

  const isStudent = currentUser?.roles?.includes("STUDENT");
  const isMentor = currentUser?.roles?.includes("MENTOR");

  // Find student / mentor entity for the current user
  const { data: students } = useStudents();
  const { data: mentors } = useMentors();
  const student = students?.find((s) => s.clerkId === user?.id);
  const mentor = mentors?.find((m) => m.clerkId === user?.id);

  // Fetch sessions based on role
  const { data: studentSessions, isLoading: ssl } = useSessionsByStudent(
    student?.id ?? 0,
  );
  const { data: mentorSessions, isLoading: msl } = useSessionsByMentor(
    mentor?.id ?? 0,
  );

  const sessions: SessionDTO[] = isMentor
    ? (mentorSessions ?? [])
    : (studentSessions ?? []);

  const loading = ul || (isStudent && ssl) || (isMentor && msl);

  const [tab, setTab] = useState("ALL");
  const [reviewSession, setReviewSession] = useState<SessionDTO | null>(null);

  // Meeting-link dialog state (mentor only)
  const [meetingLinkSession, setMeetingLinkSession] =
    useState<SessionDTO | null>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const updateSession = useUpdateSession();

  const handleMeetingLinkSubmit = () => {
    if (!meetingLinkSession || !meetingLink) return;
    updateSession.mutate(
      {
        id: meetingLinkSession.id,
        data: {
          sessionStatus: meetingLinkSession.sessionStatus,
          sessionType: meetingLinkSession.sessionType,
          meetingLink,
        },
      },
      {
        onSuccess: () => {
          setMeetingLinkSession(null);
          setMeetingLink("");
        },
      },
    );
  };

  const filtered = sessions.filter(
    (s) => tab === "ALL" || s.sessionStatus === tab,
  );

  const completedCount = sessions.filter(
    (s) => s.sessionStatus === "COMPLETED",
  ).length;
  const upcomingCount = sessions.filter(
    (s) => s.sessionStatus === "SCHEDULED" || s.sessionStatus === "PENDING",
  ).length;

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Welcome back, {user?.firstName ?? "User"}!
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isMentor
              ? "Manage your sessions and connect with students."
              : "Manage your sessions and track your learning progress."}
          </p>
        </div>

        {/* Stats */}
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
              icon: Star,
              color: "text-green-600 bg-green-50",
            },
            {
              label: "Upcoming",
              value: upcomingCount,
              icon: Clock,
              color: "text-amber-600 bg-amber-50",
            },
            isMentor
              ? {
                  label: "Profession",
                  value: mentor?.profession ?? "—",
                  icon: Briefcase,
                  color: "text-purple-600 bg-purple-50",
                }
              : {
                  label: "Student Code",
                  value: student?.studentCode ?? "—",
                  icon: GraduationCap,
                  color: "text-purple-600 bg-purple-50",
                },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg p-2 ${s.color}`}>
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

        {/* Quick actions */}
        <div className="flex gap-3">
          {isStudent && (
            <Link to="/mentors">
              <Button variant="outline">Browse Mentors</Button>
            </Link>
          )}
        </div>

        {/* Sessions */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
            <TabsTrigger value="STARTED">Started</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="CANCELED">Canceled</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isMentor ? "Your Mentor Sessions" : "Your Sessions"} (
                  {filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="space-y-3">
                    {filtered.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-900">
                              {s.subjectName}
                            </p>
                            <Badge
                              variant="secondary"
                              className={statusColor[s.sessionStatus]}
                            >
                              {s.sessionStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-500">
                            {isMentor
                              ? `${s.sessionType} · ${s.durationMinutes}min`
                              : `Mentor: ${s.mentorName} · ${s.sessionType} · ${s.durationMinutes}min`}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {new Date(s.sessionAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {s.meetingLink && (
                            <a
                              href={s.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <ExternalLink className="mr-1 h-3 w-3" /> Join
                              </Button>
                            </a>
                          )}
                          {/* Mentor: add / edit meeting link */}
                          {isMentor &&
                            (s.sessionStatus === "PENDING" ||
                              s.sessionStatus === "SCHEDULED") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setMeetingLinkSession(s);
                                  setMeetingLink(s.meetingLink ?? "");
                                }}
                              >
                                <Link2 className="mr-1 h-3 w-3" />{" "}
                                {s.meetingLink ? "Edit Link" : "Add Link"}
                              </Button>
                            )}
                          {/* Student: upload receipt if no receipt yet */}
                          {isStudent &&
                            s.sessionStatus === "PENDING" &&
                            !s.receiptUrl && (
                              <Link to={`/payment/${s.id}`}>
                                <Button variant="outline" size="sm">
                                  <Upload className="mr-1 h-3 w-3" /> Upload
                                  Receipt
                                </Button>
                              </Link>
                            )}
                          {/* Student: write review */}
                          {isStudent &&
                            s.sessionStatus === "COMPLETED" &&
                            !s.studentReview && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReviewSession(s)}
                              >
                                <Star className="mr-1 h-3 w-3" /> Write Review
                              </Button>
                            )}
                          {s.studentReview && (
                            <div className="text-xs text-zinc-500 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {s.studentRating}/5
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-8">
                    No sessions found.
                  </p>
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

      {/* Meeting link dialog (mentor) */}
      <Dialog
        open={!!meetingLinkSession}
        onOpenChange={(o) => {
          if (!o) {
            setMeetingLinkSession(null);
            setMeetingLink("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {meetingLinkSession?.meetingLink ? "Edit" : "Add"} Meeting Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Meeting URL (Zoom, Google Meet, etc.)</Label>
            <Input
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMeetingLinkSession(null);
                setMeetingLink("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMeetingLinkSubmit}
              disabled={!meetingLink || updateSession.isPending}
            >
              {updateSession.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
