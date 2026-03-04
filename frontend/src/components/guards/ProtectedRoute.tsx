import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

/** Redirects to / if user is not signed in */
export default function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/" replace />;

  return <Outlet />;
}
