import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import supabase from "./utils/supabase";
import { useAuthStore } from "./stores/authStore";

// Layout components
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Dashboard pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import EventsPage from "./pages/dashboard/EventsPage";
import CreateEventPage from "./pages/dashboard/CreateEventPage";
import EditEventPage from "./pages/dashboard/EditEventPage";
import EventDetailPage from "./pages/dashboard/EventDetailPage";

// Public pages
import PublicEventPage from "./pages/public/PublicEventPage";
import NotFoundPage from "./pages/NotFoundPage";
import LandingPage from "./pages/public/LandingPage";
import { Spinner } from "./components/ui/spinner";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Guest route wrapper (redirect ke dashboard kalo udah login)
function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { setUser, setLoading } = useAuthStore.getState();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    }
    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/e/:slug" element={<PublicEventPage />} />
      </Route>

      {/* Auth routes (guest only) */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
      </Route>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Reset password route (no layout, needs valid token) */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected dashboard routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/events" element={<EventsPage />} />
        <Route path="/dashboard/events/new" element={<CreateEventPage />} />
        <Route path="/dashboard/events/:id" element={<EventDetailPage />} />
        <Route path="/dashboard/events/:id/edit" element={<EditEventPage />} />
      </Route>

      {/* Redirects */}
      <Route
        path="/"
        element={
          <GuestRoute>
            <LandingPage />
          </GuestRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
