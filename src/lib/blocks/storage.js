import { blocksClient } from "./client";
import { PROJECT_ORG_ID } from "./iam";

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

// Fired at most once per page session, from the creator's own listing (the
// only vantage that sees the folder) — so the folder self-heals its ACL on
// any owner page load, no upload needed. A viewer's listing comes back
// empty, so the zero-item guard keeps them from spamming denied writes.
let directoryShareAttempted = false;

// One attempt per FILE per session — a landed file share surfaces the
// picture through the caller's `shared` listing even when the folder
// itself stays sealed to them.
const fileSharesAttempted = new Set();

const cacheKey = (userId) => (userId ? String(userId).toLowerCase() : "");

function picturePrefix(userId) {
  return userId ? `${LEGACY_PREFIX}-${String(userId).toLowerCase()}` : LEGACY_PREFIX;
}

function extensionOf(file) {
  const fromName = file.name?.match(/(\.[a-z0-9]+)$/i)?.[1];
  if (fromName) return fromName.toLowerCase();
  return EXTENSIONS_BY_TYPE[file.type] ?? "";
}

// Fire every ACL flavor we have on one resource, all best-effort: `share`
// to Everyone (the portal's share) AND to the project Organization (the
// invited viewer is a member of it; the owner is not), plus the explicit
// access-policy write (`grantAccess`, effect Allow) — × View + Download.
// A 2026-10-22 session proved folder-scoped writes can 403 even when the
// caller's role holds the permission (resource-scoped manage rights — the
// folder outlives its creator), while the CREATOR-made files accept them;
// hence the per-file firing too. Failures log but never throw.
async function fireAclWrites(resourceId, resourceType, label) {
  const objects = blocksClient.data.objects;
  const attempts = [
    ["share Everyone View", () => objects.share({ resourceId, resourceType, principalType: "Everyone", permission: "View" })],
    ["share Everyone Download", () => objects.share({ resourceId, resourceType, principalType: "Everyone", permission: "Download" })],
    ["share Organization View", () => objects.share({ resourceId, resourceType, principalType: "Organization", principalId: PROJECT_ORG_ID, permission: "View" })],
    ["share Organization Download", () => objects.share({ resourceId, resourceType, principalType: "Organization", principalId: PROJECT_ORG_ID, permission: "Download" })],
    // Edit is what makes the folder USABLE by members: the upload presign
    // needs write on the directory, and without this grant every non-creator
    // member's picture upload dies with `access: forbidden`. Only the
    // folder creator's session can land it — everyone else's attempt 403s
    // into the warn below and harmlessly retries another day.
    ["share Organization Edit", () => objects.share({ resourceId, resourceType, principalType: "Organization", principalId: PROJECT_ORG_ID, permission: "Edit" })],
    ["policy Everyone View", () => objects.grantAccess({ resourceId, resourceType, principalType: "Everyone", permission: "View", effect: "Allow" })],
    ["policy Everyone Download", () => objects.grantAccess({ resourceId, resourceType, principalType: "Everyone", permission: "Download", effect: "Allow" })],
    ["policy Organization View", () => objects.grantAccess({ resourceId, resourceType, principalType: "Organization", principalId: PROJECT_ORG_ID, permission: "View", effect: "Allow" })],
    ["policy Organization Download", () => objects.grantAccess({ resourceId, resourceType, principalType: "Organization", principalId: PROJECT_ORG_ID, permission: "Download", effect: "Allow" })],
    ["policy Organization Edit", () => objects.grantAccess({ resourceId, resourceType, principalType: "Organization", principalId: PROJECT_ORG_ID, permission: "Edit", effect: "Allow" })],
  ];
  for (const [name, attempt] of attempts) {
    try {
      await attempt();
    } catch (error) {
      console.warn(
        `[profile-picture] ${label} ${name} failed:`,
        error?.body ? JSON.stringify(error.body).slice(0, 200) : error?.message || error
      );
    }
  }
}

async function shareProfileDirectory() {
  await fireAclWrites(PROFILE_DIRECTORY_ID, "Directory", "directory");
}

