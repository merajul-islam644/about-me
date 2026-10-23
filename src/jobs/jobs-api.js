import { blocksClient } from "../lib/blocks/client";

// Job Alerts: one JobPreference row per user (the keywords the workflow
// matches incoming community posts against) and the MatchedJob rows the
// workflow wrote when a post matched. Same Data Gateway patterns as the
// payments API.
const PREF_SCHEMA = "JobPreference";
const JOB_SCHEMA = "MatchedJob";

const PREF_FIELDS = ["ItemId", "UserId", "Keywords", "Sources"];
const JOB_FIELDS = [
  "ItemId",
  "UserId",
  "Title",
  "Source",
  "Url",
  "Snippet",
  "MatchedOn",
  "IsRead",
  // Platform column — the card's "3h ago" label and the newest-first sort
  // both read it; the list only returns what is named here.
  "CreatedDate",
];

// list() selects ItemId only unless fields are passed explicitly, and wraps
// responses as { data: { get<Collection>: { items } } } — reading
// response.items directly would always look empty.
function listItems(response, collectionName) {
  const payload = response?.data ?? response;
  const node = payload?.[`get${collectionName}`] ?? payload;
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
  return new Error(`Job alerts ${operation} failed: ${detail || "unknown error"}`);
}

const prefCollection = () => blocksClient.data.collection(PREF_SCHEMA);
const jobCollection = () => blocksClient.data.collection(JOB_SCHEMA);

export async function getJobPreference(userId) {
  try {
    const response = await prefCollection().list({
      filter: JSON.stringify({ UserId: userId }),
      fields: PREF_FIELDS,
      pageNo: 1,
      pageSize: 5,
    });
    return listItems(response, "JobPreferences")[0] ?? null;
  } catch (error) {
    throw apiError("preferences lookup", error);
  }
}

export async function saveJobPreference(itemId, patch) {
  try {
    return await prefCollection().update(itemId, patch);
  } catch (error) {
    throw apiError("preferences save", error);
  }
}

// Returns the user's preference row, creating an empty-keyword default if
// missing — the workflow reads this collection, so a row existing is not
// required, but the settings card edits through one.
export async function ensureJobPreference(userId) {
  const existing = await getJobPreference(userId);
  if (existing) return existing;
  try {
    await prefCollection().create({ UserId: userId, Keywords: "", Sources: "" });
  } catch {
    // A race with another tab's create — the row exists now either way.
  }
  const created = await getJobPreference(userId);
  if (!created) throw new Error("Job preferences row could not be created.");
  return created;
}

export async function getMatchedJobs(userId) {
  try {
    const response = await jobCollection().list({
      filter: JSON.stringify({ UserId: userId }),
      fields: JOB_FIELDS,
      pageNo: 1,
      pageSize: 100,
    });
    return listItems(response, "MatchedJobs");
  } catch (error) {
    throw apiError("lookup", error);
  }
}

export async function markJobRead(itemId) {
  try {
    return await jobCollection().update(itemId, { IsRead: "true" });
  } catch (error) {
    throw apiError("mark read", error);
  }
}

export async function deleteMatchedJob(itemId) {
  try {
    return await jobCollection().delete(itemId);
  } catch (error) {
    throw apiError("delete", error);
  }
}

// Feed pollers pack the real source into MatchedOn as a "<source> |<keywords>"
// marker — the gateway overwrites the Source column with a node id on
// workflow inserts, so the marker is the trustworthy label (same mapping the
// Job Alerts page renders as its badge).
const SOURCE_ALIASES = { rk: "remoteok", rv: "remotive", ar: "arbeitnow" };

export const jobSourceLabel = (job) => {
  const marker = String(job?.MatchedOn ?? "").match(/^([a-z0-9]+)\s*\|\s*/);
  if (!marker) return String(job?.Source || "webhook");
  return SOURCE_ALIASES[marker[1]] ?? marker[1];
};
