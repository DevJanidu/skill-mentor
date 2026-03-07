import { useOpenGroupSessions, useJoinSession } from "@/hooks/use-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Clock, User, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function OpenGroupSessionsPage() {
  const { data: sessions, isLoading } = useOpenGroupSessions();
  const joinMut = useJoinSession();

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Open Group Sessions
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Browse available group sessions and join one that fits your
            schedule.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <Card key={s.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{s.subjectName}</CardTitle>
                    <Badge variant="outline">GROUP</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <User className="h-4 w-4" />
                      <span>{s.mentorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <CalendarCheck className="h-4 w-4" />
                      <span>
                        {new Date(s.sessionAt).toLocaleDateString()} at{" "}
                        {new Date(s.sessionAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Clock className="h-4 w-4" />
                      <span>{s.durationMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Users className="h-4 w-4" />
                      <span>
                        {s.currentParticipants}/{s.maxParticipants} participants
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((s.currentParticipants / s.maxParticipants) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    {s.maxParticipants - s.currentParticipants} seat
                    {s.maxParticipants - s.currentParticipants !== 1
                      ? "s"
                      : ""}{" "}
                    remaining
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => joinMut.mutate(s.id)}
                      disabled={joinMut.isPending}
                    >
                      {joinMut.isPending ? "Joining…" : "Join Session"}
                    </Button>
                    <Link to={`/sessions/${s.id}`}>
                      <Button variant="outline">Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500">
                No open group sessions available right now.
              </p>
              <Link to="/mentors" className="mt-3 inline-block">
                <Button variant="outline">Browse Mentors Instead</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
