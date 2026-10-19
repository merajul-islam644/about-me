import { blocksClient } from "./client";

// Every signed-in user gets their own picture file inside the one shared
// Cloud/profile folder, named `profile-picture-<userId>.*`. Each upload
// versions that same file, so there is exactly one current picture per user.
//
// The directory id is fixed here on purpose: root-level listing is invisible
// to ordinary signed-in users (get-objects returns an empty list at the root),
// while by-id reads, child listings, and uploads all work. Moving to another
// project? Recreate the folder there and update this id.
const CONFIGURATION_NAME = "Default";
const PROFILE_DIRECTORY_ID = "5124daf6-d9e3-46ce-87c1-63080e3921ce";
const LEGACY_PREFIX = "profile-picture";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS_BY_TYPE = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// The file id per user, remembered after the first lookup this session. New
// versions keep the same item id, so entries stay valid across uploads.
const fileIdCache = new Map();

const cacheKey = (userId) => (userId ? String(userId).toLowerCase() : "");

function picturePrefix(userId) {
  return userId ? `${LEGACY_PREFIX}-${String(userId).toLowerCase()}` : LEGACY_PREFIX;
}

function extensionOf(file) {
  const fromName = file.name?.match(/(\.[a-z0-9]+)$/i)?.[1];
  if (fromName) return fromName.toLowerCase();
  return EXTENSIONS_BY_TYPE[file.type] ?? "";
}

async function findProfileFile(userId) {
  const prefix = picturePrefix(userId);
  const response = await blocksClient.data.objects.list({
    parentDirectoryId: PROFILE_DIRECTORY_ID,
    type: "file",
  });
  // The data client throws BlocksApiError on non-2xx, so a 2xx body without
  // an items array is unexpected — surface it verbatim for diagnosis.
  if (!Array.isArray(response?.items)) {
    throw new Error(
      `Storage listing returned an unexpected response: ${JSON.stringify(response)?.slice(0, 300)}`
    );
  }
  const match =
    response.items.find((item) =>
      item.name?.toLowerCase().startsWith(prefix)
    ) ?? null;
  fileIdCache.set(cacheKey(userId), match?.itemId ?? null);
  return match;
}

// Returns a short-lived pre-signed read URL (~5 minutes), so never cache the
// result — fetch fresh on page load and after each upload.
export async function getProfilePictureUrl(userId) {
  const cached = fileIdCache.get(cacheKey(userId));
  const file = cached ? { itemId: cached } : await findProfileFile(userId);
  if (!file?.itemId) return null;
  const response = await blocksClient.data.files.get(file.itemId, {
    configurationName: CONFIGURATION_NAME,
  });
  return typeof response?.url === "string" ? response.url : null;
}

export async function uploadProfilePicture(file, userId) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPG, WebP or GIF).");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("That image is over 5 MB — please pick a smaller one.");
  }

  const existing = await findProfileFile(userId);
  const request = {
    name: `${picturePrefix(userId)}${extensionOf(file)}`,
    parentDirectoryId: PROFILE_DIRECTORY_ID,
    configurationName: CONFIGURATION_NAME,
    accessModifier: "Private",
    contentType: file.type,
  };
  // An existing file becomes a new version instead of a second file.
  if (existing?.itemId) request.itemId = existing.itemId;
  // Best-effort ownership tag; the filename prefix stays the lookup key.
  if (userId) request.additionalProperties = { userId: String(userId) };

  const presigned = await blocksClient.data.files.presignedUploadUrl(request);
  const uploadUrl = presigned?.uploadUrl ?? presigned?.url;
  if (typeof uploadUrl !== "string") {
    throw new Error("Storage did not return an upload URL. Try again.");
  }
  if (presigned.fileId) {
    fileIdCache.set(cacheKey(userId), presigned.fileId);
  }

  // Provider-direct pre-signed PUT — no Blocks auth headers by design. Echo
  // back the headers the presign demanded (e.g. x-ms-blob-type).
  await blocksClient.data.files.uploadToUrl({
    url: uploadUrl,
    body: file,
    contentType: file.type,
    headers: presigned?.requiredHeaders,
  });

  const url = await getProfilePictureUrl(userId);
  if (!url) {
    throw new Error("Upload finished but the picture could not be loaded.");
  }
  return url;
}
