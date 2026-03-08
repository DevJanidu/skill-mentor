import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useBookSession,
  useMentorAvailability,
  useMentorSessions,
} from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubjectDTO, DayOfWeek, MentorAvailabilityDTO } from "@/types";

/** Add N days to a date, return midnight-aligned */
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** JS getDay() → DayOfWeek */
function toDayOfWeek(d: Date): DayOfWeek {
  return (
    [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as const
  )[d.getDay()];
}

/** Build "HH:mm" from hours and minutes */
function hhmm(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Generate 30-min time slots between start and end */
function generateSlots(start: string, end: string): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const slots: string[] = [];
  for (let m = startMin; m < endMin; m += 30) {
    slots.push(hhmm(Math.floor(m / 60), m % 60));
  }
  return slots;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: number;
  mentorName: string;
  subjects: SubjectDTO[];
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
  const navigate = useNavigate();
  const { data: availability } = useMentorAvailability(mentorId);
  const { data: existingSessions } = useMentorSessions(mentorId);

  const [subjectId, setSubjectId] = useState(
    defaultSubjectId ? String(defaultSubjectId) : "",
  );
  const [sessionAt, setSessionAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const reset = () => {
    setSubjectId(defaultSubjectId ? String(defaultSubjectId) : "");
    setSessionAt("");
    setDuration(60);
    setSelectedDate("");
  };

  // Build the next 14 days for date picking
  const next14Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i + 1);
      return {
        date: d,
        weekday: d.toLocaleDateString(undefined, { weekday: "short" }), // "Mon"
        day: d.getDate(), // 10
        month: d.toLocaleDateString(undefined, { month: "short" }), // "Mar"
        dayOfWeek: toDayOfWeek(d),
        iso: d.toISOString().slice(0, 10),
      };
    });
  }, []);

  // Get the available slots for the selected date
  const selectedDay = next14Days.find((d) => d.iso === selectedDate);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDay || !availability) return [];
    const daySlots = availability.filter(
      (a: MentorAvailabilityDTO) =>
        a.dayOfWeek === selectedDay.dayOfWeek && a.isActive,
    );
    const allTimes: string[] = [];
    daySlots.forEach((s: MentorAvailabilityDTO) => {
      allTimes.push(...generateSlots(s.startTime, s.endTime));
    });
    return [...new Set(allTimes)].sort();
  }, [selectedDay, availability]);

  // Find which slots are already booked
  const bookedSlots = useMemo(() => {
    if (!selectedDate || !existingSessions) return new Set<string>();
    const booked = new Set<string>();
    existingSessions
      .filter(
        (s) =>
          s.sessionStatus !== "CANCELED" &&
          s.sessionAt.startsWith(selectedDate),
      )
      .forEach((s) => {
        const start = new Date(s.sessionAt);
        const endMin =
          start.getHours() * 60 + start.getMinutes() + s.durationMinutes;
        for (
          let m = start.getHours() * 60 + start.getMinutes();
          m < endMin;
          m += 30
        ) {
          booked.add(hhmm(Math.floor(m / 60), m % 60));
        }
      });
    return booked;
  }, [selectedDate, existingSessions]);

  // Check if the selected time + duration conflicts with any existing session
  const hasConflict = useMemo(() => {
    if (!sessionAt || !existingSessions) return false;
    const newStart = new Date(sessionAt).getTime();
    const newEnd = newStart + duration * 60000;
    return existingSessions.some((s) => {
      if (s.sessionStatus === "CANCELED") return false;
      const sStart = new Date(s.sessionAt).getTime();
      const sEnd = sStart + s.durationMinutes * 60000;
      return newStart < sEnd && newEnd > sStart;
    });
  }, [sessionAt, duration, existingSessions]);

  const handleSelectSlot = (time: string) => {
    if (!selectedDate) return;
    setSessionAt(`${selectedDate}T${time}`);
  };

  const handleSubmit = () => {
    if (!subjectId || !sessionAt || hasConflict) return;

    bookSession.mutate(
      {
        mentorId,
        subjectId: Number(subjectId),
        sessionType: "INDIVIDUAL" as const,
        sessionAt: new Date(sessionAt).toISOString(),
        durationMinutes: duration,
      },
      {
        onSuccess: (bookedSession) => {
          onOpenChange(false);
          reset();
          navigate(`/payment/${bookedSession.id}`);
        },
      },
    );
  };

  // Days with availability highlighted
  const daysWithAvail = useMemo(() => {
    if (!availability) return new Set<DayOfWeek>();
    return new Set(
      availability
        .filter((a: MentorAvailabilityDTO) => a.isActive)
        .map((a: MentorAvailabilityDTO) => a.dayOfWeek),
    );
  }, [availability]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      {/*
       * w-[calc(100vw-2rem)] → nearly full-width on mobile with 1rem margins each side
       * max-w-[520px]        → comfortable fixed width on desktop
       * max-h-[88vh]         → cap height, avoid viewport overflow
       * flex flex-col        → header + scrollable body + sticky footer
       * p-0 gap-0            → remove shadcn default padding/gap so we own all spacing
       * overflow-hidden      → clip children to rounded corners
       */}
      <DialogContent className="w-[calc(100vw-2rem)] max-w-130 max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">
        {/* ── Sticky header ───────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 shrink-0 border-b border-zinc-100">
          <DialogTitle className="text-lg font-bold text-zinc-900 leading-tight">
            Book a Session
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 mt-0.5">
            with{" "}
            <span className="font-semibold text-zinc-700">{mentorName}</span>
          </DialogDescription>
        </div>

        {/* ── Scrollable body ──────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">
          {/* Subject + Duration — stack on mobile, side-by-side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Subject
              </p>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="h-11 w-full">
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

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Duration
              </p>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
              >
                <SelectTrigger className="h-11 w-full">
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

          {/* Session type pill */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-700">
              Individual Session
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              For group sessions, see{" "}
              <a
                href="/sessions/open"
                className="text-blue-600 underline underline-offset-2"
              >
                Open Sessions
              </a>
              .
            </p>
          </div>

          {/* ── Date picker ─────────────────────────────────────── */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Select a Date
            </p>

            {availability && availability.length > 0 ? (
              /*
               * grid-cols-4 on mobile (~320 px) gives ~60 px per chip — fits "Mon / 10"
               * grid-cols-7 on sm+ shows a full week per row
               */
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {next14Days.map((d) => {
                  const hasAvail = daysWithAvail.has(d.dayOfWeek);
                  const isSelected = d.iso === selectedDate;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      disabled={!hasAvail}
                      onClick={() => {
                        setSelectedDate(d.iso);
                        setSessionAt("");
                      }}
                      className={[
                        "flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 transition-all duration-150 select-none touch-manipulation",
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : hasAvail
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 active:scale-95"
                            : "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed",
                      ].join(" ")}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                        {d.weekday}
                      </span>
                      <span className="text-[15px] font-bold leading-snug mt-0.5">
                        {d.day}
                      </span>
                      <span className="text-[9px] leading-none opacity-70">
                        {d.month}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs text-amber-700">
                  This mentor hasn't configured their availability yet. Pick a
                  custom date and time below.
                </p>
              </div>
            )}
          </div>

          {/* ── Time slots ──────────────────────────────────────── */}
          {selectedDate && slotsForSelectedDate.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Available Time Slots
              </p>

              {/*
               * 2 cols on mobile, 3 cols on sm+
               * Each button is equal height via py-3 and full-width via the grid cell
               */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slotsForSelectedDate.map((time) => {
                  const isBooked = bookedSlots.has(time);
                  const isSelected = sessionAt === `${selectedDate}T${time}`;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleSelectSlot(time)}
                      className={[
                        "rounded-xl border py-3 text-sm font-semibold transition-all duration-150 select-none touch-manipulation w-full",
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : isBooked
                            ? "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed line-through"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 shadow-xs",
                      ].join(" ")}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 pt-0.5">
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-zinc-300 inline-block border border-zinc-200" />
                  Available
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                  Selected
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-zinc-200 inline-block" />
                  Booked
                </span>
              </div>
            </div>
          )}

          {/* No slots on this day */}
          {selectedDate && slotsForSelectedDate.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">
                No available slots on this day. Try another date.
              </p>
            </div>
          )}

          {/* Fallback manual datetime input when mentor has no availability set */}
          {(!availability || availability.length === 0) && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Date &amp; Time
              </p>
              <Input
                type="datetime-local"
                value={sessionAt}
                onChange={(e) => setSessionAt(e.target.value)}
                className="h-11 w-full"
              />
            </div>
          )}

          {/* Conflict warning */}
          {hasConflict && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-700 font-medium">
                ⚠ This time overlaps with an existing session. Please choose a
                different slot.
              </p>
            </div>
          )}
        </div>

        {/* ── Sticky footer ──────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-4 shrink-0 border-t border-zinc-100 bg-white">
          {/* Stack vertically on mobile (Book on top), inline on sm+ */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !subjectId || !sessionAt || hasConflict || bookSession.isPending
              }
              className="w-full sm:w-auto"
            >
              {bookSession.isPending ? "Booking…" : "Book Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
