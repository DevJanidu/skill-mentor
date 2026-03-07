import { useMentors, useSubjects } from "@/hooks/use-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Briefcase, GraduationCap, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function MentorsPage() {
  const { data: mentors, isLoading: ml } = useMentors();
  const { data: subjects } = useSubjects();
  const [search, setSearch] = useState("");

  // Build a map: mentorId → subject names
  const mentorSubjects = new Map<number, string[]>();
  subjects?.forEach((s) => {
    const list = mentorSubjects.get(s.mentorId) ?? [];
    list.push(s.subjectName);
    mentorSubjects.set(s.mentorId, list);
  });

  const filtered = mentors?.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.profession.toLowerCase().includes(search.toLowerCase()) ||
      m.company.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <Badge
            variant="secondary"
            className="mb-4 bg-zinc-100 text-zinc-900 hover:bg-zinc-100 border-none px-3 py-1"
          >
            Our Mentors
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Find the right mentor for you.
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Browse our verified mentors and book a session to accelerate your
            learning journey.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by name, profession, or company…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {ml ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-zinc-400" />
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((m) => {
              const subs = mentorSubjects.get(m.id) ?? [];
              return (
                <Card
                  key={m.id}
                  className="group border-zinc-100 bg-white hover:border-zinc-200 transition-all duration-300 shadow-sm hover:shadow-xl"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={m.profileImageUrl ?? undefined}
                          alt={m.fullName}
                        />
                        <AvatarFallback className="text-lg font-bold bg-zinc-100">
                          {m.firstName?.[0]}
                          {m.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h3 className="font-bold text-xl text-zinc-900">
                        {m.fullName}
                      </h3>
                      <p className="text-zinc-600 font-medium flex items-center gap-2">
                        <Briefcase size={14} />
                        {m.profession} at {m.company}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mb-6 text-sm text-zinc-500">
                      <div className="flex items-center gap-1">
                        <GraduationCap size={14} />
                        {m.experienceYears}+ Years
                      </div>
                    </div>

                    {subs.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-8">
                        {subs.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="text-[11px] font-semibold uppercase tracking-wider bg-zinc-50 border border-zinc-100 px-2 py-1 rounded text-zinc-500"
                          >
                            {s}
                          </span>
                        ))}
                        {subs.length > 4 && (
                          <span className="text-[11px] font-semibold text-zinc-400">
                            +{subs.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <Link to={`/mentors/${m.id}`}>
                      <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-md">
                        View Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-zinc-500">
              No mentors found matching your search.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
