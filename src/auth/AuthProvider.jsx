import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSessionClaims,
  isAuthenticated,
  logout as blocksLogout,
  startLogin,
} from "../lib/blocks/auth";
import { blocksClient } from "../lib/blocks/client";
import { AuthContext } from "./auth-context";

// Backup interval only — the primary signals are the mount refresh and the
// visibility-change refresh below.
const STATUS_POLL_MS = 5 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [status, setStatus] = useState("loading");
  const [claims, setClaims] = useState(null);
  const [profile, setProfile] = useState(null);
  const refreshInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      // isAuthenticated() checks the raw response status — the underlying
      // auth endpoints resolve non-2xx bodies instead of throwing, so a 401
      // must never land in the "authenticated" branch.
      if (!(await isAuthenticated())) {
        setClaims(null);
        setProfile(null);
        setStatus("unauthenticated");
        return;
      }
      // Asking IAM directly is the only source of truth — the default cookie
      // flow keeps no locally readable token, so never infer state from storage.
      const nextClaims = await fetchSessionClaims();
      setClaims(nextClaims);
      setStatus("authenticated");
      // Best-effort identity for per-user data (portfolio rows, picture
      // files): the IAM record id, not the OIDC sub. A profile failure must
      // never deauthenticate — the app just can't key user content.
      try {
        const me = await blocksClient.iam.me();
        const user = me?.data;
        setProfile(
          user?.itemId
            ? {
                userId: user.itemId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: Array.isArray(user.roles) ? user.roles : [],
              }
            : null
        );
      } catch {
        setProfile(null);
      }
    } catch {
      setClaims(null);
      setProfile(null);
      setStatus("unauthenticated");
    } finally {
      refreshInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, STATUS_POLL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  const login = useCallback((returnTo) => startLogin(returnTo), []);
  const logout = useCallback(async () => {
    await blocksLogout();
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ status, claims, profile, login, logout, refresh }),
    [status, claims, profile, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
