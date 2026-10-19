import { blocksClient } from "../lib/blocks/client";

// Every Portfolio row: one per signed-in user. `Content` is the whole
// portfolio as a JSON string (the schema has no JSON field type).
const SCHEMA_NAME = "Portfolio";
const COLLECTION_NAME = "Portfolios";
// list() selects ItemId only unless fields are passed explicitly.
const FIELDS = ["ItemId", "UserId", "DisplayName", "Content"];

const collection = () => blocksClient.data.collection(SCHEMA_NAME);

// The SDK wraps gateway responses as { data: { get<Collection>: { items } } } —
// reading response.items directly would always look empty and re-create rows.
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
  return new Error(`Portfolio ${operation} failed: ${detail || "unknown error"}`);
}

export async function getPortfolioRow(userId) {
  try {
    const response = await collection().list({
      filter: JSON.stringify({ UserId: userId }),
      fields: FIELDS,
      pageNo: 1,
      pageSize: 5,
    });
    const items = listItems(response);
    return items[0] ?? null;
  } catch (error) {
    throw apiError("lookup", error);
  }
}

export async function createPortfolioRow(userId, displayName, contentString) {
  try {
    return await collection().create({
      UserId: userId,
      DisplayName: displayName,
      Content: contentString,
    });
  } catch (error) {
    throw apiError("create", error);
  }
}

export async function savePortfolioRow(itemId, contentString, displayName) {
  try {
    return await collection().update(itemId, {
      Content: contentString,
      DisplayName: displayName,
    });
  } catch (error) {
    throw apiError("save", error);
  }
}
