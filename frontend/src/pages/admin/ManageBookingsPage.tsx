import { useState } from "react";
import {
  useSessions,
  useUpdateSession,
  useDeleteSession,
} from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import type { SessionDTO, SessionStatus } from "@/types";

const STATUS_OPTIONS: SessionStatus[] = [
  "PENDING",
  "SCHEDULED",
  "STARTED",
  "COMPLETED",
  "CANCELED",
];

const statusColor: Record<SessionStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  STARTED: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELED: "bg-red-50 text-red-700",
};

export default function ManageBookingsPage() {
  const { data: sessions, isLoading } = useSessions();
  const updateMut = useUpdateSession();
  const deleteMut = useDeleteSession();

  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [editingSession, setEditingSession] = useState<SessionDTO | null>(null);

  // Edit form
  const [editStatus, setEditStatus] = useState<SessionStatus>("PENDING");
  const [editLink, setEditLink] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const openEdit = (s: SessionDTO) => {
    setEditingSession(s);
    setEditStatus(s.sessionStatus);
    setEditLink(s.meetingLink ?? "");
    setEditNotes(s.sessionNotes ?? "");
  };

  const handleUpdate = () => {
    if (!editingSession) return;
    updateMut.mutate(
      {
        id: editingSession.id,
        data: {
          sessionStatus: editStatus,
          sessionType: editingSession.sessionType,
          meetingLink: editLink || undefined,
          sessionNotes: editNotes || undefined,
        },
      },
      { onSuccess: () => setEditingSession(null) },
    );
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this booking?")) deleteMut.mutate(id);
  };

  const filtered = sessions
    ?.filter((s) => tab === "ALL" || s.sessionStatus === tab)
    .filter(
      (s) =>
        s.mentorName.toLowerCase().includes(search.toLowerCase()) ||
        s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
        String(s.id).includes(search),
    );

  const SessionTable = ({ items }: { items: SessionDTO[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="pb-3 font-medium">ID</th>
            <th className="pb-3 font-medium">Mentor</th>
            <th className="pb-3 font-medium">Subject</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Duration</th>
            <th className="pb-3 font-medium">Link</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((s) => (
            <tr key={s.id} className="text-zinc-700">
              <td className="py-3">#{s.id}</td>
              <td className="py-3">{s.mentorName}</td>
              <td className="py-3">{s.subjectName}</td>
              <td className="py-3">{s.sessionType}</td>
              <td className="py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[s.sessionStatus]}`}
                >
                  {s.sessionStatus}
                </span>
              </td>
              <td className="py-3 whitespace-nowrap">
                {new Date(s.sessionAt).toLocaleDateString()}{" "}
                <span className="text-zinc-400">
                  {new Date(s.sessionAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </td>
              <td className="py-3">{s.durationMinutes}m</td>
              <td className="py-3">
                {s.meetingLink ? (
                  <a
                    href={s.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Open
                  </a>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
              <td className="py-3 text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage all session bookings.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by mentor, subject or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          {STATUS_OPTIONS.map((st) => (
            <TabsTrigger key={st} value={st} className="capitalize">
              {st.charAt(0) + st.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {tab === "ALL"
                  ? "All"
                  : tab.charAt(0) + tab.slice(1).toLowerCase()}{" "}
                Bookings ({filtered?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filtered && filtered.length > 0 ? (
                // eslint-disable-next-line react-hooks/static-components
                <SessionTable items={filtered} />
              ) : (
                <p className="text-sm text-zinc-500 py-6 text-center">
                  No bookings found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog
        open={!!editingSession}
        onOpenChange={(o) => {
          if (!o) setEditingSession(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Booking #{editingSession?.id}</DialogTitle>
            <DialogDescription>
              Update session status, add a meeting link, or leave notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editStatus}
                onValueChange={(v) => setEditStatus(v as SessionStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="https://meet.google.com/…"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Admin notes…"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMut.isPending}>
              {updateMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
