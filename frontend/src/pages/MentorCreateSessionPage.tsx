import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useCurrentMentor,
  useSubjects,
  useCreateSession,
} from "@/hooks/use-queries";
import { extractErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CalendarCheck, UserCircle } from "lucide-react";
import type { SessionType } from "@/types";

export default function MentorCreateSessionPage() {
  const navigate = useNavigate();

  const { mentor, isLoading: mentorLoading, notFound } = useCurrentMentor();
  const { data: allSubjects } = useSubjects();
  const createMut = useCreateSession();

  const mySubjects =
    allSubjects?.filter((s) => s.mentorId === mentor?.id) ?? [];

  // ── Form state ───────────────────────────────────────────────────────
  const [subjectId, setSubjectId] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("INDIVIDUAL");
  const [sessionAt, setSessionAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [maxParticipants, setMaxParticipants] = useState("10");

  const isGroup = sessionType === "GROUP";

  const canSubmit =
    !!mentor &&
    !!subjectId &&
    !!sessionAt &&
    !!duration &&
    (!isGroup || Number(maxParticipants) >= 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor || !canSubmit) return;

    createMut.mutate(
      {
        mentorId: mentor.id,
        subjectId: Number(subjectId),
        sessionType,
        sessionAt: new Date(sessionAt).toISOString(),
        durationMinutes: Number(duration),
        studentIds: [],
        maxParticipants: isGroup ? Number(maxParticipants) : 1,
      },
      {
        onSuccess: () => navigate("/mentor/dashboard"),
      },
    );
  };

  if (mentorLoading) {
    return (
      <div className="py-24 text-center text-zinc-500">
        Loading mentor profile…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="py-24 text-center space-y-4">
        <UserCircle className="mx-auto h-12 w-12 text-zinc-300" />
        <p className="text-zinc-500">
          You need to create your mentor profile first.
        </p>
        <Link to="/mentor/profile">
          <Button>Create Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-2xl px-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Create Session</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Schedule a new session and optionally assign students.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" /> Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Subject */}
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                {mySubjects.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    You have no subjects yet.{" "}
                    <a
                      href="/mentor/subjects"
                      className="underline font-medium"
                    >
                      Add one first →
                    </a>
                  </p>
                ) : (
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {mySubjects.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Session Type */}
              <div className="space-y-1.5">
                <Label>Session Type *</Label>
                <Select
                  value={sessionType}
                  onValueChange={(v) => setSessionType(v as SessionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">
                      Individual (1-on-1)
                    </SelectItem>
                    <SelectItem value="GROUP">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <Label htmlFor="sat">Date & Time *</Label>
                <Input
                  id="sat"
                  type="datetime-local"
                  value={sessionAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setSessionAt(e.target.value)}
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label>Duration *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max participants — GROUP only */}
              {isGroup && (
                <div className="space-y-1.5">
                  <Label htmlFor="mp">Max Participants *</Label>
                  <Input
                    id="mp"
                    type="number"
                    min={2}
                    max={50}
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="w-32"
                  />
                  <p className="text-xs text-zinc-400">Between 2 and 50.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error alert */}
          {createMut.isError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{extractErrorMessage(createMut.error)}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/mentor/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || createMut.isPending}>
              {createMut.isPending ? "Creating…" : "Create Session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
