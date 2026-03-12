import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  useSessions,
  useUpdateSession,
  useDeleteSession,
  useApproveSession,
  useCompleteSession,
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
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { SessionDTO, SessionStatus, ReceiptStatus } from "@/types";

const PAGE_SIZE = 15;

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

const receiptColor: Record<ReceiptStatus, string> = {
  NONE: "bg-zinc-100 text-zinc-500",
  SUBMITTED: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default function ManageBookingsPage() {
  const { data: sessions, isLoading } = useSessions();
  const updateMut = useUpdateSession();
  const deleteMut = useDeleteSession();
  const approveMut = useApproveSession();
  const completeMut = useCompleteSession();

  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [editingSession, setEditingSession] = useState<SessionDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmPayment, setConfirmPayment] = useState<SessionDTO | null>(null);
  const [confirmComplete, setConfirmComplete] = useState<SessionDTO | null>(null);

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

  const handleDelete = (id: number) => setConfirmDelete(id);

  const handleConfirmPayment = (s: SessionDTO) => setConfirmPayment(s);

  const handleMarkComplete = (s: SessionDTO) => setConfirmComplete(s);

  const q = search.toLowerCase();
  const filtered = sessions
    ?.filter((s) => tab === "ALL" || s.sessionStatus === tab)
    .filter((s) => {
      if (!q) return true;
      return (
        s.mentorName.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q) ||
        (s.studentName ?? "").toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    })
    .filter((s) => {
      if (!dateFrom && !dateTo) return true;
      const d = new Date(s.sessionAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });

  const totalPages = Math.max(
    1,
    Math.ceil((filtered?.length ?? 0) / PAGE_SIZE),
  );
  const paginated = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage all session bookings.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Input
          placeholder="Search by mentor, student, subject or ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              resetPage();
            }}
            className="w-40"
          />
          <span className="text-zinc-400 text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              resetPage();
            }}
            className="w-40"
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                resetPage();
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          resetPage();
        }}
      >
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
                <div className="flex justify-center py-8">
                  <Spinner className="h-6 w-6 text-zinc-400" />
                </div>
              ) : paginated && paginated.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-zinc-500">
                          <th className="pb-3 font-medium">ID</th>
                          <th className="pb-3 font-medium">Student</th>
                          <th className="pb-3 font-medium">Mentor</th>
                          <th className="pb-3 font-medium">Subject</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Payment</th>
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">Duration</th>
                          <th className="pb-3 font-medium">Link</th>
                          <th className="pb-3 font-medium text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginated.map((s) => (
                          <tr key={s.id} className="text-zinc-700">
                            <td className="py-3">#{s.id}</td>
                            <td className="py-3 max-w-30 truncate">
                              {s.studentName ??
                                s.studentNames?.join(", ") ??
                                "—"}
                            </td>
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
                            <td className="py-3">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${receiptColor[s.receiptStatus ?? "NONE"]}`}
                              >
                                {s.receiptStatus ?? "NONE"}
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
                                {s.receiptStatus === "SUBMITTED" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-50"
                                    disabled={approveMut.isPending}
                                    onClick={() => handleConfirmPayment(s)}
                                    title="Confirm Payment Receipt"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Confirm
                                  </Button>
                                )}
                                {(s.sessionStatus === "SCHEDULED" ||
                                  s.sessionStatus === "STARTED") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50"
                                    disabled={completeMut.isPending}
                                    onClick={() => handleMarkComplete(s)}
                                    title="Mark as Completed"
                                  >
                                    Complete
                                  </Button>
                                )}
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                      <p className="text-xs text-zinc-500">
                        Showing {(page - 1) * PAGE_SIZE + 1}–
                        {Math.min(page * PAGE_SIZE, filtered?.length ?? 0)} of{" "}
                        {filtered?.length ?? 0}
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
                        <span className="text-xs font-medium text-zinc-600">
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
                </>
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

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Delete Booking"
        description="This action cannot be undone. Are you sure you want to delete this booking?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (confirmDelete !== null) deleteMut.mutate(confirmDelete); }}
        isPending={deleteMut.isPending}
      />

      <ConfirmDialog
        open={confirmPayment !== null}
        onOpenChange={(o) => { if (!o) setConfirmPayment(null); }}
        title="Confirm Payment"
        description={`Confirm payment receipt for booking #${confirmPayment?.id}?`}
        confirmLabel="Confirm"
        variant="default"
        onConfirm={() => {
          if (confirmPayment) {
            approveMut.mutate({ id: confirmPayment.id, data: { meetingLink: confirmPayment.meetingLink ?? "" } });
          }
        }}
        isPending={approveMut.isPending}
      />

      <ConfirmDialog
        open={confirmComplete !== null}
        onOpenChange={(o) => { if (!o) setConfirmComplete(null); }}
        title="Mark as Completed"
        description={`Mark booking #${confirmComplete?.id} as completed?`}
        confirmLabel="Complete"
        variant="default"
        onConfirm={() => { if (confirmComplete) completeMut.mutate({ id: confirmComplete.id }); }}
        isPending={completeMut.isPending}
      />
    </div>
  );
}
