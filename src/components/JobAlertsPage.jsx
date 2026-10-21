import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { Bell, Check, ExternalLink, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { ModeTabs } from "./ModeTabs";
import {
  deleteMatchedJob,
  ensureJobPreference,
  getMatchedJobs,
  markJobRead,
  saveJobPreference,
} from "../jobs/jobs-api";

// The owner's job-alert dashboard: the keywords the workflow matches
// incoming community posts against, and the matched posts it has saved.
// Same design language as the CV shelf — flat gray-900 page, ModeTabs on
// top, rounded-2xl gray-800 cards, pill actions, sky headings.
const SOURCE_BADGES = {
  telegram: "bg-sky-500/15 text-sky-300",
  rss: "bg-emerald-500/15 text-emerald-300",
  webhook: "bg-violet-500/15 text-violet-300",
  remoteok: "bg-amber-500/15 text-amber-300",
  remotive: "bg-rose-500/15 text-rose-300",
  hnrss: "bg-orange-500/15 text-orange-300",
  arbeitnow: "bg-teal-500/15 text-teal-300",
};

// Feed pollers dodge the platform's token-rewrite bug by referring to the
// sources as rk/rv/ar inside workflow parameters — map those back for display.
const MARKER_ALIASES = { rk: "remoteok", rv: "remotive", ar: "arbeitnow" };

const textareaClass =
  "w-full resize-none rounded-lg bg-gray-900/70 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-sky-400 focus:outline-none transition-colors";

// How often an open page re-reads the matched-jobs list (cloud data itself
// refreshes every 30 minutes via the feed pollers).
const JOB_REFRESH_MS = 60_000;

const NOTIF_SUPPORTED = typeof Notification !== "undefined";

// Newest card on top — the gateway has no server-side orderBy, so this runs
// client-side over CreatedDate (rows without one sink to the bottom).
const newestFirst = (a, b) =>
  (Date.parse(b.CreatedDate ?? "") || 0) - (Date.parse(a.CreatedDate ?? "") || 0);

const actionPillClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:border-sky-400/40 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-40";

const JobAlertsPage = () => {
  const { profile } = useAuth();
  const userId = profile?.userId;

  const [pref, setPref] = useState(null);
  const [keywords, setKeywords] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [toast, setToast] = useState(null);
  const [notifyOn, setNotifyOn] = useState(NOTIF_SUPPORTED && Notification.permission === "granted");

  // ItemIds seen so far — the tick diffs against this to spot fresh rows
  // (null until the first load, so opening the page never spams a toast).
  const knownIdsRef = useRef(null);
  const notifyGrantedRef = useRef(NOTIF_SUPPORTED && Notification.permission === "granted");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await ensureJobPreference(userId);
      setPref(row);
      setKeywords(row?.Keywords ?? "");
      const rows = await getMatchedJobs(userId);
      knownIdsRef.current = new Set(rows.map((job) => job.ItemId));
      setJobs(rows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // The feed pollers write new matches to the cloud every 30 minutes; this
  // picks them up about a minute later while the page stays open. Silent on
  // purpose: only the jobs list is refreshed (never the keywords box, so
  // in-progress edits survive), no spinner, and transient errors stay quiet.
  // Runs while the tab is hidden too — that's when a browser notification is
  // worth firing; when visible the in-page toast covers it.
  useEffect(() => {
    if (!userId) return;
    let inFlight = false;
    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const rows = await getMatchedJobs(userId);
        const known = knownIdsRef.current;
        const fresh = known ? rows.filter((job) => !known.has(job.ItemId)) : [];
        knownIdsRef.current = new Set(rows.map((job) => job.ItemId));
        setJobs(rows);
        if (fresh.length > 0) {
          const newest = [...fresh].sort(newestFirst)[0];
          setToast({ count: fresh.length, title: String(newest?.Title ?? "") });
          if (document.hidden && notifyGrantedRef.current && NOTIF_SUPPORTED) {
            const notif = new Notification("New job match", {
              body:
                fresh.length === 1
                  ? String(fresh[0].Title ?? "A new post matched your keywords.")
                  : `${fresh.length} new posts — newest: ${fresh[0].Title ?? ""}`,
              tag: "job-alerts",
            });
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
          }
        }
      } catch {
        // keep the last good list; the next tick retries
      } finally {
        inFlight = false;
      }
    };
    const id = setInterval(tick, JOB_REFRESH_MS);
    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]);

  // Toast lingers just long enough to be seen, then gets out of the way.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleEnableNotifications = async () => {
    if (!NOTIF_SUPPORTED) return;
    const perm = await Notification.requestPermission();
    notifyGrantedRef.current = perm === "granted";
    setNotifyOn(perm === "granted");
  };

  const handleSaveKeywords = async (event) => {
    event.preventDefault();
    if (!pref) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await saveJobPreference(pref.ItemId, { Keywords: keywords });
      setNotice("Saved — the next matching post lands below.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (job) => {
    setBusyId(job.ItemId);
    try {
      await markJobRead(job.ItemId);
      setJobs((list) =>
        list.map((row) => (row.ItemId === job.ItemId ? { ...row, IsRead: "true" } : row)),
      );
    } catch (markError) {
      setError(markError.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (job) => {
    setBusyId(job.ItemId);
    try {
      await deleteMatchedJob(job.ItemId);
      setJobs((list) => list.filter((row) => row.ItemId !== job.ItemId));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!userId) return null;

  const unreadCount = jobs.filter((job) => job.IsRead !== "true").length;

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-gray-900 flex flex-col">
      {/* Every page carries the mode switch right under the navbar. */}
      <div className="flex justify-center pt-6 px-6">
        <ModeTabs />
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 px-4 py-8 md:px-6">
        <header className="flex flex-col gap-3">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-sky-400">
              Job Alerts
            </h2>
            <p className="mt-2 text-sm md:text-base text-gray-400">
              Feed pollers watch remote job boards every 30 minutes — every
              post that mentions one of your keywords is saved here. Keep the
              page open and new matches appear on their own.
            </p>
          </div>
          {NOTIF_SUPPORTED && !notifyOn && Notification.permission === "default" && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className={actionPillClass + " self-start"}
            >
              <Bell className="h-3.5 w-3.5" /> Notify me of new matches
            </button>
          )}
        </header>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Keywords — the one input the workflow reads. */}
        <section className="rounded-2xl border border-white/10 bg-gray-800 p-5 shadow-xl">
          <h3 className="text-lg font-bold text-white">Keywords to watch</h3>
          <form onSubmit={handleSaveKeywords} className="mt-3 flex flex-col gap-3">
            <textarea
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              rows={2}
              placeholder="frontend, react, remote, dhaka"
              className={textareaClass}
            />
            <p className="text-xs text-gray-500">
              Comma-separated — a post containing any of these words
              (case-insensitive) matches. Sources stay empty for now; per-source
              switches come later.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {/* The gradient pill — the same primary CTA the contact page
                  uses for its one big action. */}
              <button
                type="submit"
                disabled={saving || !pref}
                className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-linear-to-r from-sky-500 to-pink-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save keywords
              </button>
              {notice && (
                <span className="text-sm text-green-400" role="status">
                  {notice}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Matched posts — newest matches on top of a plain list. */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white">
              Matched posts
              {jobs.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {jobs.length} total · {unreadCount} unread
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className={actionPillClass}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 p-10 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your alerts…
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 p-10 text-center">
              <p className="text-sm text-gray-400">
                Nothing matched yet. Save some keywords above and wire a source
                to the workflow&apos;s webhook — matches land here
                automatically.
              </p>
            </div>
          ) : (
            <div className="flex -mt-1 flex-col gap-3">
              {[...jobs].sort(newestFirst).map((job) => {
                // Feed pollers pack the real source into MatchedOn as a
                // "<source> |<keywords>" marker — the gateway overwrites the
                // Source column with a node id on workflow inserts, so the
                // marker is the trustworthy badge label when present.
                const rawMatched = String(job.MatchedOn ?? "");
                const marker = rawMatched.match(/^([a-z0-9]+)\s*\|\s*/);
                const badgeSource = marker
                  ? MARKER_ALIASES[marker[1]] ?? marker[1]
                  : String(job.Source || "webhook");
                const matched = rawMatched
                  .replace(/^[a-z0-9]+\s*\|\s*/, "")
                  .split(",")
                  .map((word) => word.trim())
                  .filter(Boolean);
                const unread = job.IsRead !== "true";
                return (
                  <article
                    key={job.ItemId}
                    className={`flex flex-col gap-2 rounded-2xl border bg-gray-800 p-5 shadow-xl ${
                      unread ? "border-sky-400/60" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="min-w-0 text-lg font-bold text-white">
                        {unread && (
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-400"
                            aria-hidden="true"
                          />
                        )}
                        {job.Title || "Untitled post"}
                      </h4>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          SOURCE_BADGES[badgeSource] ?? SOURCE_BADGES.webhook
                        }`}
                      >
                        {badgeSource}
                      </span>
                    </div>
                    {job.Snippet && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-gray-400">
                        {job.Snippet}
                      </p>
                    )}
                    {matched.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        matched:
                        {matched.map((word) => (
                          <span
                            key={word}
                            className="rounded-full bg-sky-500/10 px-2 py-0.5 text-sky-300"
                          >
                            {word}
                          </span>
                        ))}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {job.Url && (
                        <a
                          href={job.Url}
                          target="_blank"
                          rel="noreferrer"
                          className={actionPillClass}
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Open post
                        </a>
                      )}
                      {unread && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(job)}
                          disabled={busyId === job.ItemId}
                          className={actionPillClass}
                        >
                          <Check className="h-3.5 w-3.5" /> Mark read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(job)}
                        disabled={busyId === job.ItemId}
                        title="Delete this matched post"
                        className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* New-matches toast — shows while a freshly polled batch is on top of
          the list; click anywhere on it to dismiss early. */}
      {toast && (
        <button
          type="button"
          onClick={() => setToast(null)}
          className="fixed bottom-6 right-6 z-50 max-w-sm cursor-pointer rounded-2xl border border-sky-400/60 bg-gray-800 p-4 text-left shadow-2xl"
          role="status"
        >
          <p className="flex items-center gap-2 text-sm font-bold text-sky-300">
            <Bell className="h-4 w-4 shrink-0" />
            {toast.count === 1
              ? "1 new matching job landed"
              : `${toast.count} new matching jobs landed`}
          </p>
          {toast.title && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-300">{toast.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Newest is on top — click to dismiss</p>
        </button>
      )}
    </div>
  );
};

export default JobAlertsPage;