async function findProfileFile(userId) {
  const prefix = picturePrefix(userId);
  let match = null;
  try {
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
    if (!directoryShareAttempted && response.items.length > 0) {
      directoryShareAttempted = true;
      void shareProfileDirectory();
    }
    // The listed files were created HERE (owner sessions), so their ACL
    // writes usually land even when the folder resists — and a landed file
    // share is what later surfaces each picture through a reader's
    // `shared` listing. One attempt per file per session.
    for (const item of response.items) {
      if (item.itemId && !fileSharesAttempted.has(item.itemId)) {
        fileSharesAttempted.add(item.itemId);
        void fireAclWrites(item.itemId, "File", `file ${(item.name ?? "").slice(0, 28)}`);
      }
    }
    match =
      response.items.find((item) =>
        item.name?.toLowerCase().startsWith(prefix)
      ) ?? null;
  } catch (listError) {
    // Folder ACL is creator-scoped: when it bites harder it 403s the child
    // listing outright — say so, then let the probes below take over.
    console.warn(
      "[profile-picture] listing failed, trying fallbacks:",
      listError?.body?.message || listError?.message || listError
    );
  }
  // Run the alternate paths whenever the listing threw OR came back without
  // a match — a folder sealed to this account reads as a clean-but-EMPTY
  // list (2026-10-22), which must fall through exactly like an error.
  if (!match) {
    const objects = blocksClient.data.objects;
    const probes = [
      ["search in folder", () => objects.search({ directoryId: PROFILE_DIRECTORY_ID, query: prefix, type: "file" })],
      ["global search", () => objects.search({ query: prefix, type: "file" })],
      ["shared objects", () => objects.shared({ type: "file" })],
    ];
    for (const [label, probe] of probes) {
      if (match) break;
      try {
        const response = await probe();
        const items = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];
        match =
          items.find((item) => item.name?.toLowerCase().startsWith(prefix)) ?? null;
      } catch (probeError) {
        console.warn(
          `[profile-picture] ${label} failed:`,
          probeError?.body?.message || probeError?.message || probeError
        );
      }
    }
  }
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
    // "Public", not "Private": a Private file reads back only for its
    // CREATOR — which broke owner-uploaded pictures, since the file's
    // creator (the owner) isn't the user whose face it carries. Avatars are
    // shown on the public site anyway; the read is a ~5-minute presigned
    // URL, so exposure stays bounded.
    accessModifier: "Public",
    contentType: file.type,
  };
  // An existing file becomes a new version instead of a second file.
  if (existing?.itemId) request.itemId = existing.itemId;
  // Best-effort ownership tag; the filename prefix stays the lookup key.
  if (userId) request.additionalProperties = { userId: String(userId) };

  const presigned = await blocksClient.data.files.presignedUploadUrl(request);
  const uploadUrl = presigned?.uploadUrl ?? presigned?.url;
  if (typeof uploadUrl !== "string" || !uploadUrl) {
    // A refused presign replies isSuccess:false with an EMPTY-string url —
    // typeof still calls that "string", so the PUT would fly at a garbage
    // target and die as a cryptic "Blocks API 404". Surface the reason.
    throw new Error(
      presigned?.errors
        ? `Storage refused the upload (${JSON.stringify(presigned.errors)}).`
        : "Storage did not return an upload URL. Try again."
    );
  }
  if (presigned.fileId) {
    fileIdCache.set(cacheKey(userId), presigned.fileId);
    // The freshly uploaded version shares the same item id; open it up
    // right away so a viewer reloading moments later can already read it.
    void fireAclWrites(presigned.fileId, "File", "uploaded file");
  }

  // Provider-direct pre-signed PUT — no Blocks auth headers by design. Echo
  // back the headers the presign demanded (e.g. x-ms-blob-type). The presign
  // often replies with none at all (null), and fetch's Headers constructor
  // rejects null with a TypeError — hand it an empty record instead.
  await blocksClient.data.files.uploadToUrl({
    url: uploadUrl,
    body: file,
    contentType: file.type,
    headers: presigned?.requiredHeaders ?? {},
  });

  // The uploader's own read works regardless, but everyone else needs the
  // folder shared — fire it with every upload so the first one fixes it.
  await shareProfileDirectory();

  const url = await getProfilePictureUrl(userId);
  if (!url) {
    throw new Error("Upload finished but the picture could not be loaded.");
  }
  return url;
}
