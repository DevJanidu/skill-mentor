import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useCurrentMentor,
  useSubjects,
  useCreateSession,
} from "@/hooks/use-queries";
import { studentsApi } from "@/services/api";
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
import { AlertCircle, CalendarCheck, UserCircle, X } from "lucide-react";
import type { SessionType, StudentDTO } from "@/types";
import { PageSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function MentorCreateSessionPage() {
  const navigate = useNavigate();

  const { mentor, isLoading: mentorLoading, notFound } = useCurrentMentor();
  const { data: allSubjects } = useSubjects();
  const createMut = useCreateSession();

  const mySubjects =
    allSubjects?.filter((s) => s.mentorId === mentor?.id) ?? [];

  // ── Form state ───────────────────────────────────────────────────────
  const [subjectId, setSubjectId] = useState("");
  const [sessionAt, setSessionAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [maxParticipants, setMaxParticipants] = useState("10");

  // Student code lookup
  const [studentCodeInput, setStudentCodeInput] = useState("");
  const [addedStudents, setAddedStudents] = useState<StudentDTO[]>([]);
  const [lookingUp, setLookingUp] = useState(false);

  const canSubmit =
    !!mentor &&
    !!subjectId &&
    !!sessionAt &&
    !!duration &&
    Number(maxParticipants) >= 2;

  const handleAddStudent = async () => {
    const code = studentCodeInput.trim();
    if (!code) return;
    if (addedStudents.some((s) => s.studentCode === code)) {
      toast.error("Student already added.");
      return;
    }
    setLookingUp(true);
    try {
      const student = await studentsApi.getByCode(code);
      setAddedStudents((prev) => [...prev, student]);
      setStudentCodeInput("");
      toast.success(`Added ${student.firstName} ${student.lastName}`);
    } catch {
      toast.error("Student not found with that ID.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleRemoveStudent = (studentId: number) => {
    setAddedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor || !canSubmit) return;

    createMut.mutate(
      {
        mentorId: mentor.id,
        subjectId: Number(subjectId),
        sessionType: "GROUP" as SessionType,
        sessionAt: new Date(sessionAt).toISOString(),
        durationMinutes: Number(duration),
        studentIds: addedStudents.map((s) => s.id),
        maxParticipants: Number(maxParticipants),
      },
      {
        onSuccess: () => navigate("/mentor/dashboard"),
      },
    );
  };

  if (mentorLoading) {
    return <PageSpinner />;
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
          <h1 className="text-2xl font-bold text-zinc-900">
            Create Group Session
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Schedule a new open group session for students to join. Individual
            sessions are created when a student books you directly.
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
                <Label>Session Type</Label>
                <div className="text-sm text-zinc-600 bg-zinc-100 rounded-md px-3 py-2">
                  Group Session
                </div>
                <p className="text-xs text-zinc-400">
                  Individual sessions are created when students book you from
                  your profile.
                </p>
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

              {/* Max participants */}
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

              {/* Invite students by ID */}
              <div className="space-y-1.5">
                <Label>Invite Students by ID (optional)</Label>
                <p className="text-xs text-zinc-400">
                  Add specific students by their Student ID. Leave empty to
                  create an open session anyone can join.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. STU-XXXXXX"
                    value={studentCodeInput}
                    onChange={(e) => setStudentCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddStudent();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddStudent}
                    disabled={lookingUp || !studentCodeInput.trim()}
                  >
                    {lookingUp ? "Looking up…" : "Add"}
                  </Button>
                </div>
                {addedStudents.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {addedStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm"
                      >
                        <span>
                          {s.firstName} {s.lastName}{" "}
                          <span className="text-zinc-400 font-mono text-xs">
                            ({s.studentCode})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(s.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
