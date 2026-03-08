import { useUser } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  useCompleteOnboarding,
  useCreateMentor,
  useCreateStudent,
  useSyncUser,
} from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import { getRoles } from "@/lib/roles";
import type { UserRole } from "@/types";

// ─── Role options ────────────────────────────────────────────────────────────

const ROLE_OPTIONS: {
  role: Extract<UserRole, "STUDENT" | "MENTOR">;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}[] = [
  {
    role: "STUDENT",
    label: "Student",
    description:
      "Find mentors, book sessions, and accelerate your learning journey.",
    icon: GraduationCap,
  },
  {
    role: "MENTOR",
    label: "Mentor",
    description: "Share your expertise, conduct sessions, and guide students.",
    icon: Users,
  },
];

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const mentorSchema = z.object({
  phoneNumber: z
    .string()
    .regex(
      /^(\+[1-9]\d{7,14}|0[7][0-9]{8})$/,
      "Enter a valid phone number (e.g. 0712345678 or +447911123456)",
    ),
  title: z.string().min(2, "Title is required").max(100),
  profession: z.string().min(2, "Profession is required").max(100),
  company: z.string().min(2, "Company is required").max(100),
  experienceYears: z
    .number({ error: "Enter a valid number" })
    .int()
    .min(0, "Experience cannot be negative")
    .max(60, "Must be ≤ 60 years"),
  bio: z.string().max(500).optional(),
  hourlyRate: z
    .number({ error: "Enter a valid number" })
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

const studentSchema = z.object({
  studentCode: z
    .string()
    .min(3, "Student code must be at least 3 characters")
    .max(20, "Student code too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, - and _ allowed"),
  learningGoals: z.string().max(500).optional(),
});

type MentorFormValues = z.infer<typeof mentorSchema>;
type StudentFormValues = z.infer<typeof studentSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateStudentCode() {
  return `STU-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  error,
  children,
  optional,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
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

// ─── Mentor profile form ──────────────────────────────────────────────────────

function MentorForm({
  onBack,
  onSubmit,
  isPending,
}: {
  onBack: () => void;
  onSubmit: (data: MentorFormValues) => Promise<void>;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MentorFormValues>({ resolver: zodResolver(mentorSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldWrapper
            label="Phone number"
            error={errors.phoneNumber?.message}
          >
            <Input
              {...register("phoneNumber")}
              placeholder="07XX XXX XXXX"
              autoComplete="tel"
            />
          </FieldWrapper>
        </div>
        <FieldWrapper label="Title" error={errors.title?.message}>
          <Input {...register("title")} placeholder="Senior Engineer" />
        </FieldWrapper>
        <FieldWrapper label="Profession" error={errors.profession?.message}>
          <Input {...register("profession")} placeholder="Software Engineer" />
        </FieldWrapper>
        <FieldWrapper label="Company" error={errors.company?.message}>
          <Input {...register("company")} placeholder="Acme Corp" />
        </FieldWrapper>
        <FieldWrapper
          label="Years of experience"
          error={errors.experienceYears?.message}
        >
          <Input
            {...register("experienceYears", { valueAsNumber: true })}
            type="number"
            min={0}
            max={60}
            placeholder="5"
          />
        </FieldWrapper>
        <div className="col-span-2">
          <FieldWrapper label="Bio" error={errors.bio?.message} optional>
            <textarea
              {...register("bio")}
              rows={3}
              placeholder="Tell students a bit about yourself…"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 resize-none"
            />
          </FieldWrapper>
        </div>
        <div className="col-span-2 pt-2">
          <p className="text-sm font-semibold text-zinc-800 mb-2">
            Pricing & Bank Details
          </p>
        </div>
        <FieldWrapper
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
        </FieldWrapper>
        <FieldWrapper label="Bank Name" error={errors.bankName?.message}>
          <Input {...register("bankName")} placeholder="e.g. Bank of Ceylon" />
        </FieldWrapper>
        <FieldWrapper
          label="Account Holder"
          error={errors.bankAccountName?.message}
        >
          <Input
            {...register("bankAccountName")}
            placeholder="Full name on bank account"
          />
        </FieldWrapper>
        <FieldWrapper
          label="Account Number"
          error={errors.bankAccountNumber?.message}
        >
          <Input {...register("bankAccountNumber")} placeholder="0123456789" />
        </FieldWrapper>
        <div className="col-span-2 pt-2">
          <p className="text-sm font-semibold text-zinc-800 mb-2">
            Social Profiles
          </p>
        </div>
        <div className="col-span-2">
          <FieldWrapper
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
                  <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.984V9h3.102v1.561h.043c.432-.82 1.489-1.685 3.065-1.685 3.276 0 3.881 2.156 3.881 4.959v6.617zM5.337 7.433a1.8 1.8 0 1 1 0-3.601 1.8 1.8 0 0 1 0 3.601zm1.558 13.019H3.779V9h3.116v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </span>
              <Input
                {...register("linkedinUrl")}
                className="pl-9"
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>
          </FieldWrapper>
        </div>
        <div className="col-span-2">
          <FieldWrapper
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
          </FieldWrapper>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-none"
          onClick={onBack}
          disabled={isPending}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating your profile…
            </span>
          ) : (
            "Finish setup"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Student profile form ─────────────────────────────────────────────────────

function StudentForm({
  onBack,
  onSubmit,
  isPending,
}: {
  onBack: () => void;
  onSubmit: (data: StudentFormValues) => Promise<void>;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { studentCode: generateStudentCode() },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldWrapper label="Student code" error={errors.studentCode?.message}>
        <Input
          {...register("studentCode")}
          placeholder="STU-AB12"
          className="font-mono"
        />
        <p className="text-xs text-zinc-400 mt-1">
          A unique identifier for your student account. You can edit it above.
        </p>
      </FieldWrapper>
      <FieldWrapper
        label="Learning goals"
        error={errors.learningGoals?.message}
        optional
      >
        <textarea
          {...register("learningGoals")}
          rows={3}
          placeholder="What do you want to learn? e.g. Cloud architecture, system design…"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 resize-none"
        />
      </FieldWrapper>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-none"
          onClick={onBack}
          disabled={isPending}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating your profile…
            </span>
          ) : (
            "Finish setup"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingRolePage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  // Step 1 = role picker, step 2 = profile form
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<Extract<
    UserRole,
    "STUDENT" | "MENTOR"
  > | null>(null);

  const syncUser = useSyncUser();
  const completeOnboarding = useCompleteOnboarding();
  const createMentor = useCreateMentor();
  const createStudent = useCreateStudent();

  const isPending =
    syncUser.isPending ||
    completeOnboarding.isPending ||
    createMentor.isPending ||
    createStudent.isPending;

  // Already onboarded (has STUDENT, MENTOR, or ADMIN role) → redirect away
  const existingRoles = user
    ? getRoles(user.publicMetadata as Record<string, unknown>)
    : [];
  if (
    isLoaded &&
    user &&
    (existingRoles.includes("STUDENT") ||
      existingRoles.includes("MENTOR") ||
      existingRoles.includes("ADMIN"))
  ) {
    if (existingRoles.includes("ADMIN"))
      return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  // ── Step 1 handlers ──────────────────────────────────────────────────────

  const handleRoleContinue = () => {
    if (!selectedRole) {
      toast.error("Please select a role first");
      return;
    }
    setStep(2);
  };

  // ── Step 2: Mentor submit ────────────────────────────────────────────────

  const handleMentorSubmit = async (formData: MentorFormValues) => {
    try {
      // 1. Ensure user exists in DB
      await syncUser.mutateAsync();
      // 2. Set MENTOR role in Clerk + DB
      await completeOnboarding.mutateAsync({ role: "MENTOR" });
      // 3. Reload Clerk session so next getToken() returns JWT with MENTOR role
      await user?.reload();
      // 4. Create mentor profile (interceptor will use fresh JWT with MENTOR role)
      await createMentor.mutateAsync(formData);
      // 5. Final sync to keep DB consistent
      await syncUser.mutateAsync();

      toast.success("Mentor profile created! Welcome to SkillMentor.");
      navigate("/dashboard", { replace: true });
    } catch {
      // onError callbacks in the mutations handle the toast
    }
  };

  // ── Step 2: Student submit ───────────────────────────────────────────────

  const handleStudentSubmit = async (formData: StudentFormValues) => {
    try {
      // 1. Ensure user exists in DB
      await syncUser.mutateAsync();
      // 2. Set STUDENT role in Clerk + DB
      await completeOnboarding.mutateAsync({ role: "STUDENT" });
      // 3. Reload Clerk session so next getToken() returns JWT with STUDENT role
      await user?.reload();
      // 4. Create student profile (interceptor will use fresh JWT with STUDENT role)
      await createStudent.mutateAsync(formData);
      // 5. Final sync to keep DB consistent
      await syncUser.mutateAsync();

      toast.success("Student profile created! Welcome to SkillMentor.");
      navigate("/dashboard", { replace: true });
    } catch {
      // onError callbacks in the mutations handle the toast
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 rounded-full transition-all",
                s === step ? "w-6 bg-zinc-900" : "w-2 bg-zinc-200",
              )}
            />
          ))}
        </div>

        {step === 1 ? (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-zinc-900">
                Choose your role
              </CardTitle>
              <CardDescription>
                Welcome, {user?.firstName}! How would you like to use
                SkillMentor?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {ROLE_OPTIONS.map((opt) => {
                  const active = selectedRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setSelectedRole(opt.role)}
                      className={cn(
                        "flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all",
                        active
                          ? "border-zinc-900 bg-zinc-50 shadow-sm"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg p-2.5",
                          active
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600",
                        )}
                      >
                        <opt.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-900">
                          {opt.label}
                        </p>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                          active ? "border-zinc-900" : "border-zinc-300",
                        )}
                      >
                        {active && (
                          <div className="h-2.5 w-2.5 rounded-full bg-zinc-900" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedRole}
                onClick={handleRoleContinue}
              >
                Continue
              </Button>

              <p className="text-center text-xs text-zinc-400">
                You can update your profile at any time from settings.
              </p>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-zinc-900">
                {selectedRole === "MENTOR"
                  ? "Set up your mentor profile"
                  : "Set up your student profile"}
              </CardTitle>
              <CardDescription>
                {selectedRole === "MENTOR"
                  ? "Tell students about your background and expertise."
                  : "A few details to personalise your learning experience."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRole === "MENTOR" ? (
                <MentorForm
                  onBack={() => setStep(1)}
                  onSubmit={handleMentorSubmit}
                  isPending={isPending}
                />
              ) : (
                <StudentForm
                  onBack={() => setStep(1)}
                  onSubmit={handleStudentSubmit}
                  isPending={isPending}
                />
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
