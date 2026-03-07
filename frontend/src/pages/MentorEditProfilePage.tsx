import {
  useCurrentMentor,
  useCreateMentor,
  useUpdateMentor,
} from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";

const profileSchema = z.object({
  phoneNumber: z
    .string()
    .min(7, "Phone number must be at least 7 characters")
    .max(20, "Phone number too long"),
  title: z.string().min(2, "Title is required").max(20, "Title too long"),
  profession: z
    .string()
    .min(2, "Profession is required")
    .max(50, "Profession too long"),
  company: z.string().min(2, "Company is required").max(60, "Company too long"),
  experienceYears: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(50, "Must be ≤ 50"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MentorProfilePage() {
  const { mentor, isLoading, notFound } = useCurrentMentor();
  const createMentor = useCreateMentor();
  const updateMentor = useUpdateMentor();

  const isCreateMode = notFound;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phoneNumber: "",
      title: "",
      profession: "",
      company: "",
      experienceYears: 0,
      bio: "",
    },
  });

  // Pre-fill form when mentor data loads (edit mode)
  useEffect(() => {
    if (mentor) {
      reset({
        phoneNumber: mentor.phoneNumber ?? "",
        title: mentor.title ?? "",
        profession: mentor.profession ?? "",
        company: mentor.company ?? "",
        experienceYears: mentor.experienceYears ?? 0,
        bio: mentor.bio ?? "",
      });
    }
  }, [mentor, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      if (isCreateMode) {
        await createMentor.mutateAsync(data);
        toast.success("Mentor profile created successfully!");
      } else if (mentor) {
        await updateMentor.mutateAsync({ id: mentor.id, data });
        toast.success("Profile updated successfully.");
      }
    } catch {
      // error toast handled by mutation
    }
  };

  const isSaving = createMentor.isPending || updateMentor.isPending;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          {isCreateMode ? "Create Your Mentor Profile" : "Mentor Profile"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {isCreateMode
            ? "Fill in your details to set up your mentor profile."
            : "Update your profile information visible to students."}
        </p>
      </div>

      {/* Stats summary — only in edit mode */}
      {mentor && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-zinc-500">Rating</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold text-zinc-900">
                  {mentor.averageRating?.toFixed(1) ?? "—"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-zinc-500">Reviews</p>
              <p className="text-lg font-bold text-zinc-900 mt-1">
                {mentor.totalReviews ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-zinc-500">Experience</p>
              <p className="text-lg font-bold text-zinc-900 mt-1">
                {mentor.experienceYears ?? 0} yrs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-zinc-500">Member Since</p>
              <p className="text-lg font-bold text-zinc-900 mt-1">
                {mentor.createdAt
                  ? new Date(mentor.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title" error={errors.title?.message}>
                <Input {...register("title")} placeholder="Senior Engineer" />
              </Field>
              <Field label="Phone Number" error={errors.phoneNumber?.message}>
                <Input
                  {...register("phoneNumber")}
                  placeholder="+94 7X XXX XXXX"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Profession" error={errors.profession?.message}>
                <Input
                  {...register("profession")}
                  placeholder="Software Engineer"
                />
              </Field>
              <Field label="Company" error={errors.company?.message}>
                <Input {...register("company")} placeholder="Acme Corp" />
              </Field>
              <Field
                label="Years of Experience"
                error={errors.experienceYears?.message}
              >
                <Input
                  {...register("experienceYears", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  max={50}
                  placeholder="5"
                />
              </Field>
            </div>

            <Field label="Bio" error={errors.bio?.message} optional>
              <textarea
                {...register("bio")}
                rows={4}
                placeholder="Tell students about yourself..."
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 resize-none"
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-2">
              {!isCreateMode && isDirty && (
                <p className="text-xs text-zinc-400">Unsaved changes</p>
              )}
              <Button
                type="submit"
                disabled={isSaving || (!isCreateMode && !isDirty)}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isCreateMode ? "Creating…" : "Saving…"}
                  </span>
                ) : isCreateMode ? (
                  "Create Profile"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-zinc-700">
        {label}
        {optional && (
          <span className="text-xs font-normal text-zinc-400">(optional)</span>
        )}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
