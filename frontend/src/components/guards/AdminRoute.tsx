import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";
import { isAdmin } from "@/lib/roles";

/** Only allows users whose publicMetadata marks them as ADMIN */
export default function AdminRoute() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!user || !isAdmin(user.publicMetadata as Record<string, unknown>)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
