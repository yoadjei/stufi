import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import RegisterPage from "@/pages/register";
import LoginPage from "@/pages/login";
import OtpStartPage from "@/pages/otp-start";
import OtpVerifyPage from "@/pages/otp-verify";
import ResetStartPage from "@/pages/reset-start";
import ResetFinishCodePage from "@/pages/reset-finish-code";
import ResetFinishLinkPage from "@/pages/reset-finish-link";
import CompleteProfilePage from "@/pages/complete-profile";
import HomePage from "@/pages/home";
import CyclesPage from "@/pages/cycles";
import NewCyclePage from "@/pages/cycle-new";
import CycleDetailPage from "@/pages/cycle-detail";
import TransactPage from "@/pages/transact";
import AddExpensePage from "@/pages/add-expense";
import AddIncomePage from "@/pages/add-income";
import HistoryPage from "@/pages/history";
import CategoriesPage from "@/pages/categories";
import InsightsPage from "@/pages/insights";
import MorePage from "@/pages/more";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import DailyCapPage from "@/pages/daily-cap";
import ExportPage from "@/pages/export";
import SecurityPage from "@/pages/security";
import ContactPage from "@/pages/contact";
import ReferPage from "@/pages/refer";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, needsProfile } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/landing" />;
  }

  if (needsProfile && location !== "/complete-profile") {
    return <Redirect to="/complete-profile" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children, isLanding = false }: { children: React.ReactNode, isLanding?: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Bypassing landing page logic 
  if (isLanding) {
    const hasSeenLanding = localStorage.getItem("hasSeenLanding");
    if (hasSeenLanding === "true") {
      setTimeout(() => setLocation("/login"), 0); // Need to use setLocation or Redirect inside an effect or render body 
      return null;
    } else {
      localStorage.setItem("hasSeenLanding", "true");
    }
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* public pages */}
      <Route path="/landing">
        <PublicRoute isLanding><LandingPage /></PublicRoute>
      </Route>
      <Route path="/onboarding">
        <PublicRoute><OnboardingPage /></PublicRoute>
      </Route>
      <Route path="/register">
        <PublicRoute><RegisterPage /></PublicRoute>
      </Route>
      <Route path="/login">
        <PublicRoute><LoginPage /></PublicRoute>
      </Route>
      <Route path="/otp/start">
        <PublicRoute><OtpStartPage /></PublicRoute>
      </Route>
      <Route path="/otp/verify">
        <PublicRoute><OtpVerifyPage /></PublicRoute>
      </Route>
      <Route path="/reset/start">
        <PublicRoute><ResetStartPage /></PublicRoute>
      </Route>
      <Route path="/reset/finish-code">
        <PublicRoute><ResetFinishCodePage /></PublicRoute>
      </Route>
      <Route path="/reset/finish-link">
        <PublicRoute><ResetFinishLinkPage /></PublicRoute>
      </Route>

      {/* complete profile (requires auth but allows missing profile) */}
      <Route path="/complete-profile">
        <CompleteProfilePage />
      </Route>

      {/* protected routes (require authentication) */}
      <Route path="/">
        <ProtectedRoute><HomePage /></ProtectedRoute>
      </Route>
      <Route path="/cycles">
        <ProtectedRoute><CyclesPage /></ProtectedRoute>
      </Route>
      <Route path="/cycles/new">
        <ProtectedRoute><NewCyclePage /></ProtectedRoute>
      </Route>
      <Route path="/cycles/:id">
        <ProtectedRoute><CycleDetailPage /></ProtectedRoute>
      </Route>
      <Route path="/transact">
        <ProtectedRoute><TransactPage /></ProtectedRoute>
      </Route>
      <Route path="/transact/expense">
        <ProtectedRoute><AddExpensePage /></ProtectedRoute>
      </Route>
      <Route path="/transact/income">
        <ProtectedRoute><AddIncomePage /></ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute><HistoryPage /></ProtectedRoute>
      </Route>
      <Route path="/categories">
        <ProtectedRoute><CategoriesPage /></ProtectedRoute>
      </Route>
      <Route path="/insights">
        <ProtectedRoute><InsightsPage /></ProtectedRoute>
      </Route>
      <Route path="/more">
        <ProtectedRoute><MorePage /></ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute><NotificationsPage /></ProtectedRoute>
      </Route>
      <Route path="/more/profile">
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      </Route>
      <Route path="/more/cap">
        <ProtectedRoute><DailyCapPage /></ProtectedRoute>
      </Route>
      <Route path="/more/export">
        <ProtectedRoute><ExportPage /></ProtectedRoute>
      </Route>
      <Route path="/more/security">
        <ProtectedRoute><SecurityPage /></ProtectedRoute>
      </Route>
      <Route path="/contact">
        <ContactPage />
      </Route>
      <Route path="/refer">
        <ProtectedRoute><ReferPage /></ProtectedRoute>
      </Route>
      <Route path="/terms">
        <TermsPage />
      </Route>
      <Route path="/privacy">
        <PrivacyPage />
      </Route>

      {/* fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
