import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/lib/auth";

const AuthPage = lazy(async () => import("@/pages/auth/AuthPage"));
const Home = lazy(async () => import("@/pages/Home"));

type AppErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-card/90 p-6 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)]">
            <h1 className="font-serif text-3xl tracking-[-0.03em]">Something blocked the page</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The app hit a render error before the screen could finish loading.
            </p>
            <p className="mt-4 rounded-2xl bg-surface-high p-4 text-sm text-red-400">
              {this.state.error.message}
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading page...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<AuthPage initialTab="sign-in" />} />
            <Route path="/signup" element={<AuthPage initialTab="sign-up" />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
