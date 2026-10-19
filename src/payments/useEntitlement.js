import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { MERAJ_EMAIL } from "../content/merajPortfolio";
import { getMyPaymentRequests } from "./payments-api";

// What the free plan gets; Pro lifts both.
export const FREE_PROJECT_LIMIT = 5;

// Same convention as PortfolioProvider's owner check — the seeded account
// doubles as the payment reviewer.
export const isAdminProfile = (profile) =>
  !!profile?.email &&
  profile.email.toLowerCase() === MERAJ_EMAIL.toLowerCase();

// plan: "free" | "pro", derived from the user's payment requests — any
// approved request whose ApprovedUntil is still in the future grants Pro,
// and proUntil is the furthest such date. Reload after submitting or when
// the admin review of one of your requests is expected to land.
export const useEntitlement = () => {
  const { profile } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: null,
    requests: [],
    plan: "free",
    proUntil: null,
  });

  const reload = useCallback(async () => {
    if (!profile?.userId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const requests = await getMyPaymentRequests(profile.userId);
      const now = Date.now();
      const liveUntil = requests
        .filter((r) => r.Status === "approved" && r.ApprovedUntil)
        .map((r) => new Date(r.ApprovedUntil).getTime())
        .filter((t) => !Number.isNaN(t) && t > now);
      const proUntil = liveUntil.length ? Math.max(...liveUntil) : null;
      setState({
        loading: false,
        error: null,
        requests,
        plan: proUntil ? "pro" : "free",
        proUntil: proUntil ? new Date(proUntil).toISOString() : null,
      });
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        error: error?.message || "Could not load your payments.",
      }));
    }
  }, [profile?.userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
};
