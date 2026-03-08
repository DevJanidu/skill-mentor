import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser, SignIn, SignUp } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setAuthTokenGetter } from "@/lib/api";
import { isMentor } from "@/lib/roles";
import ScrollToTop from "@/components/shared/ScrollToTop";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import MentorLayout from "@/components/layouts/MentorLayout";

// Guards
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import AdminRoute from "@/components/guards/AdminRoute";
import OnboardingGuard from "@/components/guards/OnboardingGuard";

// Public pages
import Home from "@/pages/Home";
import MentorsPage from "@/pages/MentorsPage";
import MentorProfilePage from "@/pages/MentorProfilePage";
import SubjectsPage from "@/pages/SubjectsPage";
import SubjectDetailPage from "@/pages/SubjectDetailPage";

// Protected pages
import StudentDashboardPage from "@/pages/StudentDashboardPage";
import PaymentPage from "@/pages/PaymentPage";
import OnboardingRolePage from "@/pages/OnboardingRolePage";
import MentorInboxPage from "@/pages/MentorInboxPage";
import SessionDetailPage from "@/pages/SessionDetailPage";
import OpenGroupSessionsPage from "@/pages/OpenGroupSessionsPage";
import MentorSubjectsPage from "@/pages/MentorSubjectsPage";
import MentorCreateSessionPage from "@/pages/MentorCreateSessionPage";
import MentorDashboardPage from "@/pages/MentorDashboardPage";
import MentorReviewsPage from "@/pages/MentorReviewsPage";
import MentorEditProfilePage from "@/pages/MentorEditProfilePage";
import MentorSessionsPage from "@/pages/MentorSessionsPage";
import MentorAvailabilityPage from "@/pages/MentorAvailabilityPage";

// Admin pages
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ManageSubjectsPage from "@/pages/admin/ManageSubjectsPage";
import ManageMentorsPage from "@/pages/admin/ManageMentorsPage";
import ManageBookingsPage from "@/pages/admin/ManageBookingsPage";
import ManageStudentsPage from "@/pages/admin/ManageStudentsPage";
import NotFoundPage from "@/pages/NotFoundPage";

function App() {
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  const mentorUser =
    isSignedIn && isMentor(user?.publicMetadata as Record<string, unknown>);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Auth routes (Clerk hosted pages) ──────────────────────── */}
        <Route
          path="sign-in/*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-zinc-50">
              <SignIn routing="path" path="/sign-in" />
            </div>
          }
        />
        <Route
          path="sign-up/*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-zinc-50">
              <SignUp routing="path" path="/sign-up" />
            </div>
          }
        />

        {/* ── Public routes (Navbar + Footer) ───────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="mentors" element={<MentorsPage />} />
          <Route path="mentors/:mentorId" element={<MentorProfilePage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
        </Route>

        {/* ── Onboarding route (signed-in but no role yet) ──────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="onboarding/role" element={<OnboardingRolePage />} />
        </Route>

        {/* ── Protected routes (signed-in + onboarded users) ────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGuard />}>
            {/* Shared routes inside public layout (students + mentors) */}
            <Route element={<PublicLayout />}>
              <Route
                path="dashboard"
                element={
                  mentorUser ? (
                    <Navigate to="/mentor/dashboard" replace />
                  ) : (
                    <StudentDashboardPage />
                  )
                }
              />
              <Route path="payment/:sessionId" element={<PaymentPage />} />
              <Route path="sessions/open" element={<OpenGroupSessionsPage />} />
              <Route
                path="sessions/:sessionId"
                element={<SessionDetailPage />}
              />
            </Route>

            {/* ── Mentor layout routes ─────────────────────────────── */}
            <Route path="mentor" element={<MentorLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<MentorDashboardPage />} />
              <Route path="inbox" element={<MentorInboxPage />} />
              <Route path="sessions" element={<MentorSessionsPage />} />
              <Route path="subjects" element={<MentorSubjectsPage />} />
              <Route
                path="create-session"
                element={<MentorCreateSessionPage />}
              />
              <Route path="reviews" element={<MentorReviewsPage />} />
              <Route path="profile" element={<MentorEditProfilePage />} />
              <Route path="availability" element={<MentorAvailabilityPage />} />
            </Route>

            {/* ── Admin routes ──────────────────────────────────────── */}
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="bookings" element={<ManageBookingsPage />} />
                <Route path="subjects" element={<ManageSubjectsPage />} />
                <Route path="mentors" element={<ManageMentorsPage />} />
                <Route path="students" element={<ManageStudentsPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* ── 404 catch-all ─────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
