import { useMentors, useSubjects } from "@/hooks/use-queries";
import type { MentorDTO } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, User } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

export default function SubjectsPage() {
  const { data: subjects, isLoading: sl } = useSubjects();
  const { data: mentors } = useMentors();
  const [search, setSearch] = useState("");

  const mentorMap = useMemo(() => {
    const m = new Map<number, MentorDTO>();
    mentors?.forEach((mentor) => m.set(mentor.id, mentor));
    return m;
  }, [mentors]);

  const filtered = useMemo(
    () =>
      subjects?.filter((s) => {
        const q = search.toLowerCase();
        return (
          s.subjectName.toLowerCase().includes(q) ||
          s.mentorName?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
        );
      }) ?? [],
    [subjects, search],
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

        {/* Search */}
        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by subject, mentor, or keyword…"
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Count */}
        {!sl && (
          <p className="text-sm text-zinc-500 mb-6">
            {filtered.length} subject{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Grid */}
        {sl ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
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
            {filtered.map((subject) => {
              const mentor = mentorMap.get(subject.mentorId);
              return (
                <Card
                  key={subject.id}
                  className="group bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  <CardContent className="p-6 flex-1">
                    {/* Subject icon + name */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="rounded-xl bg-zinc-900 p-2.5 mt-0.5 shrink-0">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-lg leading-snug group-hover:text-zinc-700 transition-colors">
                          {subject.subjectName}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    {subject.description ? (
                      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 mb-5">
                        {subject.description}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400 italic mb-5">
                        No description provided.
                      </p>
                    )}

                    {/* Mentor chip */}
                    <div className="flex items-center gap-2.5 py-3 px-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <Avatar className="h-7 w-7 shrink-0">
                        {mentor?.profileImageUrl && (
                          <AvatarImage
                            src={mentor.profileImageUrl}
                            alt={subject.mentorName}
                          />
                        )}
                        <AvatarFallback className="text-xs font-medium bg-zinc-200 text-zinc-700">
                          {subject.mentorName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-400">Mentor</p>
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {subject.mentorName}
                        </p>
                      </div>
                      <Link
                        to={`/mentors/${subject.mentorId}`}
                        className="ml-auto shrink-0"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-zinc-500 hover:text-zinc-900"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>

                  <CardFooter className="px-6 pb-6 pt-0">
                    <Link to={`/subjects/${subject.id}`} className="w-full">
                      <Button className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                        View Subject
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
