import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth-context";

export const RequireAuth = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigate from an effect, not at render time — reading the location live
  // during render double-nests returnTo under Strict Mode's double-invoked effects.
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnTo = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnTo}`, { replace: true });
    }
  }, [status, location, navigate]);

  if (status !== "authenticated") {
    return <LoadingScreen />;
  }
  return children;
};

export const RedirectIfAuthenticated = ({ children }) => {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [status, navigate]);

  if (status === "loading") {
    return <LoadingScreen />;
  }
  return children;
};

// Editor-only pages (/edit): signed-in users without clouduser are viewers —
// they get bounced home instead of an editor that could never save.
export const RequireEditor = ({ children }) => {
  const { status, canEdit } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnTo = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnTo}`, { replace: true });
      return;
    }
    if (status === "authenticated" && !canEdit) {
      navigate("/", { replace: true });
    }
  }, [status, canEdit, location, navigate]);

  if (status !== "authenticated" || !canEdit) {
    return <LoadingScreen />;
  }
  return children;
};

export const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <p className="text-gray-400 animate-pulse">Loading…</p>
  </div>
);
