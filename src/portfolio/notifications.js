import { useEffect, useState } from "react";

// A tiny per-user notification feed: app events push short notes here and
// the navbar bell shows them. Everything is local (localStorage, guarded at
// every touch) — there is no server inbox to sync with, so clearing storage
// clears the feed and that is by design. The store is namespaced per signed-in
// user: whoever is active sees only their own feed, never another account's
// leftovers on the same browser.

const STORAGE_BASE = "app.notifications";
const MAX_NOTIFICATIONS = 20;

// The user whose feed is active — set by setNotificationsUser from the bell
// (the one component that knows the signed-in identity). Empty until then.
let activeUser = "";
// The active user's list, lazy-loaded once per switch; every mutation
// replaces it with a fresh array so React subscribers see a new snapshot.
let notifications = null;
const subscribers = new Set();

const storageKey = () => `${STORAGE_BASE}.${activeUser || "anonymous"}`;

const load = () => {
  if (notifications) return notifications;
  try {
    const raw = localStorage.getItem(storageKey());
    notifications = raw ? JSON.parse(raw) : [];
  } catch {
    notifications = [];
  }
  if (!Array.isArray(notifications)) notifications = [];
  return notifications;
};

const persist = () => {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(notifications));
  } catch {
    /* storage blocked — the in-memory feed still works this visit */
  }
};

const emit = () => {
  const snapshot = [...load()];
  subscribers.forEach((listener) => listener(snapshot));
};

// Swap the feed to another account's store (sign-in, sign-out, account
// switch). Forces a reload from that user's key and pushes the new snapshot
// to every open bell.
export const setNotificationsUser = (userId) => {
  const next = String(userId ?? "");
  if (next === activeUser) return;
  activeUser = next;
  notifications = null;
  emit();
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
