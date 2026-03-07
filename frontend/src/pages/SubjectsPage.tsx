import { useMentors, useSubjects } from "@/hooks/use-queries";
import type { MentorDTO } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  Tag,
  User,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

/* ── inline star-rating mini widget ─────────────────────────────────────── */
function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
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
      </div>
      <span className="text-sm font-bold text-zinc-800">
        {value > 0 ? value.toFixed(1) : "–"}
      </span>
      <span className="text-xs text-zinc-400">
        {count > 0 ? `(${count})` : "No reviews yet"}
      </span>
    </div>
  );
}

const PAGE_SIZE = 12;

export default function SubjectsPage() {
  const { data: subjects, isLoading: sl } = useSubjects();
  const { data: mentors } = useMentors();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [ratingMin, setRatingMin] = useState(0);
  const [page, setPage] = useState(1);

  const mentorMap = useMemo(() => {
    const m = new Map<number, MentorDTO>();
    mentors?.forEach((mentor) => m.set(mentor.id, mentor));
    return m;
  }, [mentors]);

  const allCategories = useMemo(() => {
    const cats = new Set(
      subjects?.map((s) => s.category).filter(Boolean) ?? [],
    );
    return ["all", ...Array.from(cats).sort()] as string[];
  }, [subjects]);

  const filtered = useMemo(
    () =>
      subjects?.filter((s) => {
        const q = search.toLowerCase();
        const matchesSearch =
          s.subjectName.toLowerCase().includes(q) ||
          s.mentorName?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q);
        const matchesCategory = category === "all" || s.category === category;
        const matchesRating = (s.averageRating ?? 0) >= ratingMin;
        return matchesSearch && matchesCategory && matchesRating;
      }) ?? [],
    [subjects, search, category, ratingMin],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (clampedPage - 1) * PAGE_SIZE,
    clampedPage * PAGE_SIZE,
  );

  return (
    <section className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-6">
        {/* Hero header */}
        <div className="mb-12 max-w-2xl">
          <Badge
            variant="secondary"
            className="mb-4 bg-zinc-100 text-zinc-900 hover:bg-zinc-100 border-none px-3 py-1"
          >
            All Subjects
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Explore what you can learn.
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Browse every subject offered by our mentors and book a session to
            start learning today.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by subject, mentor, category…"
              className="pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(ratingMin)}
            onValueChange={(v) => setRatingMin(Number(v))}
          >
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Min Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Count */}
        {!sl && (
          <p className="text-sm text-zinc-500 mb-6">
            {filtered.length} subject{filtered.length !== 1 ? "s" : ""} found
            {filtered.length > PAGE_SIZE && ` · Page ${page} of ${totalPages}`}
          </p>
        )}

        {/* Grid */}
        {sl ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-zinc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No subjects found.</p>
            {search && (
              <p className="text-zinc-400 text-sm mt-1">
                Try clearing your search.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((subject) => {
              const mentor = mentorMap.get(subject.mentorId);
              return (
                <Card
                  key={subject.id}
                  className="group bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative h-52 bg-linear-to-br from-zinc-100 to-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                    {subject.thumbnailUrl ? (
                      <img
                        src={subject.thumbnailUrl}
                        alt={subject.subjectName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <BookOpen className="h-10 w-10 text-zinc-600" />
                      </div>
                    )}
                    {/* Bottom overlay for quick title */}
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/50 to-transparent px-4 py-3">
                      <p className="text-sm text-white font-semibold truncate">
                        {subject.subjectName}
                      </p>
                    </div>
                    {/* Category badge overlay */}
                    {subject.category && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                          <Tag className="h-3 w-3" />
                          {subject.category}
                        </span>
                      </div>
                    )}
                    {/* Rating overlay */}
                    {subject.totalReviews > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 bg-yellow-400/95 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                          <Star className="h-3 w-3 fill-yellow-900" />
                          {subject.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col">
                    {/* Subject name */}
                    <h3 className="font-bold text-zinc-900 text-lg leading-snug group-hover:text-zinc-700 transition-colors mb-1">
                      {subject.subjectName}
                    </h3>

                    {/* Star rating row */}
                    <div className="mb-3">
                      <StarRating
                        value={subject.averageRating ?? 0}
                        count={subject.totalReviews ?? 0}
                      />
                    </div>

                    {/* Description */}
                    {subject.description ? (
                      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2 mb-4 flex-1">
                        {subject.description}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400 italic mb-4 flex-1">
                        No description provided.
                      </p>
                    )}

                    {/* Mentor chip */}
                    <div className="flex items-center gap-2.5 py-2.5 px-3 bg-zinc-50 rounded-xl border border-zinc-100 mt-auto">
                      <Avatar className="h-7 w-7 shrink-0">
                        {mentor?.profileImageUrl && (
                          <AvatarImage
                            src={mentor.profileImageUrl}
                            alt={subject.mentorName}
                          />
                        )}
                        <AvatarFallback className="text-xs font-semibold bg-zinc-200 text-zinc-700">
                          {subject.mentorName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-400 leading-none mb-0.5">
                          Mentor
                        </p>
                        <p className="text-sm font-semibold text-zinc-800 truncate">
                          {subject.mentorName}
                        </p>
                      </div>
                      <Link
                        to={`/mentors/${subject.mentorId}`}
                        className="shrink-0"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-zinc-400 hover:text-zinc-900 px-2"
                        >
                          <User className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>

                  <CardFooter className="px-5 pb-5 pt-0">
                    <Link to={`/subjects/${subject.id}`} className="w-full">
                      <Button className="w-full bg-zinc-900 hover:bg-zinc-700 text-white font-semibold">
                        View Subject
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!sl && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-10 border-t pt-6">
            <p className="text-sm text-zinc-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-zinc-700 min-w-12 text-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
