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
    .min(7, "Phone number must be at least 7 characters")
    .max(20, "Phone number too long"),
  title: z.string().min(2, "Title is required").max(100),
  profession: z.string().min(2, "Profession is required").max(100),
  company: z.string().min(2, "Company is required").max(100),
  experienceYears: z
    .number({ error: "Enter a valid number" })
    .int()
    .min(0, "Experience cannot be negative")
    .max(60, "Must be ≤ 60 years"),
  bio: z.string().max(500).optional(),
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
              placeholder="+1 555 000 0000"
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

  // Already onboarded → redirect
  const existingRoles = user
    ? getRoles(user.publicMetadata as Record<string, unknown>)
    : [];
  if (isLoaded && user && existingRoles.length > 0) {
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
