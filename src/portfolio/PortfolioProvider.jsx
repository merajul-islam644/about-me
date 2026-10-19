import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/auth-context";
import {
  MERAJ_EMAIL,
  merajPortfolio,
  visitorPortfolio,
} from "../content/merajPortfolio";
import { starterPortfolio } from "../content/starterPortfolio";
import { normalizeContent } from "../content/portfolioShape";
import {
  createPortfolioRow,
  getPortfolioRow,
  savePortfolioRow,
} from "./portfolio-api";
import { PortfolioContext } from "./portfolio-context";

const IDLE = {
  status: "idle",
  content: null,
  itemId: null,
  error: null,
};

export const PortfolioProvider = ({ children }) => {
  const { status: authStatus, profile } = useAuth();
  const [state, setState] = useState(IDLE);
  const [saving, setSaving] = useState(false);

  const displayNameOf = (prof) =>
    [prof?.firstName, prof?.lastName].filter(Boolean).join(" ") ||
    prof?.email ||
    "user";

  const load = useCallback(
    async (prof, { isRetry = false } = {}) => {
      if (!prof?.userId) return;
      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        let row = await getPortfolioRow(prof.userId);

        if (!row) {
          // First visit: provision this user's row. Meraj's real content is
          // seeded by email match — his site stays unchanged after cutover.
          const content =
            prof.email && prof.email.toLowerCase() === MERAJ_EMAIL.toLowerCase()
              ? merajPortfolio
              : starterPortfolio(prof);
          try {
            await createPortfolioRow(
              prof.userId,
              displayNameOf(prof),
              JSON.stringify(content)
            );
          } catch (createError) {
            if (isRetry) throw createError;
            // Two tabs may race the first create; the unique UserId index
            // rejects the loser — re-list and adopt the winner's row.
            row = await getPortfolioRow(prof.userId);
            if (!row) throw createError;
          }
          if (!row) {
            setState({
              status: "ready",
              content: normalizeContent(content),
              itemId: null,
              error: null,
            });
            return;
          }
        }

        try {
          setState({
            status: "ready",
            content: normalizeContent(JSON.parse(row.Content)),
            itemId: row.ItemId,
            error: null,
          });
        } catch {
          // Unparsable stored content must never blank the site — show the
          // starter and surface what happened.
          setState({
            status: "error",
            content: normalizeContent(starterPortfolio(prof)),
            itemId: row.ItemId,
            error:
              "Your saved portfolio could not be read — showing starter content. Saving from the edit page will repair it.",
          });
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error:
            error?.message ||
            "Your portfolio could not be loaded. Check your connection and retry.",
        }));
      }
    },
    []
  );

  useEffect(() => {
    if (authStatus === "authenticated" && profile?.userId) {
      load(profile);
    } else if (authStatus === "unauthenticated") {
      // Visitors browse the public showcase read-only: no row is fetched and
      // nothing can be saved (itemId stays null). Signing in swaps in the
      // user's own content via the branch above.
      setState({
        status: "ready",
        content: normalizeContent(visitorPortfolio),
        itemId: null,
        error: null,
      });
    }
  }, [authStatus, profile, load]);

  const save = useCallback(
    async (nextContent) => {
      let itemId = state.itemId;
      if (!itemId && profile?.userId) {
        // The row exists server-side even when the first create did not echo
        // an ItemId — re-list to recover it before saving.
        const row = await getPortfolioRow(profile.userId);
        itemId = row?.ItemId ?? null;
        if (itemId) setState((prev) => ({ ...prev, itemId }));
      }
      if (!itemId) {
        throw new Error("No portfolio row to save into — reload the page.");
      }
      setSaving(true);
      const previous = state.content;
      // Optimistic: every view reflects the edit immediately; reverted on failure.
      setState((prev) => ({ ...prev, content: nextContent }));
      try {
        await savePortfolioRow(
          itemId,
          JSON.stringify(nextContent),
          displayNameOf(profile)
        );
      } catch (error) {
        setState((prev) => ({ ...prev, content: previous }));
        throw new Error(
          error?.message?.replace(/^Portfolio save failed: /, "") ||
            "Saving failed — your change was not kept."
        );
      } finally {
        setSaving(false);
      }
    },
    [state.itemId, state.content, profile]
  );

  const refresh = useCallback(() => {
    if (profile?.userId) return load(profile, { isRetry: true });
    return Promise.resolve();
  }, [profile, load]);

  const value = useMemo(
    () => ({
      status: state.status,
      content: state.content,
      itemId: state.itemId,
      error: state.error,
      saving,
      save,
      refresh,
    }),
    [state, saving, save, refresh]
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
