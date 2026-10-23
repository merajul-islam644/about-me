import { useEffect, useState } from "react";

// A tiny per-device notification feed: app events push short notes here and
// the navbar bell shows them. Everything is local (localStorage, guarded at
// every touch) — there is no server inbox to sync with, so clearing storage
// clears the feed and that is by design.

const STORAGE_KEY = "app.notifications";
const MAX_NOTIFICATIONS = 20;

// The one shared list, lazy-loaded once per page load; every mutation
// replaces it with a fresh array so React subscribers see a new snapshot.
let notifications = null;
const subscribers = new Set();

const load = () => {
  if (notifications) return notifications;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    notifications = raw ? JSON.parse(raw) : [];
  } catch {
    notifications = [];
  }
  if (!Array.isArray(notifications)) notifications = [];
  return notifications;
};

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    /* storage blocked — the in-memory feed still works this visit */
  }
};

const emit = () => {
  const snapshot = [...notifications];
  subscribers.forEach((listener) => listener(snapshot));
};

// Record one event — newest first, capped, starts unread. `kind` picks the
// panel's icon ("cv" | "theme" | "info" | "job"). Pass a stable `id` to make
// a push idempotent (the job-match poll re-runs every minute; the id is the
// MatchedJob ItemId, so the same post never lands twice), and `at` to keep
// the event's original time instead of the push time.
export const pushNotification = ({ id, title, detail = "", kind = "info", at }) => {
  load();
  const itemId = id ?? `ntf-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  if (notifications.some((item) => item.id === itemId)) return;
  notifications = [
    {
      id: itemId,
      title,
      detail,
      kind,
      at: at ?? Date.now(),
      read: false,
    },
    ...notifications,
  ].slice(0, MAX_NOTIFICATIONS);
  persist();
  emit();
};

export const markAllRead = () => {
  const list = load();
  if (!list.some((item) => !item.read)) return;
  notifications = list.map((item) => ({ ...item, read: true }));
  persist();
  emit();
};

export const clearNotifications = () => {
  load();
  notifications = [];
  persist();
  emit();
};

// React views subscribe to the shared list — one feed, any number of readers.
export const useNotifications = () => {
  const [snapshot, setSnapshot] = useState(load);
  useEffect(() => {
    subscribers.add(setSnapshot);
    return () => {
      subscribers.delete(setSnapshot);
    };
  }, []);
  return {
    notifications: snapshot,
    unread: snapshot.filter((item) => !item.read).length,
    markAllRead,
    clearNotifications,
  };
};
