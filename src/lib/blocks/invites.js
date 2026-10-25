import { blocksClient } from "./client";
import { blocksConfig } from "./config";

// Guest invite links: the owner mints a random token into the Invites
// collection, and a signed-out visitor carrying it reads the owner's
// portfolio through the "Invite Content Gate" webhook. The webhook is the
// only public read path — a guest never gets a Data permission of their own.

const SCHEMA_NAME = "Invite";
const COLLECTION_NAME = "Invites";
const FIELDS = [
  "ItemId",
  "Token",
  "Label",
  "ExpiresAt",
  "Revoked",
  "Role",
  // The one CV this link shares (the CV's id inside the owner's content);
  // empty means nothing is shared and the guest sees an empty state.
  "CvId",
  // Who minted the link — the guest-links list is scoped to it (the site
  // owner sees everything, everyone else only their own links).
  "CreatedBy",
];

// Where a /invite/:token landing parks the token for the portfolio provider.
export const GUEST_INVITE_STORAGE_KEY = "guest-invite-token";

// The public webhook of the "Invite Content Gate" workflow — only resource
// ids in the URL, no secrets. A const on purpose: a VITE_ variable here
// would also have to be added to the release build's args, and a missed one
// silently bakes `undefined` into the deployed bundle.
const INVITE_WEBHOOK_URL =
  "https://logic.seliseblocks.com/api/Workflow/webhook/D4f8caef7566149768aad0a6b61d7d48a/a00645958186456fa75756ea24ca7eb3/7a509343434646d6b03f27867f1ea140";

const collection = () => blocksClient.data.collection(SCHEMA_NAME);

// The SDK wraps gateway responses as { data: { get<Collection>: { items } } }.
function listItems(response) {
  const payload = response?.data ?? response;
  const node = payload?.[`get${COLLECTION_NAME}`] ?? payload;
  return Array.isArray(node?.items) ? node.items : [];
}

function apiError(operation, error) {
  let detail = error?.body?.message || error?.message;
  if (!detail && error?.body) {
    detail =
      typeof error.body === "string"
        ? error.body
        : JSON.stringify(error.body).slice(0, 300);
  }
  return new Error(`Invite ${operation} failed: ${detail || "unknown error"}`);
}

// 48 characters over a 64-symbol alphabet straight from crypto.getRandomValues
// (64 divides 256, so the mapping is bias-free) — 288 bits of secret. The
// token IS the credential: it rides the link, and the webhook matches it.
function generateInviteToken(length = 48) {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function readGuestToken() {
  try {
    return localStorage.getItem(GUEST_INVITE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function storeGuestToken(token) {
  try {
    localStorage.setItem(GUEST_INVITE_STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode): the link still works for this page.
  }
}

export function clearGuestToken() {
  try {
    localStorage.removeItem(GUEST_INVITE_STORAGE_KEY);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

// Full shareable URL for a token — the owner copies this out of the admin UI.
export function inviteLinkFor(token) {
  return `${window.location.origin}/invite/${token}`;
}

// Guest side: trade the token for the owner's content. The webhook replies
// { executionId, status, data: [ lastNodeOutput ] } — data[0] carries
// { isSuccess, content } on a live token, { isSuccess: false, errors } on a
// dead one (INVITE_NOT_FOUND / INVITE_REVOKED / INVITE_EXPIRED). Browser
// requests carry an Origin, and the platform rejects those (406) unless the
// public project key rides along — the same x-blocks-key every other
// browser call already sends, read through blocksConfig (the deployed
// bundle has no build-time env; import.meta.env would bake `undefined`).
export async function fetchGuestContent(token) {
  let response;
  try {
    response = await fetch(INVITE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-blocks-key": blocksConfig.xBlocksKey,
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    throw new Error("the invite link could not be checked (network error)");
  }
  if (!response.ok) {
    throw new Error(`the invite link was rejected (HTTP ${response.status})`);
  }
  const payload = await response.json().catch(() => null);
  const result = Array.isArray(payload?.data) ? payload.data[0] : payload;
  if (!result?.isSuccess) {
    throw new Error(result?.errors || "INVITE_REJECTED");
  }
  return result;
}

// Owner side: mint a fresh link. `role` is the role slug the holder browses
// as (e.g. "dataviewer", "clouduser"); empty means a plain guest. `cvId`
// picks the one CV the webhook will share with this link — empty (the
// default) shares nothing and the guest sees an empty state. The platform
// stamps CreatedBy with the minting user's id on its own — the links list
// scopes on that. Returns the raw token — the caller builds the shareable
// URL with inviteLinkFor.
export async function createGuestInvite({
  label,
  role = "",
  expiresInDays = 0,
  cvId = "",
}) {
  const row = { Token: generateInviteToken(), Label: label, Revoked: false };
  if (role) row.Role = role;
  if (cvId) row.CvId = cvId;
  if (expiresInDays > 0) {
    row.ExpiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    ).toISOString();
  }
  try {
    await collection().create(row);
  } catch (error) {
    throw apiError("create", error);
  }
  return row.Token;
}

export async function listGuestInvites() {
  try {
    const response = await collection().list({
      fields: FIELDS,
      pageNo: 1,
      pageSize: 100,
    });
    return listItems(response);
  } catch (error) {
    throw apiError("lookup", error);
  }
}

// Revoking is a one-way flip: the row (and its token in old shared links)
// stays, but the webhook rejects it from then on.
export async function revokeGuestInvite(itemId) {
  try {
    await collection().update(itemId, { Revoked: true });
  } catch (error) {
    throw apiError("revoke", error);
  }
}

// Retarget a live link to a different CV (or to none, with "") — the
// webhook reads CvId on every guest page load, so the change lands on the
// guest's very next visit without touching the link or token.
export async function setInviteCv(itemId, cvId) {
  try {
    await collection().update(itemId, { CvId: cvId || "" });
  } catch (error) {
    throw apiError("CV update", error);
  }
}
