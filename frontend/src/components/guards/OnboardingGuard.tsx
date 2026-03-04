import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";
import { getRoles } from "@/lib/roles";

/**
 * Guard that ensures the signed-in user has completed onboarding
 * (i.e. has at least one role in publicMetadata.roles).
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

  const roles = user
    ? getRoles(user.publicMetadata as Record<string, unknown>)
    : [];

  // No roles means onboarding not completed
  if (roles.length === 0) {
    return <Navigate to="/onboarding/role" replace />;
  }

  return <Outlet />;
}
