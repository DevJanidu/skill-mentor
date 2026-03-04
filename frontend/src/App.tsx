import { Routes, Route } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setAuthTokenGetter } from "@/lib/api";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import AdminLayout from "@/components/layouts/AdminLayout";

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
import DashboardPage from "@/pages/DashboardPage";
import PaymentPage from "@/pages/PaymentPage";
import OnboardingRolePage from "@/pages/OnboardingRolePage";

// Admin pages
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ManageSubjectsPage from "@/pages/admin/ManageSubjectsPage";
import ManageMentorsPage from "@/pages/admin/ManageMentorsPage";
import ManageBookingsPage from "@/pages/admin/ManageBookingsPage";

function App() {
  const { getToken } = useAuth();

  // Wire the Clerk JWT getter into our Axios interceptor once.
  // getToken accepts { template: "skill-mentor" } which the interceptor uses.
  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  return (
    <Routes>
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
          <Route element={<PublicLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="payment/:sessionId" element={<PaymentPage />} />
          </Route>

          {/* ── Admin routes ──────────────────────────────────────── */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="bookings" element={<ManageBookingsPage />} />
              <Route path="subjects" element={<ManageSubjectsPage />} />
              <Route path="mentors" element={<ManageMentorsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
