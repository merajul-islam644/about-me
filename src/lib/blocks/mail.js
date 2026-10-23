// Sends a contact-form message to the portfolio owner's inbox through the
// "Contact Mail Gate" webhook (logic workflow), NOT the SDK's mail client —
// that path is authenticated, so every signed-out visitor (and guest-link
// holder) would 401, and its wire format turns out broken anyway (Send
// rejects external recipients with a bogus "There is no recipient" 400).
// The webhook is public but locked down server-side: the recipient is
// hard-wired to the owner (no open relay), input is validated, and a
// honeypot field catches dumb bots.

// The public webhook of the "Contact Mail Gate" workflow — only resource
// ids in the URL, no secrets. A const on purpose, same reasoning as the
// invite webhook in invites.js.
const CONTACT_WEBHOOK_URL =
  "https://logic.seliseblocks.com/api/Workflow/webhook/D4f8caef7566149768aad0a6b61d7d48a/5ae7d54916cb45e0885a2940f4f92388/bdcc55736b67482fa0d6ba80d416a62b";

// Non-ASCII must leave the browser as literal \uXXXX text: the workflow
// execution pipeline corrupts raw multi-byte characters before they reach
// its code nodes (proven live — a Bangla message never even parsed). The
// workflow decodes those escapes into the REAL characters — the mail engine
// HTML-escapes "&" in dataContext values, so HTML entities would arrive as
// literal "&#x09b0;" text (proven in the inbox); only the character itself
// renders as Bangla. Quotes become ” and line breaks become U+2028 (a
// forced break in every browser), both JSON-safe without any escaping.
const asciiSafe = (text) =>
  String(text).replace(/[^\x20-\x7E]/g, (ch) =>
    `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`
  );

// The webhook replies { executionId, status, data: [ lastNodeOutput ] } —
// data[0] is { isSuccess: true } or { isSuccess: false, errors }.
// Browser requests carry an Origin, which the platform rejects (406)
// unless the public project key rides along as x-blocks-key.
export async function sendContactEmail({ fromName, fromEmail, message, website = "" }) {
  let response;
  try {
    response = await fetch(CONTACT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-blocks-key": import.meta.env.VITE_BLOCKS_PROJECT_KEY,
      },
      body: JSON.stringify({
        fromName: asciiSafe(fromName),
        fromEmail: asciiSafe(fromEmail),
        message: asciiSafe(message),
        website,
      }),
    });
  } catch {
    throw new Error("the message could not be sent (network error)");
  }
  if (!response.ok) {
    throw new Error(`the message was rejected (HTTP ${response.status})`);
  }
  const payload = await response.json().catch(() => null);
  const result = Array.isArray(payload?.data) ? payload.data[0] : payload;
  if (!result?.isSuccess) {
    throw new Error(
      result?.errors === "INVALID_INPUT"
        ? "The message could not be validated — please check the fields."
        : "The message could not be delivered — please try again."
    );
  }
}
