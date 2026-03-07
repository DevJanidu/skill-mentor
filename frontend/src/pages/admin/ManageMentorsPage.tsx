import { useState } from "react";
import {
  useMentors,
  useDeleteMentor,
  useCreateMentor,
  useUpdateMentor,
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
import { Spinner } from "@/components/ui/spinner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { MentorDTO, CreateMentorDTO } from "@/types";

const empty: CreateMentorDTO = {
  phoneNumber: "",
  title: "",
  profession: "",
  company: "",
  experienceYears: 0,
  bio: "",
};

export default function ManageMentorsPage() {
  const { data: mentors, isLoading } = useMentors();
  const createMut = useCreateMentor();
  const updateMut = useUpdateMentor();
  const deleteMut = useDeleteMentor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MentorDTO | null>(null);
  const [form, setForm] = useState<CreateMentorDTO>(empty);
  const [search, setSearch] = useState("");

  const resetForm = () => {
    setForm(empty);
    setEditing(null);
  };
  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (m: MentorDTO) => {
    setEditing(m);
    setForm({
      phoneNumber: m.phoneNumber,
      title: m.title,
      profession: m.profession,
      company: m.company,
      experienceYears: m.experienceYears,
      bio: m.bio ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = { ...form, bio: form.bio || undefined };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            setDialogOpen(false);
            resetForm();
          },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this mentor?")) deleteMut.mutate(id);
  };

  const filtered = mentors?.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.profession.toLowerCase().includes(search.toLowerCase()) ||
      m.company.toLowerCase().includes(search.toLowerCase()),
  );

  const setField = <K extends keyof CreateMentorDTO>(
    key: K,
    value: CreateMentorDTO[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mentors</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage mentor profiles.</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Mentor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Mentor" : "New Mentor"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update the mentor's details below."
                  : "The user must already be synced & onboarded with the MENTOR role."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Mr."
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+94 7XX…"
                    value={form.phoneNumber}
                    onChange={(e) => setField("phoneNumber", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profession</Label>
                  <Input
                    placeholder="Software Engineer"
                    value={form.profession}
                    onChange={(e) => setField("profession", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    placeholder="Google"
                    value={form.company}
                    onChange={(e) => setField("company", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Experience (years)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.experienceYears}
                  onChange={(e) =>
                    setField("experienceYears", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  placeholder="Short bio…"
                  value={form.bio ?? ""}
                  onChange={(e) => setField("bio", e.target.value)}
                />
              </div>
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
                  !form.title ||
                  !form.phoneNumber ||
                  !form.profession ||
                  !form.company ||
                  createMut.isPending ||
                  updateMut.isPending
                }
              >
                {createMut.isPending || updateMut.isPending
                  ? "Saving…"
                  : editing
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search mentors…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All Mentors ({filtered?.length ?? 0})
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
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Profession</th>
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Exp</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((m) => (
                    <tr key={m.id} className="text-zinc-700">
                      <td className="py-3">#{m.id}</td>
                      <td className="py-3 font-medium">{m.fullName}</td>
                      <td className="py-3">{m.profession}</td>
                      <td className="py-3">{m.company}</td>
                      <td className="py-3">{m.experienceYears}y</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(m.id)}
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
              No mentors found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
