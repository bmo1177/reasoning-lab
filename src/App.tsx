import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { PageLoader } from "./components/LoadingScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy load all pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const CaseLibrary = lazy(() => import("./pages/CaseLibrary"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TeamRoom = lazy(() => import("./pages/TeamRoom"));
const TeamSession = lazy(() => import("./pages/TeamSession"));
const TeamCollabDemo = lazy(() => import("./pages/TeamCollabDemo"));
const CompetitionLeaderboard = lazy(() => import("./pages/CompetitionLeaderboard"));
const ReasoningStudio = lazy(() => import("./pages/ReasoningStudio"));
const DetectiveMode = lazy(() => import("./pages/DetectiveMode"));
const DetectiveStudio = lazy(() => import("./pages/DetectiveStudio"));
const UncertaintyStudio = lazy(() => import("./pages/UncertaintyStudio"));
const SimulationLibrary = lazy(() => import("./pages/SimulationLibrary"));
const SimulationStudio = lazy(() => import("./pages/SimulationStudio"));
const SimulationResults = lazy(() => import("./pages/SimulationResults"));
const SimulationReflection = lazy(() => import("./pages/SimulationReflection"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MentorMatch = lazy(() => import("./pages/MentorMatch"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const AnalyticsDemo = lazy(() => import("./pages/AnalyticsDemo"));
const SessionAnalytics = lazy(() => import("./pages/SessionAnalytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/cases" element={<CaseLibrary />} />

        {/* Auth Route - redirect if already logged in */}
        <Route
          path="/auth"
          element={
            <PublicOnlyRoute>
              <Auth />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor-match"
          element={
            <ProtectedRoute>
              <MentorMatch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-session/:roomId"
          element={
            <ProtectedRoute>
              <TeamSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-demo"
          element={
            <ProtectedRoute>
              <TeamCollabDemo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/competition"
          element={
            <ProtectedRoute>
              <CompetitionLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/:caseId"
          element={
            <ProtectedRoute>
              <ReasoningStudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/detective"
          element={
            <ProtectedRoute>
              <DetectiveMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/detective/:caseId"
          element={
            <ProtectedRoute>
              <DetectiveStudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/uncertainty/:caseId"
          element={
            <ProtectedRoute>
              <UncertaintyStudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulations"
          element={
            <ProtectedRoute>
              <SimulationLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/:caseId"
          element={
            <ProtectedRoute>
              <SimulationStudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/:caseId/results"
          element={
            <ProtectedRoute>
              <SimulationResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/:caseId/reflection"
          element={
            <ProtectedRoute>
              <SimulationReflection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/session/:sessionId"
          element={
            <ProtectedRoute>
              <SessionAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Instructor Routes */}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - require admin role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Analytics Demo - LocalStorage testing */}
        <Route
          path="/analytics-demo"
          element={
            <ProtectedRoute>
              <AnalyticsDemo />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
