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
// `authPending` covers BOTH still-resolving windows — the session check
// (status "loading") and the profile fetch after status flips to
// "authenticated" (profile lands a beat later) — either way a picture may
// exist, so callers hold the blurred placeholder instead of flashing
// cartoon → blur → photo.
export const useProfilePicture = (userId, authPending = false) => {
  const [url, setUrl] = useState(null);
  // True while we don't yet know "uploaded vs not" — callers blur their
  // placeholder for that window instead of showing the cartoon.
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authPending) {
      // Session check or profile fetch still in flight — assume a picture
      // may exist and keep the placeholder blurred until we know for sure.
      setUrl(null);
      setPending(true);
      return undefined;
    }
    if (!userId) {
      // Signed out (or profile not resolved yet): drop the last picture so
      // every mounted instance falls back to the cartoon avatar instead of
      // showing the previous session's upload.
      setUrl(null);
      setPending(false);
      return undefined;
    }
    const key = cacheKey(userId);
    let cancelled = false;
    const listener = (next) => {
      setUrl(next);
      setPending(false);
    };
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(listener);

    const shared = urlMemory.get(key);
    if (shared && Date.now() - shared.at < SHARE_TTL_MS) {
      setUrl(shared.url); // fresh enough — skip the duplicate lookup
      setPending(false);
    } else {
      setPending(true);
      setUrl(null);
      getProfilePictureUrl(userId)
        .then((nextUrl) => {
          if (cancelled) return;
          setPending(false);
          if (!nextUrl) return; // no upload — callers keep the cartoon
          urlMemory.set(key, { url: nextUrl, at: Date.now() });
          setUrl(nextUrl);
        })
        .catch(() => {
          // Keep the current picture — storage being down shouldn't blank the page.
          if (cancelled) return;
          setPending(false);
        });
    }

    return () => {
      cancelled = true;
      listeners.get(key)?.delete(listener);
    };
  }, [userId, authPending]);

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

  return { url, pending, uploading, error, upload };
};
