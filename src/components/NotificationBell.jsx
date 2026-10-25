import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, FileText, Info, Palette, Trash2 } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { pushNotification, setNotificationsUser, useNotifications } from "../portfolio/notifications";
import { getMatchedJobs, jobSourceLabel } from "../jobs/jobs-api";

const KIND_ICONS = {
  cv: FileText,
  theme: Palette,
  info: Info,
  job: Briefcase,
};

// Same wording as the chatbot's history — minutes while fresh, then a date.
const whenLabel = (at) => {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

// The topbar bell: an unread-count badge over the bell and a dropdown panel
// of past app events (CVs created, themes applied…). The feed is per device
// — opening the panel is reading it, so the badge clears there.
export const NotificationBell = () => {
  const { notifications, unread, markAllRead, clearNotifications } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { status, profile } = useAuth();
  const userId = profile?.userId;
  // The bell is member-only on the inside: a signed-out visitor sees the
  // icon but never a count or a feed item — whatever this device stored
  // belongs to the account that was signed in, so it stays hidden until
  // someone signs in again.
  const member = status === "authenticated" && Boolean(userId);
  const feed = member ? notifications : [];
  const badge = member ? unread : 0;

  // Point the feed module at this account's store — the bell is the one
  // always-mounted reader, so switching users here re-keys every read,
  // write, and push to the signed-in user's own feed.
  useEffect(() => {
    setNotificationsUser(userId);
  }, [userId]);

  // Job matches ride the same feed: every minute the owner's matched posts
  // are diffed against a per-user, per-device seen set — anything new lands
  // as a "job" notification (the stable `job-<ItemId>` id keeps the push
  // idempotent even with two tabs open). The very first run only seeds the
  // seen set, so the existing backlog never floods the panel; matches that
  // arrive after this page has been seen announce themselves. "Clear all"
  // empties the feed but not the seen set, so cleared posts stay cleared.
  useEffect(() => {
    if (!userId) return undefined;
    const seenKey = `app.jobs.seen.${userId}`;
    const seenLoad = () => {
      try {
        const raw = localStorage.getItem(seenKey);
        return raw ? new Set(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    };
    const seenSave = (ids) => {
      try {
        localStorage.setItem(seenKey, JSON.stringify([...ids].slice(-200)));
      } catch {
        /* storage blocked — worst case a match re-announces once */
      }
    };
    const tick = async () => {
      try {
        const rows = await getMatchedJobs(userId);
        const seen = seenLoad();
        if (!seen) {
          seenSave(new Set(rows.map((row) => row.ItemId)));
          return;
        }
        const fresh = rows.filter((row) => !seen.has(row.ItemId));
        if (fresh.length === 0) return;
        for (const row of fresh) {
          pushNotification({
            id: `job-${row.ItemId}`,
            kind: "job",
            title: String(row.Title || "Untitled post"),
            detail: `Job match · ${jobSourceLabel(row)}`,
            at: Date.parse(row.CreatedDate ?? "") || Date.now(),
          });
          seen.add(row.ItemId);
        }
        seenSave(seen);
      } catch {
        // keep the last known state; the next tick retries
      }
    };
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [userId]);

  // Opening reads everything; any click outside closes — navigating takes a
  // click on some link, which is outside, so the panel travels nowhere.
  // Same mechanics as the avatar menu beside it.
  useEffect(() => {
    // Members only — a visitor opening the panel must not mark the device's
    // stored (invisible) feed as read on behalf of the signed-in account.
    if (!open || !member) return undefined;
    markAllRead();
    const onOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open, member, markAllRead]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications${badge ? ` (${badge} unread)` : ""}`}
        title="Notifications"
        className="relative cursor-pointer rounded-full border border-white/10 p-2 text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
      >
        <Bell className="h-4 w-4" />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-gray-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-100">
              Notifications
            </p>
            {feed.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {feed.length === 0 && (
              <p className="px-2 py-6 text-center text-xs leading-relaxed text-gray-500">
                {member
                  ? "Nothing yet — create a CV or change its theme and it lands here."
                  : "Notifications collect here once you sign in."}
              </p>
            )}
            {feed.map((item) => {
              const Icon = KIND_ICONS[item.kind] ?? Info;
              // Job matches are the actionable kind — clicking one hands
              // over to the Job Alerts page where the full post lives.
              const clickable = item.kind === "job";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={
                    clickable
                      ? () => {
                          setOpen(false);
                          navigate("/cv/jobs");
                        }
                      : undefined
                  }
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left ${
                    clickable
                      ? "cursor-pointer transition-colors hover:bg-white/5"
                      : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <p className="text-sm font-medium text-gray-200">
                      {item.title}
                    </p>
                    {item.detail && (
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                        {item.detail}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-gray-600">
                      {whenLabel(item.at)}
                    </p>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
