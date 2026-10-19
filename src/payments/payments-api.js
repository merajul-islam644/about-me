import { blocksClient } from "../lib/blocks/client";

// Manual payments: a user submits a bKash/Nagad transaction ID, the admin
// approves or rejects it in the Payments tab, and approvals grant Pro until
// ApprovedUntil. PaymentSetting is a singleton row (unique Key) holding the
// numbers, price and duration — editable in-app so changing the price never
// needs a redeploy.
const REQUEST_SCHEMA = "PaymentRequest";
const REQUEST_COLLECTION = "PaymentRequests";
const SETTING_SCHEMA = "PaymentSetting";
const SETTING_COLLECTION = "PaymentSettings";

// list() selects ItemId only unless fields are passed explicitly. System
// fields like CreatedDate are deliberately not requested — if the gateway
// returns them anyway the UI uses them, but asking for one could fail the
// whole list.
const REQUEST_FIELDS = [
  "ItemId",
  "UserId",
  "UserEmail",
  "Method",
  "TxnId",
  "Amount",
  "Status",
  "ApprovedUntil",
  "ReviewNote",
];
const SETTING_FIELDS = [
  "ItemId",
  "Key",
  "BkashNumber",
  "NagadNumber",
  "PriceAmount",
  "Currency",
  "DurationDays",
  "Instructions",
];

export const PAYMENT_SETTINGS_KEY = "settings";

// The row created when no settings exist yet — the admin edits these in the
// Approvals tab, so the placeholders only need to be harmless defaults.
export const DEFAULT_PAYMENT_SETTINGS = {
  Key: PAYMENT_SETTINGS_KEY,
  BkashNumber: "",
  NagadNumber: "",
  PriceAmount: "299",
  Currency: "BDT",
  DurationDays: "365",
  Instructions:
    "Send the Pro price to one of the numbers above (Send Money), then copy the Transaction ID from the confirmation SMS and submit it below. Pro unlocks as soon as your payment is verified.",
};

const requestCollection = () => blocksClient.data.collection(REQUEST_SCHEMA);
const settingCollection = () => blocksClient.data.collection(SETTING_SCHEMA);

// The SDK wraps gateway responses as { data: { get<Collection>: { items } } } —
// reading response.items directly would always look empty.
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
  return new Error(`Payments ${operation} failed: ${detail || "unknown error"}`);
}

export async function getMyPaymentRequests(userId) {
  try {
    const response = await requestCollection().list({
      filter: JSON.stringify({ UserId: userId }),
      fields: REQUEST_FIELDS,
      pageNo: 1,
      pageSize: 50,
    });
    return listItems(response, REQUEST_COLLECTION);
  } catch (error) {
    throw apiError("lookup", error);
  }
}

// The admin review queue — every user's requests, newest first on the client.
export async function getAllPaymentRequests() {
  try {
    const response = await requestCollection().list({
      fields: REQUEST_FIELDS,
      pageNo: 1,
      pageSize: 200,
    });
    return listItems(response, REQUEST_COLLECTION);
  } catch (error) {
    throw apiError("lookup", error);
  }
}

export async function createPaymentRequest({ userId, userEmail, method, txnId, amount }) {
  try {
    return await requestCollection().create({
      UserId: userId,
      UserEmail: userEmail,
      Method: method,
      TxnId: txnId,
      Amount: amount,
      Status: "pending",
      ApprovedUntil: "",
      ReviewNote: "",
    });
  } catch (error) {
    throw apiError("submit", error);
  }
}

// patch: { Status, ApprovedUntil?, ReviewNote? } — the approve/reject write.
export async function updatePaymentRequest(itemId, patch) {
  try {
    return await requestCollection().update(itemId, patch);
  } catch (error) {
    throw apiError("review", error);
  }
}

export async function getPaymentSettings() {
  try {
    const response = await settingCollection().list({
      filter: JSON.stringify({ Key: PAYMENT_SETTINGS_KEY }),
      fields: SETTING_FIELDS,
      pageNo: 1,
      pageSize: 5,
    });
    return listItems(response, SETTING_COLLECTION)[0] ?? null;
  } catch (error) {
    throw apiError("settings lookup", error);
  }
}

export async function savePaymentSettings(itemId, patch) {
  try {
    return await settingCollection().update(itemId, patch);
  } catch (error) {
    throw apiError("settings save", error);
  }
}

// Returns the settings row, creating the default one if missing. Two tabs can
// race the create — the loser's 409 is swallowed and it re-reads the winner's
// row instead.
export async function ensurePaymentSettings() {
  const existing = await getPaymentSettings();
  if (existing) return existing;
  try {
    await settingCollection().create(DEFAULT_PAYMENT_SETTINGS);
  } catch {
    // Almost certainly the unique-Key race — the row exists now either way.
  }
  const created = await getPaymentSettings();
  if (!created) throw new Error("Payments settings row could not be created.");
  return created;
}
