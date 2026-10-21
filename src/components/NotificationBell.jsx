import { useEffect, useRef, useState } from "react";
import { Bell, FileText, Info, Palette, Trash2 } from "lucide-react";
import { useNotifications } from "../portfolio/notifications";

const KIND_ICONS = {
  cv: FileText,
  theme: Palette,
  info: Info,
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

  // Opening reads everything; any click outside closes — navigating takes a
  // click on some link, which is outside, so the panel travels nowhere.
  // Same mechanics as the avatar menu beside it.
  useEffect(() => {
    if (!open) return undefined;
    markAllRead();
    const onOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open, markAllRead]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        title="Notifications"
        className="relative cursor-pointer rounded-full border border-white/10 p-2 text-gray-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-gray-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-100">
              Notifications
            </p>
            {notifications.length > 0 && (
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
            {notifications.length === 0 && (
              <p className="px-2 py-6 text-center text-xs leading-relaxed text-gray-500">
                Nothing yet — create a CV or change its theme and it lands
                here.
              </p>
            )}
            {notifications.map((item) => {
              const Icon = KIND_ICONS[item.kind] ?? Info;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-lg px-2.5 py-2"
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
