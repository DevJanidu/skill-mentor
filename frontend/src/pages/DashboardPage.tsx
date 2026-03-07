import { useUser } from "@clerk/clerk-react";
import {
  useCurrentUser,
  useMentors,
  useSessionsByMentor,
  useSessionsByStudent,
  useStudents,
  useCancelSession,
  useUpdateStudent,
} from "@/hooks/use-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings,
  Star,
  Upload,
  Users,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { SessionDTO, SessionStatus } from "@/types";
import ReviewDialog from "@/components/ReviewDialog";

const STATUS_COLOR: Record<SessionStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  STARTED: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELED: "bg-red-50 text-red-700",
};

const RECEIPT_COLOR: Record<string, string> = {
  NONE: "bg-zinc-100 text-zinc-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

const SESSION_PAGE_SIZE = 8;

const STUDENT_NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sessions", label: "My Sessions", icon: CalendarCheck },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type StudentSection = (typeof STUDENT_NAV)[number]["id"];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= value ? "fill-yellow-400 text-yellow-400" : "fill-zinc-200 text-zinc-200"}`}
        />
      ))}
    </span>
  );
}

function SessionRow({
  s,
  isStudent,
  onCancel,
  onReview,
}: {
  s: SessionDTO;
  isStudent: boolean;
  onCancel: (id: number) => void;
  onReview: (s: SessionDTO) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-white p-4 hover:border-zinc-200 transition-colors">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-zinc-900 text-sm">{s.subjectName}</p>
          <Badge
            variant="secondary"
            className={`${STATUS_COLOR[s.sessionStatus]} text-xs`}
          >
            {s.sessionStatus}
          </Badge>
          {s.receiptStatus && s.receiptStatus !== "NONE" && (
            <Badge
              variant="secondary"
              className={`${RECEIPT_COLOR[s.receiptStatus]} text-xs`}
            >
              Receipt: {s.receiptStatus}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {s.sessionType}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500">
          {isStudent ? `Mentor: ${s.mentorName}` : s.sessionType}{" "}
          {s.durationMinutes}min
        </p>
        <p className="text-xs text-zinc-400">
          {new Date(s.sessionAt).toLocaleString()}
        </p>
        {s.rejectionReason && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 flex items-center gap-1">
            <XCircle className="h-3 w-3 shrink-0" /> {s.rejectionReason}
          </p>
        )}
        {s.studentReview && (
          <div className="flex items-center gap-1.5">
            <Stars value={s.studentRating ?? 0} />
            <span className="text-xs text-zinc-400 italic line-clamp-1">
              {s.studentReview}
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-wrap shrink-0">
        {s.meetingLink && (
          <a href={s.meetingLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <ExternalLink className="h-3 w-3 mr-1" /> Join
            </Button>
          </a>
        )}
        {isStudent &&
          s.sessionStatus === "PENDING" &&
          (!s.receiptUrl || s.receiptStatus === "REJECTED") && (
            <Link to={`/payment/${s.id}`}>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Upload className="h-3 w-3 mr-1" />
                {s.receiptStatus === "REJECTED"
                  ? "Re-upload"
                  : "Upload Receipt"}
              </Button>
            </Link>
          )}
        {isStudent && s.sessionStatus === "PENDING" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-red-600 hover:text-red-700"
            onClick={() => onCancel(s.id)}
          >
            Cancel
          </Button>
        )}
        {isStudent && s.sessionStatus === "COMPLETED" && !s.studentReview && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onReview(s)}
          >
            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />{" "}
            Review
          </Button>
        )}
        <Link to={`/sessions/${s.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-zinc-500 hover:text-zinc-900"
          >
            Details
          </Button>
        </Link>
      </div>
    </div>
  );
}

function MentorDashboard({
  sessions,
  loading,
}: {
  sessions: SessionDTO[];
  loading: boolean;
}) {
  const { user } = useUser();
  const completed = sessions.filter(
    (s) => s.sessionStatus === "COMPLETED",
  ).length;
  const pending = sessions.filter((s) => s.sessionStatus === "PENDING").length;
  const scheduled = sessions.filter(
    (s) => s.sessionStatus === "SCHEDULED",
  ).length;

  return (
    <div className="py-10 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your sessions, subjects, and students.
          </p>
        </div>
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
              value: completed,
              icon: CheckCircle2,
              color: "text-green-600 bg-green-50",
            },
            {
              label: "Scheduled",
              value: scheduled,
              icon: Clock,
              color: "text-amber-600 bg-amber-50",
            },
            {
              label: "Pending",
              value: pending,
              icon: Clock,
              color: "text-purple-600 bg-purple-50",
            },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg p-2 ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-6 w-10" />
                  ) : (
                    <p className="text-lg font-bold text-zinc-900">
                      {item.value}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Booking Inbox",
              desc: "Review pending sessions and receipts",
              icon: Inbox,
              to: "/mentor/inbox",
              primary: true,
            },
            {
              label: "My Subjects",
              desc: "Manage your teaching subjects",
              icon: BookOpen,
              to: "/mentor/subjects",
              primary: false,
            },
            {
              label: "Create Session",
              desc: "Open a new group or individual session",
              icon: Plus,
              to: "/mentor/create-session",
              primary: false,
            },
          ].map((action) => (
            <Link key={action.label} to={action.to}>
              <Card className="hover:border-zinc-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div
                    className={`rounded-lg p-2.5 shrink-0 ${action.primary ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"}`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {pending > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">
                  {pending} session{pending !== 1 ? "s" : ""} waiting for your
                  approval
                </p>
                <p className="text-xs text-amber-600">
                  Review receipts and approve or reject.
                </p>
              </div>
              <Link to="/mentor/inbox">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Go to Inbox
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: currentUser, isLoading: ul } = useCurrentUser();
  const isStudent = currentUser?.roles?.includes("STUDENT");
  const isMentor = currentUser?.roles?.includes("MENTOR");

  const { data: students } = useStudents();
  const { data: mentors } = useMentors();
  const student = students?.find((s) => s.clerkId === user?.id) ?? null;

  const { data: studentSessions, isLoading: ssl } = useSessionsByStudent(
    student?.id ?? 0,
  );
  const { data: mentorSessions, isLoading: msl } = useSessionsByMentor(
    mentors?.find((m) => m.clerkId === user?.id)?.id ?? 0,
  );

  const sessions: SessionDTO[] = useMemo(
    () => (isMentor ? (mentorSessions ?? []) : (studentSessions ?? [])),
    [isMentor, mentorSessions, studentSessions],
  );
  const loading = ul || (isStudent ? ssl : msl);

  const cancelMut = useCancelSession();
  const updateStudentMut = useUpdateStudent();

  const [section, setSection] = useState<StudentSection>("overview");
  const [sessionTab, setSessionTab] = useState("ALL");
  const [sessionPage, setSessionPage] = useState(1);
  const [reviewSection, setReviewSection] = useState<"needs" | "submitted">(
    "needs",
  );
  const [reviewSession, setReviewSession] = useState<SessionDTO | null>(null);
  const [learningGoals, setLearningGoals] = useState(
    student?.learningGoals ?? "",
  );
  const [savingGoals, setSavingGoals] = useState(false);

  const completedCount = sessions.filter(
    (s) => s.sessionStatus === "COMPLETED",
  ).length;
  const upcomingCount = sessions.filter((s) =>
    ["SCHEDULED", "PENDING"].includes(s.sessionStatus),
  ).length;
  const pendingReviews = useMemo(
    () =>
      sessions.filter(
        (s) => s.sessionStatus === "COMPLETED" && !s.studentReview,
      ),
    [sessions],
  );
  const submittedReviews = useMemo(
    () => sessions.filter((s) => !!s.studentReview),
    [sessions],
  );
  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.sessionStatus === "SCHEDULED")
        .sort(
          (a, b) =>
            new Date(a.sessionAt).getTime() - new Date(b.sessionAt).getTime(),
        )
        .slice(0, 3),
    [sessions],
  );

  const filteredSessions = useMemo(
    () =>
      sessions.filter(
        (s) => sessionTab === "ALL" || s.sessionStatus === sessionTab,
      ),
    [sessions, sessionTab],
  );
  const totalSessionPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / SESSION_PAGE_SIZE),
  );
  const paginatedSessions = filteredSessions.slice(
    (sessionPage - 1) * SESSION_PAGE_SIZE,
    sessionPage * SESSION_PAGE_SIZE,
  );

  const handleTabChange = (t: string) => {
    setSessionTab(t);
    setSessionPage(1);
  };

  const handleSaveGoals = () => {
    if (!student) return;
    setSavingGoals(true);
    updateStudentMut.mutate(
      { id: student.id, data: { learningGoals } },
      { onSettled: () => setSavingGoals(false) },
    );
  };

  if (!ul && isMentor) {
    return <MentorDashboard sessions={mentorSessions ?? []} loading={msl} />;
  }

  const sessionTabCounts: Record<string, number> = {
    ALL: sessions.length,
    PENDING: sessions.filter((s) => s.sessionStatus === "PENDING").length,
    SCHEDULED: sessions.filter((s) => s.sessionStatus === "SCHEDULED").length,
    STARTED: sessions.filter((s) => s.sessionStatus === "STARTED").length,
    COMPLETED: completedCount,
    CANCELED: sessions.filter((s) => s.sessionStatus === "CANCELED").length,
  };

  const sidebarItem = (
    id: StudentSection,
    label: string,
    Icon: React.ElementType,
    badge?: number,
  ) => (
    <button
      key={id}
      onClick={() => setSection(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        section === id
          ? "bg-zinc-900 text-white font-semibold"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-semibold ${
            section === id
              ? "bg-white text-zinc-900"
              : "bg-amber-500 text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );

  const SESSION_TABS = [
    "ALL",
    "PENDING",
    "SCHEDULED",
    "STARTED",
    "COMPLETED",
    "CANCELED",
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Mobile tab bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b shadow-sm px-4 py-2">
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {STUDENT_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  section === id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === "reviews" && pendingReviews.length > 0 && (
                  <span
                    className={`ml-0.5 text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold ${
                      section === id
                        ? "bg-white text-zinc-900"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {pendingReviews.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-200 bg-white min-h-screen sticky top-0 h-screen shrink-0">
          <div className="p-5 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
                <AvatarFallback className="text-sm font-bold bg-zinc-200">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 text-sm truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-zinc-400">Student</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {sidebarItem("overview", "Overview", LayoutDashboard)}
            {sidebarItem(
              "sessions",
              "My Sessions",
              CalendarCheck,
              sessionTabCounts["PENDING"] + sessionTabCounts["SCHEDULED"],
            )}
            {sidebarItem(
              "reviews",
              "Reviews",
              MessageSquare,
              pendingReviews.length,
            )}
            {sidebarItem("settings", "Settings", Settings)}
          </nav>
          <div className="p-3 border-t border-zinc-100 space-y-0.5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide px-3 pb-1.5">
              Explore
            </p>
            <Link
              to="/subjects"
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
            >
              <BookOpen className="h-4 w-4" /> Subjects
            </Link>
            <Link
              to="/mentors"
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
            >
              <Users className="h-4 w-4" /> Mentors
            </Link>
            <Link
              to="/sessions/open"
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
            >
              <Globe className="h-4 w-4" /> Open Sessions
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-5 lg:p-8">
          {/* OVERVIEW */}
          {section === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  Welcome back, {user?.firstName ?? "there"}!
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Here's what's happening with your learning journey.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    icon: CheckCircle2,
                    color: "text-green-600 bg-green-50",
                  },
                  {
                    label: "Upcoming",
                    value: upcomingCount,
                    icon: Clock,
                    color: "text-amber-600 bg-amber-50",
                  },
                  {
                    label: "Need a Review",
                    value: pendingReviews.length,
                    icon: Star,
                    color: "text-purple-600 bg-purple-50",
                  },
                ].map((item) => (
                  <Card key={item.label} className="bg-white">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`rounded-lg p-2 shrink-0 ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        {loading ? (
                          <Skeleton className="h-6 w-10 mb-0.5" />
                        ) : (
                          <p className="text-xl font-bold text-zinc-900 leading-none">
                            {item.value}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {pendingReviews.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Star className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800 text-sm">
                        {pendingReviews.length} session
                        {pendingReviews.length !== 1 ? "s" : ""} waiting for
                        your review
                      </p>
                      <p className="text-xs text-amber-600">
                        Share your feedback to help other students.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0"
                      onClick={() => {
                        setSection("reviews");
                        setReviewSection("needs");
                      }}
                    >
                      Write Reviews
                    </Button>
                  </CardContent>
                </Card>
              )}
              <div>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Browse Mentors",
                      desc: "Find expert mentors",
                      icon: Users,
                      to: "/mentors",
                    },
                    {
                      label: "Explore Subjects",
                      desc: "Discover what to learn",
                      icon: BookOpen,
                      to: "/subjects",
                    },
                    {
                      label: "Open Group Sessions",
                      desc: "Join live sessions",
                      icon: Globe,
                      to: "/sessions/open",
                    },
                  ].map((action) => (
                    <Link key={action.label} to={action.to}>
                      <Card className="hover:border-zinc-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="rounded-lg bg-zinc-100 p-2 shrink-0">
                            <action.icon className="h-4 w-4 text-zinc-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 text-sm">
                              {action.label}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {action.desc}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
              {upcomingSessions.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Upcoming Sessions
                    </h2>
                    <button
                      onClick={() => setSection("sessions")}
                      className="text-xs text-zinc-400 hover:text-zinc-900"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {upcomingSessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-zinc-900 text-sm">
                            {s.subjectName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            with {s.mentorName}{" "}
                            {new Date(s.sessionAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${STATUS_COLOR[s.sessionStatus]} text-xs`}
                        >
                          {s.sessionStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !loading ? (
                <Card className="bg-white border-dashed">
                  <CardContent className="p-8 text-center">
                    <CalendarCheck className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="font-medium text-zinc-500">
                      No upcoming sessions
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Book a session with a mentor to get started.
                    </p>
                    <Link to="/mentors" className="mt-3 inline-block">
                      <Button
                        size="sm"
                        className="bg-zinc-900 hover:bg-zinc-700 text-white"
                      >
                        Browse Mentors
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}

          {/* MY SESSIONS */}
          {section === "sessions" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">My Sessions</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  All your booked sessions in one place.
                </p>
              </div>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex gap-1 min-w-max pb-1">
                  {SESSION_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        sessionTab === tab
                          ? "bg-zinc-900 text-white"
                          : "bg-white border text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {tab === "ALL"
                        ? "All"
                        : tab.charAt(0) + tab.slice(1).toLowerCase()}
                      {sessionTabCounts[tab] > 0 && (
                        <span
                          className={`ml-1.5 rounded-full text-xs px-1.5 py-0.5 ${
                            sessionTab === tab
                              ? "bg-white/20 text-white"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {sessionTabCounts[tab]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : paginatedSessions.length > 0 ? (
                <div className="space-y-2">
                  {paginatedSessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      s={s}
                      isStudent={!!isStudent}
                      onCancel={(id) => cancelMut.mutate(id)}
                      onReview={setReviewSession}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                  <CalendarCheck className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 font-medium">No sessions found</p>
                </div>
              )}
              {filteredSessions.length > SESSION_PAGE_SIZE && (
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-xs text-zinc-500">
                    {(sessionPage - 1) * SESSION_PAGE_SIZE + 1}
                    {Math.min(
                      sessionPage * SESSION_PAGE_SIZE,
                      filteredSessions.length,
                    )}{" "}
                    of {filteredSessions.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sessionPage === 1}
                      onClick={() => setSessionPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium text-zinc-600">
                      {sessionPage} / {totalSessionPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sessionPage >= totalSessionPages}
                      onClick={() => setSessionPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {section === "reviews" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Reviews</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Track and submit your session reviews.
                </p>
              </div>
              <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
                {(["needs", "submitted"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setReviewSection(t)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      reviewSection === t
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {t === "needs"
                      ? `Needs Review (${pendingReviews.length})`
                      : `Submitted (${submittedReviews.length})`}
                  </button>
                ))}
              </div>
              {reviewSection === "needs" ? (
                pendingReviews.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                    <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
                    <p className="font-medium text-zinc-700">All caught up!</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      You've reviewed all your completed sessions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReviews.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-white p-4"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-zinc-900 text-sm">
                            {s.subjectName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            with {s.mentorName}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {new Date(s.sessionAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setReviewSession(s)}
                          className="bg-zinc-900 hover:bg-zinc-700 text-white shrink-0"
                        >
                          <Star className="h-3 w-3 mr-1.5 fill-white" /> Write
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : submittedReviews.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                  <MessageSquare className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <p className="font-medium text-zinc-500">
                    No reviews submitted yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submittedReviews.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border bg-white p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900 text-sm">
                            {s.subjectName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            with {s.mentorName}{" "}
                            {new Date(s.sessionAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Stars value={s.studentRating ?? 0} />
                      </div>
                      {s.studentReview && (
                        <p className="text-sm text-zinc-600 italic bg-zinc-50 rounded-lg px-3 py-2">
                          "{s.studentReview}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Settings</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Manage your account and learning preferences.
                </p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName ?? ""}
                      />
                      <AvatarFallback className="text-xl font-bold bg-zinc-200">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {user?.fullName}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                      {student && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                          <p className="text-xs text-zinc-400">
                            Code:{" "}
                            <span className="font-medium text-zinc-700">
                              {student.studentCode}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Learning Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-zinc-500">
                    Describe what you want to achieve through mentorship.
                  </p>
                  <Textarea
                    placeholder="e.g. I want to master React and build production-ready applications..."
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSaveGoals}
                    disabled={savingGoals || updateStudentMut.isPending}
                    className="bg-zinc-900 hover:bg-zinc-700 text-white"
                  >
                    {savingGoals ? "Saving" : "Save Goals"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <ReviewDialog
        session={reviewSession}
        onClose={() => setReviewSession(null)}
      />
    </div>
  );
}
