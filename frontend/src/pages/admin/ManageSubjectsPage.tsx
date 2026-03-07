import { useState } from "react";
import {
  useSubjects,
  useDeleteSubject,
  useMentors,
  useCreateSubject,
  useUpdateSubject,
} from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { SubjectDTO } from "@/types";

export default function ManageSubjectsPage() {
  const { data: subjects, isLoading } = useSubjects();
  const { data: mentors } = useMentors();
  const createMut = useCreateSubject();
  const updateMut = useUpdateSubject();
  const deleteMut = useDeleteSubject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectDTO | null>(null);
  const [search, setSearch] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mentorId, setMentorId] = useState<string>("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setMentorId("");
    setEditingSubject(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (s: SubjectDTO) => {
    setEditingSubject(s);
    setName(s.subjectName);
    setDescription(s.description ?? "");
    setMentorId(String(s.mentorId));
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingSubject) {
      updateMut.mutate(
        {
          id: editingSubject.id,
          data: { name, description: description || undefined },
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            resetForm();
          },
        },
      );
    } else {
      createMut.mutate(
        {
          name,
          description: description || undefined,
          mentorId: Number(mentorId),
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            resetForm();
          },
        },
      );
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this subject?")) deleteMut.mutate(id);
  };

  const filtered = subjects?.filter(
    (s) =>
      s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      s.mentorName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Subjects</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage all subjects on the platform.
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Edit Subject" : "New Subject"}
              </DialogTitle>
              <DialogDescription>
                {editingSubject
                  ? "Update subject details."
                  : "Fill in the details to create a new subject."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Data Structures"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="Brief description…"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {!editingSubject && (
                <div className="space-y-2">
                  <Label>Assign Mentor</Label>
                  <Select value={mentorId} onValueChange={setMentorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mentor…" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors?.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.fullName} — {m.profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !name ||
                  (!editingSubject && !mentorId) ||
                  createMut.isPending ||
                  updateMut.isPending
                }
              >
                {createMut.isPending || updateMut.isPending
                  ? "Saving…"
                  : editingSubject
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="Search subjects or mentors…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All Subjects ({filtered?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6 text-zinc-400" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Mentor</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s) => (
                    <tr key={s.id} className="text-zinc-700">
                      <td className="py-3">#{s.id}</td>
                      <td className="py-3 font-medium">{s.subjectName}</td>
                      <td className="py-3">{s.mentorName}</td>
                      <td className="py-3">
                        {new Date(s.createdAt).toLocaleDateString()}
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
          ) : (
            <p className="text-sm text-zinc-500 py-6 text-center">
              No subjects found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
