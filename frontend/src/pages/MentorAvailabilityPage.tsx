import { useState } from "react";
import {
  useCurrentMentor,
  useMentorAvailability,
  useSetMentorAvailability,
} from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSpinner } from "@/components/ui/spinner";
import { Clock, Plus, Save, Trash2 } from "lucide-react";
import type { CreateMentorAvailabilityDTO, DayOfWeek } from "@/types";

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

interface SlotRow {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function MentorAvailabilityPage() {
  const { mentor, isLoading: mentorLoading } = useCurrentMentor();
  const mentorId = mentor?.id ?? 0;
  const { data: existing, isLoading: avLoading } =
    useMentorAvailability(mentorId);
  const saveMut = useSetMentorAvailability();

  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Seed slots from server once loaded
  if (existing && !initialized) {
    if (existing.length > 0) {
      setSlots(
        existing.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive,
        })),
      );
    } else {
      // Default: Mon-Fri 09:00-17:00
      setSlots(
        DAYS.filter((d) => d !== "SATURDAY" && d !== "SUNDAY").map((d) => ({
          dayOfWeek: d,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        })),
      );
    }
    setInitialized(true);
  }

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      {
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
    ]);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (
    idx: number,
    field: keyof SlotRow,
    value: string | boolean,
  ) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  };

  const handleSave = () => {
    const payload: CreateMentorAvailabilityDTO[] = slots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: s.isActive,
    }));
    saveMut.mutate({ mentorId, slots: payload });
  };

  if (mentorLoading || avLoading) return <PageSpinner />;

  return (
    <div className="py-10 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-3xl px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="h-6 w-6" /> Availability Schedule
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Set your weekly availability so students know when you're open for
            bookings.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Weekly Slots</CardTitle>
            <Button size="sm" variant="outline" onClick={addSlot}>
              <Plus className="h-4 w-4 mr-1" /> Add Slot
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {slots.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-6">
                No availability slots configured. Click "Add Slot" to get
                started.
              </p>
            )}

            {slots.map((slot, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-end gap-3 p-3 bg-white border rounded-lg"
              >
                {/* Day */}
                <div className="space-y-1 min-w-35">
                  <Label className="text-xs">Day</Label>
                  <select
                    className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
                    value={slot.dayOfWeek}
                    onChange={(e) =>
                      updateSlot(idx, "dayOfWeek", e.target.value)
                    }
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start */}
                <div className="space-y-1">
                  <Label className="text-xs">Start</Label>
                  <Input
                    type="time"
                    className="w-28"
                    value={slot.startTime}
                    onChange={(e) =>
                      updateSlot(idx, "startTime", e.target.value)
                    }
                  />
                </div>

                {/* End */}
                <div className="space-y-1">
                  <Label className="text-xs">End</Label>
                  <Input
                    type="time"
                    className="w-28"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(idx, "endTime", e.target.value)}
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={slot.isActive}
                    onChange={(e) =>
                      updateSlot(idx, "isActive", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="text-xs text-zinc-500">
                    {slot.isActive ? "Active" : "Off"}
                  </span>
                </div>

                {/* Remove */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 h-8 w-8"
                  onClick={() => removeSlot(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={saveMut.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMut.isPending ? "Saving…" : "Save Availability"}
        </Button>
      </div>
    </div>
  );
}
