import { useRef, useState } from "react";
import {
  useCurrentMentor,
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useUploadSubjectThumbnail,
} from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner, PageSpinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import type { SubjectDTO } from "@/types";

const PAGE_SIZE = 6;

/* ── Thumbnail upload widget ─────────────────────────────────────────────── */
interface ThumbnailPickerProps {
  value: File | null;
  onChange: (f: File | null) => void;
  currentUrl?: string | null;
}

function ThumbnailPicker({
  value,
  onChange,
  currentUrl,
}: ThumbnailPickerProps) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = value ? URL.createObjectURL(value) : (currentUrl ?? null);

  return (
    <div className="space-y-1.5">
      <Label>Thumbnail image</Label>
      <div
        className="relative group border-2 border-dashed border-zinc-200 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-400 transition-colors bg-zinc-50"
        style={{ aspectRatio: "16/7" }}
        onClick={() => ref.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="thumbnail preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-sm font-medium">Click to change</p>
            </div>
            {value && (
              <button
                type="button"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 transition shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                  if (ref.current) ref.current.value = "";
                }}
              >
                <X className="h-3.5 w-3.5 text-zinc-700" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <ImagePlus className="h-8 w-8" />
            <p className="text-xs">
              Click to upload (JPG, PNG, WEBP — max 10 MB)
            </p>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export default function MentorSubjectsPage() {
  const { mentor, isLoading: mentorLoading, notFound } = useCurrentMentor();
  const { data: allSubjects, isLoading } = useSubjects();
  const createMut = useCreateSubject();
  const updateMut = useUpdateSubject();
  const deleteMut = useDeleteSubject();
  const uploadMut = useUploadSubjectThumbnail();

  const mySubjects =
    allSubjects?.filter((s) => s.mentorId === mentor?.id) ?? [];

  // ── Pagination ───────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(mySubjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSubjects = mySubjects.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  // ── Create dialog state ──────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createThumb, setCreateThumb] = useState<File | null>(null);

  const handleCreate = () => {
    if (!mentor || !createName.trim()) return;
    createMut.mutate(
      {
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        category: createCategory.trim() || undefined,
        mentorId: mentor.id,
      },
      {
        onSuccess: (created) => {
          if (createThumb) {
            uploadMut.mutate({ id: created.id, file: createThumb });
          }
          setCreateOpen(false);
          setCreateName("");
          setCreateDesc("");
          setCreateCategory("");
          setCreateThumb(null);
        },
      },
    );
  };

  // ── Edit dialog state ────────────────────────────────────────────────
  const [editSubject, setEditSubject] = useState<SubjectDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editThumb, setEditThumb] = useState<File | null>(null);

  const openEdit = (s: SubjectDTO) => {
    setEditSubject(s);
    setEditName(s.subjectName);
    setEditDesc(s.description ?? "");
    setEditCategory(s.category ?? "");
    setEditThumb(null);
  };

  const handleEdit = () => {
    if (!editSubject || !editName.trim()) return;
    updateMut.mutate(
      {
        id: editSubject.id,
        data: {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          category: editCategory.trim() || undefined,
        },
      },
      {
        onSuccess: (updated) => {
          if (editThumb) {
            uploadMut.mutate({ id: updated.id, file: editThumb });
          }
          setEditSubject(null);
          setEditThumb(null);
        },
      },
    );
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    if (
      !confirm(
        "Delete this subject? Any sessions linked to it may be affected.",
      )
    )
      return;
    deleteMut.mutate(id);
  };

  if (mentorLoading) {
    return <PageSpinner />;
  }

  if (notFound) {
    return (
      <div className="py-24 text-center space-y-4">
        <BookOpen className="mx-auto h-12 w-12 text-zinc-300" />
        <p className="text-zinc-500">
          You need to create your mentor profile before managing subjects.
        </p>
        <a href="/mentor/profile">
          <Button>Create Profile</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">My Subjects</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Create and manage the subjects you teach.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </div>

        {/* Subject grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-zinc-400" />
          </div>
        ) : mySubjects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
              <p className="text-zinc-500 font-medium">No subjects yet</p>
              <p className="text-sm text-zinc-400 mt-1">
                Add your first subject to start creating sessions.
              </p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Subject
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pagination info */}
            <p className="text-sm text-zinc-500">
              Showing {safePage * PAGE_SIZE + 1}–
              {Math.min((safePage + 1) * PAGE_SIZE, mySubjects.length)} of{" "}
              {mySubjects.length} subject{mySubjects.length !== 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageSubjects.map((s) => (
                <Card key={s.id} className="overflow-hidden flex flex-col">
                  {/* Thumbnail */}
                  <div className="h-44 bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
                    {s.thumbnailUrl ? (
                      <img
                        src={s.thumbnailUrl}
                        alt={s.subjectName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-10 w-10 text-zinc-300" />
                    )}
                  </div>

                  <CardContent className="p-4 flex-1 space-y-1">
                    <p className="font-semibold text-zinc-900 truncate">
                      {s.subjectName}
                    </p>
                    {s.description && (
                      <p className="text-sm text-zinc-500 line-clamp-3">
                        {s.description}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="px-4 pb-4 pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => handleDelete(s.id)}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={safePage === i ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={safePage === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create dialog ─────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Add a subject that you teach. You can link it to sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cn">Subject name *</Label>
              <Input
                id="cn"
                placeholder="e.g. React Fundamentals"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cd">Description</Label>
              <Textarea
                id="cd"
                placeholder="What will students learn?"
                rows={4}
                className="resize-none"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc">Category</Label>
              <Input
                id="cc"
                placeholder="e.g. Programming, Design, Marketing"
                value={createCategory}
                onChange={(e) => setCreateCategory(e.target.value)}
              />
            </div>
            <ThumbnailPicker value={createThumb} onChange={setCreateThumb} />
          </div>
          <DialogFooter className="shrink-0 mt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !createName.trim() || createMut.isPending || uploadMut.isPending
              }
            >
              {createMut.isPending || uploadMut.isPending
                ? "Creating…"
                : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={!!editSubject}
        onOpenChange={(o) => !o && setEditSubject(null)}
      >
        <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="en">Subject name *</Label>
              <Input
                id="en"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed">Description</Label>
              <Textarea
                id="ed"
                rows={4}
                className="resize-none"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec">Category</Label>
              <Input
                id="ec"
                placeholder="e.g. Programming, Design, Marketing"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              />
            </div>
            <ThumbnailPicker
              value={editThumb}
              onChange={setEditThumb}
              currentUrl={editSubject?.thumbnailUrl}
            />
          </div>
          <DialogFooter className="shrink-0 mt-2">
            <Button variant="outline" onClick={() => setEditSubject(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !editName.trim() || updateMut.isPending || uploadMut.isPending
              }
            >
              {updateMut.isPending || uploadMut.isPending
                ? "Saving…"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
