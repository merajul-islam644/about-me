import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/auth-context";
import {
  MERAJ_EMAIL,
  MERAJ_USER_ID,
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
import {
  clearGuestToken,
  fetchGuestContent,
  readGuestToken,
} from "../lib/blocks/invites";
import { PortfolioContext } from "./portfolio-context";

const IDLE = {
  status: "idle",
  content: null,
  itemId: null,
  error: null,
};

export const PortfolioProvider = ({ children }) => {
  const { status: authStatus, profile, canEdit } = useAuth();
  const [state, setState] = useState(IDLE);
  const [saving, setSaving] = useState(false);
  // The role slug the webhook vouches the guest browses as (empty = plain
  // guest). Refreshed on every guest fetch, since it lives on the invite.
  const [guestRole, setGuestRole] = useState("");
  // The owner's picture as a ~5-minute presigned URL, riding the same
  // webhook response. Guests have no storage session of their own, so this
  // is the only face they can see (and later print into the CV PDF).
  const [guestPicture, setGuestPicture] = useState("");

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

  // Invited viewers (signed-in without clouduser) browse the OWNER's live
  // row read-only — never their own starter content, never a save target.
  // itemId stays null so save() is structurally impossible for them.
  const loadOwnerView = useCallback(async (viewerUserId) => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    try {
      const row = await getPortfolioRow(MERAJ_USER_ID);
      if (!row) throw new Error("owner row missing");
      let content = normalizeContent(JSON.parse(row.Content));
      // CV access for invited viewers is explicit — full parity with guest
      // links: a viewer pinned to one CV sees ONLY that CV, and a viewer with
      // no grant (or whose granted CV was since deleted) sees an EMPTY CV tab.
      const pinnedCvId = content.cvAccessByUser?.[viewerUserId ?? ""];
      const pinned = pinnedCvId
        ? content.cvs.find((cv) => cv.id === pinnedCvId)
        : null;
      content = pinned
        ? { ...content, cvs: [pinned], activeCvId: pinned.id, cv: pinned }
        : { ...content, cvs: [], activeCvId: null, cv: null };
      setState({
        status: "ready",
        content,
        itemId: null,
        error: null,
      });
    } catch {
      // Never blank the site for a viewer — fall back to the public snapshot.
      setState({
        status: "ready",
        content: normalizeContent(visitorPortfolio),
        itemId: null,
        error: null,
      });
    }
  }, []);

  // A guest-link holder (signed-out) reads the owner's live content through
  // the invite webhook — read-only, itemId stays null so nothing can be
  // saved. A dead link (revoked, expired, unknown) clears itself and drops
  // the visit back to the public showcase, so a stale link never renders
  // anything it shouldn't.
  const loadGuestView = useCallback(async (token) => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    try {
      const result = await fetchGuestContent(token);
      setGuestRole(String(result.role ?? ""));
      setGuestPicture(String(result.pictureUrl ?? ""));
      setState({
        status: "ready",
        content: normalizeContent(result.content),
        itemId: null,
        error: null,
      });
    } catch {
      clearGuestToken();
      setGuestRole("");
      setGuestPicture("");
      setState({
        status: "ready",
        content: normalizeContent(visitorPortfolio),
        itemId: null,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated" && profile?.userId && canEdit) {
      load(profile);
    } else if (authStatus === "authenticated") {
      loadOwnerView(profile?.userId);
    } else if (authStatus === "unauthenticated") {
      // Visitors browse the public showcase read-only: no row is fetched and
      // nothing can be saved (itemId stays null). A guest-link holder instead
      // gets the owner's live content the webhook returns. Signing in swaps
      // in the owner's row for viewers, the user's own for editors.
      const guestToken = readGuestToken();
      if (guestToken) {
        loadGuestView(guestToken);
      } else {
        setState({
          status: "ready",
          content: normalizeContent(visitorPortfolio),
          itemId: null,
          error: null,
        });
      }
    }
  }, [authStatus, profile, canEdit, load, loadOwnerView, loadGuestView]);

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
    if (authStatus === "authenticated" && profile?.userId && canEdit) {
      return load(profile, { isRetry: true });
    }
    if (authStatus === "authenticated") return loadOwnerView(profile?.userId);
    const guestToken = readGuestToken();
    if (guestToken) return loadGuestView(guestToken);
    return Promise.resolve();
  }, [authStatus, profile, canEdit, load, loadOwnerView, loadGuestView]);

  // A guest-link holder (signed-out, token stashed by /invite/:token) browses
  // like a signed-in DataViewer member: the owner's content, read-only, and
  // none of the account chrome. False the moment the token clears (dead
  // link) or the visitor signs in.
  const guest = authStatus === "unauthenticated" && Boolean(readGuestToken());

  const value = useMemo(
    () => ({
      status: state.status,
      content: state.content,
      itemId: state.itemId,
      error: state.error,
      saving,
      guest,
      guestRole,
      guestPicture,
      save,
      refresh,
    }),
    [state, saving, guest, guestRole, guestPicture, save, refresh]
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
