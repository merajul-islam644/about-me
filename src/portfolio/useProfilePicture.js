import { useCallback, useEffect, useState } from "react";
import {
  getProfilePictureUrl,
  uploadProfilePicture,
} from "../lib/blocks/storage";

// Shared picture state for Hero and About: the current version's pre-signed
// URL (null until storage answers — callers keep their bundled fallback),
// plus the upload flow. `userId` comes from useAuth().profile; the effect
// re-runs when the profile arrives after the session check.
export const useProfilePicture = (userId) => {
  const [url, setUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    getProfilePictureUrl(userId)
      .then((nextUrl) => {
        if (!cancelled && nextUrl) setUrl(nextUrl);
      })
      .catch(() => {
        // Keep the current picture — storage being down shouldn't blank the page.
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const upload = useCallback(
    async (file) => {
      if (!file || !userId) return null;
      setUploading(true);
      setError(null);
      try {
        const nextUrl = await uploadProfilePicture(file, userId);
        setUrl(nextUrl);
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
