import {
  useCurrentMentor,
  useCreateMentor,
  useUpdateMentor,
  useUploadMentorProfileImage,
  useUploadMentorCoverImage,
} from "@/hooks/use-queries";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageSpinner } from "@/components/ui/spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Camera, Star } from "lucide-react";

const profileSchema = z.object({
  phoneNumber: z
    .string()
    .regex(
      /^(\+[1-9]\d{7,14}|0[7][0-9]{8})$/,
      "Enter a valid phone number (e.g. 0712345678 or +447911123456)",
    ),
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
  hourlyRate: z
    .number()
    .min(0.01, "Hourly rate must be greater than 0")
    .max(100000, "Hourly rate too high"),
  bankAccountName: z
    .string()
    .min(2, "Bank account name is required")
    .max(100, "Too long"),
  bankAccountNumber: z
    .string()
    .min(5, "Bank account number is required")
    .max(30, "Too long"),
  bankName: z.string().min(2, "Bank name is required").max(100, "Too long"),
  linkedinUrl: z
    .string()
    .url("Enter a valid URL (e.g. https://linkedin.com/in/you)")
    .or(z.literal(""))
    .optional(),
  githubUrl: z
    .string()
    .url("Enter a valid URL (e.g. https://github.com/you)")
    .or(z.literal(""))
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MentorProfilePage() {
  const { user } = useUser();
  const { mentor, isLoading, notFound } = useCurrentMentor();
  const createMentor = useCreateMentor();
  const updateMentor = useUpdateMentor();
  const uploadProfileMut = useUploadMentorProfileImage();
  const uploadCoverMut = useUploadMentorCoverImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = mentor?.profileImageUrl ?? user?.imageUrl ?? undefined;
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
      hourlyRate: 0,
      bankAccountName: "",
      bankAccountNumber: "",
      bankName: "",
      linkedinUrl: "",
      githubUrl: "",
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
        hourlyRate: mentor.hourlyRate ?? 0,
        bankAccountName: mentor.bankAccountName ?? "",
        bankAccountNumber: mentor.bankAccountNumber ?? "",
        bankName: mentor.bankName ?? "",
        linkedinUrl: mentor.linkedinUrl ?? "",
        githubUrl: mentor.githubUrl ?? "",
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
    return <PageSpinner />;
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

      {/* Images — only shown when editing an existing profile */}
      {mentor && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover photo */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2">
                Cover Photo
              </p>
              <div className="relative h-48 rounded-xl overflow-hidden">
                {mentor.coverImageUrl ? (
                  <img
                    src={mentor.coverImageUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-600" />
                )}
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadCoverMut.isPending}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 text-white text-xs px-3 py-1.5 hover:bg-black/80 transition-colors disabled:opacity-60"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {uploadCoverMut.isPending ? "Uploading…" : "Edit cover"}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const MAX = 10 * 1024 * 1024;
                    if (file.size > MAX) {
                      toast.error("Cover image is too large. Max 10 MB.");
                      e.target.value = "";
                      return;
                    }
                    uploadCoverMut.mutate({ id: mentor.id, file });
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {/* Profile picture */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2">
                Profile Picture
              </p>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-16 w-16 ring-2 ring-zinc-200">
                    <AvatarImage src={avatarSrc} alt={mentor.fullName ?? ""} />
                    <AvatarFallback className="text-lg font-bold bg-zinc-200 text-zinc-700">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProfileMut.isPending}
                    className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-md hover:bg-zinc-700 transition-colors disabled:opacity-60"
                  >
                    {uploadProfileMut.isPending ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      uploadProfileMut.mutate({ id: mentor.id, file });
                      e.target.value = "";
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {mentor.fullName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Your Clerk profile photo is used by default. Upload a custom
                    photo to override it.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="07XX XXX XXXX"
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

            {/* Pricing & Bank Details */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-zinc-800 mb-3">
                Pricing & Bank Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Hourly Rate (LKR)"
                  error={errors.hourlyRate?.message}
                >
                  <Input
                    {...register("hourlyRate", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="1500.00"
                  />
                </Field>
                <Field label="Bank Name" error={errors.bankName?.message}>
                  <Input
                    {...register("bankName")}
                    placeholder="e.g. Bank of Ceylon"
                  />
                </Field>
                <Field
                  label="Account Holder Name"
                  error={errors.bankAccountName?.message}
                >
                  <Input
                    {...register("bankAccountName")}
                    placeholder="Full name on bank account"
                  />
                </Field>
                <Field
                  label="Account Number"
                  error={errors.bankAccountNumber?.message}
                >
                  <Input
                    {...register("bankAccountNumber")}
                    placeholder="0123456789"
                  />
                </Field>
              </div>
            </div>

            {/* Social Profiles */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-zinc-800 mb-3">
                Social Profiles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="LinkedIn"
                  error={errors.linkedinUrl?.message}
                  optional
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 fill-[#0A66C2]"
                        aria-hidden="true"
                      >
                        <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.984V9h3.102v1.561h.043c.432-.82 1.489-1.685 3.065-1.685 3.276 0 3.881 2.156 3.881 4.959v6.617zM5.337 7.433a1.8 1.8 0 1 1 0-3.601 1.8 1.8 0 0 1 0 3.601zm1.558 13.019H3.779V9h3.116v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </span>
                    <Input
                      {...register("linkedinUrl")}
                      className="pl-9"
                      placeholder="https://linkedin.com/in/yourname"
                    />
                  </div>
                </Field>
                <Field
                  label="GitHub"
                  error={errors.githubUrl?.message}
                  optional
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 fill-zinc-900"
                        aria-hidden="true"
                      >
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                    </span>
                    <Input
                      {...register("githubUrl")}
                      className="pl-9"
                      placeholder="https://github.com/yourname"
                    />
                  </div>
                </Field>
              </div>
            </div>

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
