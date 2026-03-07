import { useCurrentMentor, useSessionsByMentor } from "@/hooks/use-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { formatSessionDate } from "@/lib/session-utils";

export default function MentorReviewsPage() {
  const { mentor } = useCurrentMentor();

  const { data: sessions = [], isLoading } = useSessionsByMentor(
    mentor?.id ?? 0,
  );

  const reviewedSessions = sessions
    .filter((s) => s.studentReview)
    .sort(
      (a, b) =>
        new Date(b.sessionAt).getTime() - new Date(a.sessionAt).getTime(),
    );

  const totalReviews = mentor?.totalReviews ?? reviewedSessions.length;
  const avgRating = mentor?.averageRating
    ? mentor.averageRating.toFixed(1)
    : "—";

  // Star distribution
  const starDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewedSessions.filter((s) => s.studentRating === star).length,
  }));
  const maxStarCount = Math.max(...starDist.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Reviews & Ratings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Feedback from your students across all sessions.
        </p>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Big average */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-12 w-16" />
            ) : (
              <>
                <p className="text-4xl font-bold text-zinc-900">{avgRating}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= Math.round(mentor?.averageRating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-zinc-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Star distribution */}
        <Card className="sm:col-span-2">
          <CardContent className="p-6 space-y-2">
            {starDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-zinc-600 w-8 text-right">
                  {star}★
                </span>
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{
                      width: `${(count / maxStarCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-zinc-400 w-6">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reviews list */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          All Reviews ({reviewedSessions.length})
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : reviewedSessions.length > 0 ? (
          <div className="space-y-3">
            {reviewedSessions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i <= (s.studentRating ?? 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-zinc-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-zinc-700">
                          {s.studentRating}/5
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        "{s.studentReview}"
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">
                        {s.subjectName} &middot;{" "}
                        {formatSessionDate(s.sessionAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Star className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-700">No reviews yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Reviews will appear here after students complete sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
