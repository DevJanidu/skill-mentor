import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSubject, useMentor, useSubjects } from "@/hooks/use-queries";
import { getRoles } from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner, PageSpinner } from "@/components/ui/spinner";
import BookingDialog from "@/components/BookingDialog";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarPlus,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  Star,
  Tag,
  User,
} from "lucide-react";
import { useState, useMemo } from "react";

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const id = Number(subjectId);

  const { data: subject, isLoading: sl } = useSubject(id);
  const { data: mentor, isLoading: ml } = useMentor(subject?.mentorId ?? 0);
  const { data: allSubjects } = useSubjects();
  const [bookingOpen, setBookingOpen] = useState(false);

  // Derive role directly from Clerk publicMetadata — always available,
  // no extra API call needed. Same pattern used in OnboardingGuard.
  const roles = getRoles(
    user?.publicMetadata as Record<string, unknown> | undefined,
  );
  const isStudent = isSignedIn === true && roles.includes("STUDENT");
  const isMentorRole = isSignedIn === true && roles.includes("MENTOR");

  // Other subjects by this mentor
  const mentorSubjects = useMemo(
    () =>
      allSubjects?.filter(
        (s) => s.mentorId === subject?.mentorId && s.id !== id,
      ) ?? [],
    [allSubjects, subject?.mentorId, id],
  );

  const handleBookClick = () => {
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    if (!isStudent) {
      // Signed in but not a student (no role yet or mentor) — send to onboarding
      navigate("/onboarding/role");
      return;
    }
    setBookingOpen(true);
  };

  if (sl) {
    return <PageSpinner />;
  }

  if (!subject) {
    return (
      <div className="py-24 text-center">
        <BookOpen className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">Subject not found.</p>
        <Link
          to="/subjects"
          className="text-zinc-700 hover:underline mt-2 inline-block text-sm"
        >
          ← Back to subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-6 space-y-8">
        {/* Back */}
        <Link
          to="/subjects"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to subjects
        </Link>

        {/* Subject hero banner */}
        <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden shadow-md">
          {subject.thumbnailUrl ? (
            <img
              src={subject.thumbnailUrl}
              alt={subject.subjectName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-600">
              <BookOpen className="h-16 w-16 text-white/20" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
          {/* Badges top-left */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {subject.category && (
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/30">
                <Tag className="h-3 w-3" />
                {subject.category}
              </span>
            )}
            {subject.totalReviews > 0 && (
              <span className="inline-flex items-center gap-1 bg-yellow-400/95 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                <Star className="h-3 w-3 fill-yellow-900" />
                {subject.averageRating.toFixed(1)}
                <span className="font-normal opacity-75">
                  ({subject.totalReviews})
                </span>
              </span>
            )}
          </div>
          {/* Text bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow">
              {subject.subjectName}
            </h1>
            <p className="text-white/75 text-sm mt-1">
              Taught by{" "}
              <Link
                to={`/mentors/${subject.mentorId}`}
                className="font-semibold text-white hover:underline underline-offset-2"
              >
                {subject.mentorName}
              </Link>
            </p>
          </div>
        </div>

        {/* Booking CTA bar */}
        {!isMentorRole && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-zinc-100 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex-1">
              <p className="font-semibold text-zinc-900">
                Ready to learn {subject.subjectName}?
              </p>
              <p className="text-sm text-zinc-500">
                {isStudent
                  ? "Pick a time that works for you."
                  : isSignedIn
                    ? "Complete your student profile to book sessions."
                    : "A student account is required to book sessions."}
              </p>
            </div>
            <Button
              size="lg"
              className="bg-zinc-900 hover:bg-zinc-700 text-white gap-2 shrink-0"
              onClick={handleBookClick}
            >
              <CalendarPlus className="h-5 w-5" />
              {isStudent
                ? "Book a Session"
                : isSignedIn
                  ? "Complete Setup"
                  : "Sign in to Book"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mentor card */}
          <div className="space-y-4">
            <Card className="border-zinc-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                  Your Mentor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ml ? (
                  <div className="flex justify-center py-6">
                    <Spinner className="h-6 w-6 text-zinc-400" />
                  </div>
                ) : mentor ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 border-2 border-zinc-100 shadow-sm">
                        {mentor.profileImageUrl && (
                          <AvatarImage
                            src={mentor.profileImageUrl}
                            alt={mentor.fullName}
                          />
                        )}
                        <AvatarFallback className="text-base font-bold bg-zinc-100 text-zinc-700">
                          {mentor.firstName?.[0]}
                          {mentor.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-zinc-900">
                          {mentor.fullName}
                        </p>
                        {mentor.title && (
                          <p className="text-xs text-zinc-500">
                            {mentor.title}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      {mentor.profession && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Briefcase className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {mentor.profession}
                            {mentor.company ? ` · ${mentor.company}` : ""}
                          </span>
                        </div>
                      )}
                      {mentor.experienceYears > 0 && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <GraduationCap className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {mentor.experienceYears}+ years experience
                          </span>
                        </div>
                      )}
                      {mentor.email && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate text-xs">
                            {mentor.email}
                          </span>
                        </div>
                      )}
                      {mentor.phoneNumber && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>{mentor.phoneNumber}</span>
                        </div>
                      )}
                    </div>

                    {mentor.bio && (
                      <>
                        <Separator />
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">
                          {mentor.bio}
                        </p>
                      </>
                    )}

                    <Link to={`/mentors/${mentor.id}`} className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1"
                      >
                        <User className="h-3.5 w-3.5" />
                        View Full Profile
                      </Button>
                    </Link>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Right column: what you'll learn + other subjects */}
          <div className="md:col-span-2 space-y-6">
            {/* What you'll learn */}
            <Card className="border-zinc-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900">
                  About this subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subject.description ? (
                  <p className="text-zinc-600 leading-relaxed">
                    {subject.description}
                  </p>
                ) : (
                  <p className="text-zinc-400 italic text-sm">
                    No additional details provided.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <Clock className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Session length</p>
                      <p className="text-sm font-medium text-zinc-700">
                        30–120 min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <CalendarPlus className="h-4 w-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Format</p>
                      <p className="text-sm font-medium text-zinc-700">
                        Individual or Group
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Other subjects by same mentor */}
            {mentorSubjects.length > 0 && (
              <Card className="border-zinc-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-zinc-900">
                    More subjects by {subject.mentorName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mentorSubjects.slice(0, 5).map((s) => (
                      <Link
                        key={s.id}
                        to={`/subjects/${s.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all group"
                      >
                        <div className="rounded-lg overflow-hidden h-12 w-12 bg-zinc-100 shrink-0">
                          {s.thumbnailUrl ? (
                            <img
                              src={s.thumbnailUrl}
                              alt={s.subjectName}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-800 truncate">
                            {s.subjectName}
                          </p>
                          {s.description && (
                            <p className="text-xs text-zinc-400 truncate">
                              {s.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0 bg-zinc-100 text-zinc-500"
                        >
                          View
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Booking dialog – subject pre-selected */}
      {mentor && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          mentorId={mentor.id}
          mentorName={mentor.fullName}
          subjects={allSubjects?.filter((s) => s.mentorId === mentor.id) ?? []}
          defaultSubjectId={id}
        />
      )}
    </div>
  );
}
