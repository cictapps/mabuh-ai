import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FindHelpScreen } from "./screens/FindHelpScreen";
import { ProtectedRoute } from "./lib/auth";

const AuthPage = lazy(async () => import("./pages/auth/AuthPage"));
const AuthCallback = lazy(async () => import("./pages/auth/AuthCallback"));
const ResetPassword = lazy(async () => import("./pages/auth/ResetPassword"));
const PrivacyPolicyPage = lazy(
  async () => import("./pages/legal/PrivacyPolicyPage"),
);
const TermsAndConditionsPage = lazy(
  async () => import("./pages/legal/TermsAndConditionsPage"),
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage initialTab="sign-in" />} />
        <Route path="/signup" element={<AuthPage initialTab="sign-up" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset" element={<ResetPassword />} />

        <Route
          path="/privacy"
          element={
            <Suspense fallback={<RouteFallback />}>
              <PrivacyPolicyPage />
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={<RouteFallback />}>
              <TermsAndConditionsPage />
            </Suspense>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Suspense fallback={<RouteFallback />}>
                <App />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <FindHelpScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <App
                initialHub="support"
                initialSupportView="chat"
                showOnboarding={false}
              />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
