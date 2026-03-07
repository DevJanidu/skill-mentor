import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";
import { hasCompletedOnboarding } from "@/lib/roles";

/**
 * Guard that ensures the signed-in user has completed onboarding
 * (i.e. has STUDENT, MENTOR, or ADMIN role — not just the default USER role).
 * If not, redirects to /onboarding/role.
 */
export default function OnboardingGuard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  // USER-only role means onboarding not completed yet
  if (
    !user ||
    !hasCompletedOnboarding(user.publicMetadata as Record<string, unknown>)
  ) {
    return <Navigate to="/onboarding/role" replace />;
  }

  return <Outlet />;
}
