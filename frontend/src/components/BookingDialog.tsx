import { useState } from "react";
import { useBookSession } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubjectDTO, SessionType } from "@/types";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: number;
  mentorName: string;
  subjects: SubjectDTO[];
  /** Pre-select a specific subject when the dialog opens */
  defaultSubjectId?: number;
}

export default function BookingDialog({
  open,
  onOpenChange,
  mentorId,
  mentorName,
  subjects,
  defaultSubjectId,
}: BookingDialogProps) {
  const bookSession = useBookSession();

  const [subjectId, setSubjectId] = useState(
    defaultSubjectId ? String(defaultSubjectId) : "",
  );
  const [sessionType, setSessionType] = useState<SessionType>("INDIVIDUAL");
  const [sessionAt, setSessionAt] = useState("");
  const [duration, setDuration] = useState(60);

  const reset = () => {
    setSubjectId(defaultSubjectId ? String(defaultSubjectId) : "");
    setSessionType("INDIVIDUAL");
    setSessionAt("");
    setDuration(60);
  };

  const handleSubmit = () => {
    if (!subjectId || !sessionAt) return;

    bookSession.mutate(
      {
        mentorId,
        subjectId: Number(subjectId),
        sessionType,
        sessionAt: new Date(sessionAt).toISOString(),
        durationMinutes: duration,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Session with {mentorName}</DialogTitle>
          <DialogDescription>
            Choose a subject, date, and time to schedule a session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject…" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Session Type</Label>
            <Select
              value={sessionType}
              onValueChange={(v) => setSessionType(v as SessionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="GROUP">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date/time */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={sessionAt}
              onChange={(e) => setSessionAt(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[30, 45, 60, 90, 120].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!subjectId || !sessionAt || bookSession.isPending}
          >
            {bookSession.isPending ? "Booking…" : "Book Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
