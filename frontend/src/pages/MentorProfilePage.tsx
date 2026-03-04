import { useParams, Link } from "react-router-dom";
import { useMentor, useMentorSessions, useSubjects } from "@/hooks/use-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarCheck,
  Clock,
  GraduationCap,
  Mail,
  Phone,
} from "lucide-react";
import { useState } from "react";
import BookingDialog from "@/components/BookingDialog";

export default function MentorProfilePage() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const id = Number(mentorId);
  const { data: mentor, isLoading } = useMentor(id);
  const { data: sessions } = useMentorSessions(id);
  const { data: allSubjects } = useSubjects();
  const [bookingOpen, setBookingOpen] = useState(false);

  const mentorSubjects = allSubjects?.filter((s) => s.mentorId === id) ?? [];
  const completedSessions =
    sessions?.filter((s) => s.sessionStatus === "COMPLETED").length ?? 0;

  if (isLoading) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-4xl px-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-500">Mentor not found.</p>
        <Link
          to="/mentors"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          ← Back to mentors
        </Link>
      </div>
    );
  }

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-6 space-y-8">
        {/* Back */}
        <Link
          to="/mentors"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to mentors
        </Link>

        {/* Profile header */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24 border-2 border-white shadow-md">
                {mentor.profileImageUrl && (
                  <AvatarImage
                    src={mentor.profileImageUrl}
                    alt={mentor.fullName}
                  />
                )}
                <AvatarFallback className="text-2xl font-bold bg-zinc-100">
                  {mentor.firstName?.[0]}
                  {mentor.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                      {mentor.fullName}
                    </h1>
                    <p className="text-zinc-600 flex items-center gap-2 mt-1">
                      <Briefcase size={14} />
                      {mentor.profession} at {mentor.company}
                    </p>
                  </div>
                  <Button
                    onClick={() => setBookingOpen(true)}
                    className="bg-zinc-900 hover:bg-zinc-800"
                  >
                    Book a Session
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} /> {mentor.experienceYears}+ years
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {mentor.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {mentor.phoneNumber}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {mentor.bio && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 leading-relaxed">{mentor.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Experience",
              value: `${mentor.experienceYears}yr`,
              icon: GraduationCap,
            },
            {
              label: "Subjects",
              value: String(mentorSubjects.length),
              icon: BookOpen,
            },
            {
              label: "Completed",
              value: String(completedSessions),
              icon: CalendarCheck,
            },
            {
              label: "Total Sessions",
              value: String(sessions?.length ?? 0),
              icon: Clock,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-zinc-100 p-2">
                  <s.icon className="h-4 w-4 text-zinc-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-900">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subjects */}
        {mentorSubjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mentorSubjects.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="bg-zinc-100 text-zinc-700"
                  >
                    {s.subjectName}
                  </Badge>
                ))}
              </div>
              {mentorSubjects.some((s) => s.description) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    {mentorSubjects
                      .filter((s) => s.description)
                      .map((s) => (
                        <div key={s.id}>
                          <p className="font-medium text-sm text-zinc-900">
                            {s.subjectName}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {s.description}
                          </p>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent sessions */}
        {sessions && sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {s.subjectName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(s.sessionAt).toLocaleDateString()} ·{" "}
                        {s.durationMinutes}min · {s.sessionType}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        s.sessionStatus === "COMPLETED"
                          ? "bg-green-50 text-green-700"
                          : s.sessionStatus === "CANCELED"
                            ? "bg-red-50 text-red-700"
                            : "bg-zinc-100 text-zinc-700"
                      }
                    >
                      {s.sessionStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booking dialog */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        mentorId={id}
        mentorName={mentor.fullName}
        subjects={mentorSubjects}
      />
    </div>
  );
}
