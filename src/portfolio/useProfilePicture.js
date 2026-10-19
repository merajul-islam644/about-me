import { useCallback, useEffect, useState } from "react";
import {
  getProfilePictureUrl,
  uploadProfilePicture,
} from "../lib/blocks/storage";

// Presigned read URLs expire in ~5 minutes, so a shared URL is only reused
// while it is still safely fresh; later mounts fetch their own.
const SHARE_TTL_MS = 4 * 60 * 1000;

// All hook instances (Navbar, Hero, About, ExportButton) share one picture
// state per user: an upload in Hero must light up the navbar avatar too,
// not just the component that happened to host the upload button.
const urlMemory = new Map(); // userId -> { url, at }
const listeners = new Map(); // userId -> Set<(url) => void>

const cacheKey = (userId) => String(userId).toLowerCase();

const publish = (userId, url) => {
  const key = cacheKey(userId);
  urlMemory.set(key, { url, at: Date.now() });
  listeners.get(key)?.forEach((listener) => listener(url));
};

// Shared picture state for Navbar, Hero and About: the current version's
// pre-signed URL (null until storage answers — callers keep their bundled
// fallback), plus the upload flow. `userId` comes from useAuth().profile;
// the effect re-runs when the profile arrives after the session check.
export const useProfilePicture = (userId) => {
  const [url, setUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    const key = cacheKey(userId);
    let cancelled = false;
    const listener = (next) => setUrl(next);
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(listener);

    const shared = urlMemory.get(key);
    if (shared && Date.now() - shared.at < SHARE_TTL_MS) {
      setUrl(shared.url); // fresh enough — skip the duplicate lookup
    } else {
      setUrl(null);
      getProfilePictureUrl(userId)
        .then((nextUrl) => {
          if (cancelled || !nextUrl) return;
          urlMemory.set(key, { url: nextUrl, at: Date.now() });
          setUrl(nextUrl);
        })
        .catch(() => {
          // Keep the current picture — storage being down shouldn't blank the page.
        });
    }

    return () => {
      cancelled = true;
      listeners.get(key)?.delete(listener);
    };
  }, [userId]);

  const upload = useCallback(
    async (file) => {
      if (!file || !userId) return null;
      setUploading(true);
      setError(null);
      try {
        const nextUrl = await uploadProfilePicture(file, userId);
        if (nextUrl) publish(userId, nextUrl); // every instance follows
        return nextUrl;
      } catch (uploadError) {
        setError(
          uploadError?.message || "Upload failed. Please try again."
        );
        return null;
      } finally {
        setUploading(false);
      }
    },
    [userId]
  );

  return { url, uploading, error, upload };
};
