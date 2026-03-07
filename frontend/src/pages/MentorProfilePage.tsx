import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  useMentor,
  useMentorSessions,
  useSubjects,
  useUploadMentorProfileImage,
  useUploadMentorCoverImage,
} from "@/hooks/use-queries";
import { getRoles } from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  Star,
  Tag,
} from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import BookingDialog from "@/components/BookingDialog";

const SUBJECT_PAGE_SIZE = 6;
const REVIEW_PAGE_SIZE = 5;

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= Math.round(value)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-zinc-200 text-zinc-200"
          }`}
        />
      ))}
    </span>
  );
}

export default function MentorProfilePage() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const id = Number(mentorId);
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { data: mentor, isLoading } = useMentor(id);
  const { data: sessions } = useMentorSessions(id);
  const { data: allSubjects } = useSubjects();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [subjectPage, setSubjectPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const uploadImageMut = useUploadMentorProfileImage();
  const uploadCoverMut = useUploadMentorCoverImage();

  const roles = getRoles(
    user?.publicMetadata as Record<string, unknown> | undefined,
  );
  const isStudent = isSignedIn === true && roles.includes("STUDENT");
  const isMentorRole = isSignedIn === true && roles.includes("MENTOR");
  const canBook = !isMentorRole;
  const isOwnProfile = isSignedIn && mentor?.clerkId === user?.id;

  const handleBookClick = () => {
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    if (!isStudent) {
      navigate("/onboarding/role");
      return;
    }
    setBookingOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImageMut.mutate({ id, file });
    e.target.value = "";
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      toast.error("Cover image is too large. Max 10 MB.");
      e.target.value = "";
      return;
    }
    uploadCoverMut.mutate({ id, file });
    e.target.value = "";
  };

  const mentorSubjects = allSubjects?.filter((s) => s.mentorId === id) ?? [];
  const completedSessions =
    sessions?.filter((s) => s.sessionStatus === "COMPLETED").length ?? 0;

  const reviews = useMemo(
    () => sessions?.filter((s) => s.studentReview != null) ?? [],
    [sessions],
  );

  const totalSubjectPages = Math.max(
    1,
    Math.ceil(mentorSubjects.length / SUBJECT_PAGE_SIZE),
  );
  const paginatedSubjects = mentorSubjects.slice(
    (subjectPage - 1) * SUBJECT_PAGE_SIZE,
    subjectPage * SUBJECT_PAGE_SIZE,
  );

  const totalReviewPages = Math.max(
    1,
    Math.ceil(reviews.length / REVIEW_PAGE_SIZE),
  );
  const paginatedReviews = reviews.slice(
    (reviewPage - 1) * REVIEW_PAGE_SIZE,
    reviewPage * REVIEW_PAGE_SIZE,
  );

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!mentor) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-500">Mentor not found.</p>
        <Link
          to="/mentors"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          Back to mentors
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 space-y-8">
        <Link
          to="/mentors"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to mentors
        </Link>

        <Card className="overflow-hidden border-zinc-100">
          <CardContent className="p-0">
            <div className="relative h-48">
              {mentor.coverImageUrl ? (
                <img
                  src={mentor.coverImageUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-600" />
              )}

              {isOwnProfile && (
                <>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 text-white text-xs px-3 py-1.5 hover:bg-black/80 transition-colors"
                    title="Change cover photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {uploadCoverMut.isPending ? "Uploading…" : "Edit cover"}
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </>
              )}
            </div>

            <div className="px-8 pb-8">
              {/* Top row: avatar overlapping cover + action */}
              <div className="flex items-start justify-between">
                <div className="relative -mt-12 shrink-0">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-1 ring-zinc-200">
                    <AvatarImage
                      src={
                        mentor.profileImageUrl ??
                        (isOwnProfile
                          ? (user?.imageUrl ?? undefined)
                          : undefined)
                      }
                      alt={mentor.fullName}
                    />
                    <AvatarFallback className="text-2xl font-bold bg-zinc-200 text-zinc-700">
                      {mentor.firstName?.[0]}
                      {mentor.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadImageMut.isPending}
                        className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-md hover:bg-zinc-700 transition-colors disabled:opacity-60"
                        title="Change profile photo"
                      >
                        {uploadImageMut.isPending ? (
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
                        onChange={handleImageChange}
                      />
                    </>
                  )}
                </div>

                <div className="mt-3 shrink-0">
                  {canBook && (
                    <Button
                      onClick={handleBookClick}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white"
                    >
                      {isStudent
                        ? "Book a Session"
                        : isSignedIn
                          ? "Complete Setup to Book"
                          : "Sign in to Book"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Name + meta below avatar */}
              <div className="mt-3">
                <h1 className="text-2xl font-bold text-zinc-900">
                  {mentor.fullName}
                </h1>
                <p className="text-zinc-600 flex items-center gap-1.5 text-sm mt-1">
                  <Briefcase className="h-4 w-4 shrink-0" /> {mentor.profession}{" "}
                  at {mentor.company}
                </p>

                {(mentor.averageRating ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Stars value={mentor.averageRating ?? 0} />
                    <span className="text-sm font-semibold text-zinc-900">
                      {(mentor.averageRating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-zinc-400">
                      ({mentor.totalReviews ?? 0} review
                      {(mentor.totalReviews ?? 0) !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />{" "}
                    {mentor.experienceYears}+ years exp.
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {mentor.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {mentor.phoneNumber}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Experience",
              value: `${mentor.experienceYears} yr`,
              icon: GraduationCap,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Subjects",
              value: String(mentorSubjects.length),
              icon: BookOpen,
              color: "text-indigo-600 bg-indigo-50",
            },
            {
              label: "Completed Sessions",
              value: String(completedSessions),
              icon: CalendarCheck,
              color: "text-green-600 bg-green-50",
            },
            {
              label: "Total Sessions",
              value: String(sessions?.length ?? 0),
              icon: Clock,
              color: "text-amber-600 bg-amber-50",
            },
          ].map((s) => (
            <Card key={s.label} className="bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg p-2 shrink-0 ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-900 leading-none">
                    {s.value}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subjects */}
        {mentorSubjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Subjects</h2>
              <span className="text-sm text-zinc-400">
                {mentorSubjects.length} subject
                {mentorSubjects.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedSubjects.map((s) => (
                <Card
                  key={s.id}
                  className="group bg-white hover:border-zinc-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
                >
                  <div className="relative h-52 bg-linear-to-br from-zinc-100 to-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                    {s.thumbnailUrl ? (
                      <img
                        src={s.thumbnailUrl}
                        alt={s.subjectName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="h-8 w-8 text-zinc-400 opacity-40" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/50 to-transparent px-3 py-2">
                      <p className="text-sm text-white font-semibold truncate">
                        {s.subjectName}
                      </p>
                    </div>
                    {s.category && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                          <Tag className="h-2.5 w-2.5" /> {s.category}
                        </span>
                      </div>
                    )}
                    {s.totalReviews > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 bg-yellow-400/95 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-yellow-900" />{" "}
                          {(s.averageRating ?? 0).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col gap-2">
                    <h3 className="font-semibold text-zinc-900 text-sm leading-snug">
                      {s.subjectName}
                    </h3>
                    {s.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 flex-1">
                        {s.description}
                      </p>
                    )}
                    <Link to={`/subjects/${s.id}`} className="mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> View Subject
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {mentorSubjects.length > SUBJECT_PAGE_SIZE && (
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-zinc-500">
                  {(subjectPage - 1) * SUBJECT_PAGE_SIZE + 1}
                  {Math.min(
                    subjectPage * SUBJECT_PAGE_SIZE,
                    mentorSubjects.length,
                  )}{" "}
                  of {mentorSubjects.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={subjectPage === 1}
                    onClick={() => setSubjectPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-zinc-600">
                    {subjectPage} / {totalSubjectPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={subjectPage >= totalSubjectPages}
                    onClick={() => setSubjectPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-zinc-900">
                Student Reviews
              </h2>
              <Badge variant="secondary" className="text-xs">
                {reviews.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {paginatedReviews.map((s) => (
                <Card key={s.id} className="bg-white">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-zinc-900 text-sm">
                          {s.subjectName}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(s.sessionAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Stars value={s.studentRating ?? 0} />
                        <span className="text-sm font-bold text-zinc-900">
                          {s.studentRating?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    {s.studentReview && (
                      <div className="flex gap-2">
                        <MessageSquare className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                        <p className="text-sm text-zinc-600 italic leading-relaxed">
                          "{s.studentReview}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {reviews.length > REVIEW_PAGE_SIZE && (
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-zinc-500">
                  {(reviewPage - 1) * REVIEW_PAGE_SIZE + 1}
                  {Math.min(
                    reviewPage * REVIEW_PAGE_SIZE,
                    reviews.length,
                  )} of {reviews.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewPage === 1}
                    onClick={() => setReviewPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-zinc-600">
                    {reviewPage} / {totalReviewPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewPage >= totalReviewPages}
                    onClick={() => setReviewPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
