// One-off builder: writes blocks/contact-mail-gate.json with the project key
// and workflow client credential injected from .env.local — the same pattern
// as build-invite-workflow.mjs, but a SEPARATE workflow so the invite gate
// stays untouched. Run: node blocks/build-contact-mail-workflow.mjs
import { readFileSync, writeFileSync } from "node:fs";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const projectKey = env.VITE_BLOCKS_PROJECT_KEY;
const clientId = env.BLOCKS_WORKFLOW_CLIENT_ID;
const clientSecret = env.BLOCKS_WORKFLOW_CLIENT_SECRET;
for (const [name, value] of [
  ["VITE_BLOCKS_PROJECT_KEY", projectKey],
  ["BLOCKS_WORKFLOW_CLIENT_ID", clientId],
  ["BLOCKS_WORKFLOW_CLIENT_SECRET", clientSecret],
]) {
  if (!value) {
    console.error(`missing ${name} in .env.local`);
    process.exit(1);
  }
}

// The recipient is FIXED here on purpose: the webhook must never become an
// open relay that mails whatever address a caller names. Same constant the
// app seeds content with (src/content/merajPortfolio.js).
const OWNER_EMAIL = "merajzoarder6@gmail.com";

// The code-node scripts below avoid every backslash literal: `workflow
// import` has collapsed \n escapes into real newlines before (breaking JS
// string literals), so special characters come from fromCharCode instead.
const validateScript = [
  "var j = $json ?? {};",
  "var body = j.output ?? j.body ?? j;",
  "var name = String(body.fromName ?? '').trim();",
  "var email = String(body.fromEmail ?? '').trim();",
  "var message = String(body.message ?? '').trim();",
  "var honeypot = String(body.website ?? '').trim();",
  "if (honeypot) return { valid: false };",
  "var B = String.fromCharCode(92);",
  // The FRONTEND sends non-ASCII as literal \uXXXX text (the execution
  // pipeline corrupts raw multi-byte characters before they even reach a
  // code node — proven live). Decode those back to REAL characters here:
  // the mail engine HTML-escapes & in dataContext values (HTML entities
  // arrived as literal "&#x09b0;" text — proven in the inbox 2026-10-23)
  // and its substitution leaves \n / \" escapes intact too, so the only
  // thing that renders as Bangla is the character itself. Anything that
  // would break the JSON string literal gets replaced instead of escaped:
  // double quote → ” (JSON-safe, renders fine), backslash → /, and line
  // breaks → U+2028 LINE SEPARATOR (a forced break in every browser that
  // never needs JSON escaping). Control chars flatten to spaces.
  "var Q = String.fromCharCode(34);",
  // Match the literal 7-char sequence backslash-u-hex: the doubled B makes
  // the regex match ONE real backslash, not a regex unicode escape.
  "var reU = new RegExp(B + B + 'u([0-9a-fA-F]{4})', 'g');",
  "var decode = function (s) {",
  "  return String(s).replace(reU, function (m, h) {",
  "    return String.fromCharCode(parseInt(h, 16));",
  "  });",
  "};",
  "var enc = function (s) {",
  "  var out = '';",
  "  var t = String(s);",
  "  for (var i = 0; i < t.length; i++) {",
  "    var c = t.charCodeAt(i);",
  "    if (c === Q.charCodeAt(0)) { out += String.fromCharCode(8221); }",
  // Backslash → "/": a raw backslash could pair with the next char into a
  // JSON escape (\n, \u12x4) and 400 the whole mail; "/" is readable and
  // unambiguous under every layer of the pipeline.
  "    else if (c === B.charCodeAt(0)) { out += '/'; }",
  // LF and lone CR → U+2028 LINE SEPARATOR: JSON only forbids U+0000–001F
  // unescaped, and browsers render U+2028 as a forced line break — so
  // multi-line messages keep their breaks without any JSON escaping.
  "    else if (c === 10 || c === 13) { out += String.fromCharCode(8232); }",
  "    else if (c < 32 || c === 127) { out += ' '; }",
  "    else { out += t.charAt(i); }",
  "  }",
  "  return out;",
  "};",
  "var fix = function (s) { return enc(decode(s)); };",
  // Length checks run on the DECODED text: the frontend sends \uXXXX, where
  // one Bangla char counts as six — validating pre-decode rejected a plain
  // 16-char Bangla name as 96 chars ("could not be validated", 2026-10-23).
  "name = fix(name);",
  "email = fix(email);",
  "message = fix(message);",
  "var re = new RegExp('^' + B + 'S+@' + B + 'S+' + B + '.' + B + 'S+$');",
  "if (!name || name.length > 80) return { valid: false };",
  "if (!re.test(email) || email.length > 200) return { valid: false };",
  "if (!message || message.length > 4000) return { valid: false };",
  "return { valid: true, safeName: name, safeEmail: email, safeMessage: message };",
].join("\n");

const mailBody = JSON.stringify({
  language: "en",
  purpose: "PortfolioContact",
  to: [OWNER_EMAIL],
  replyTo: ["{{$json.safeEmail}}"],
  subjectDataContext: {
    FromName: "{{$json.safeName}}",
    FromEmail: "{{$json.safeEmail}}",
  },
  bodyDataContext: {
    FromName: "{{$json.safeName}}",
    FromEmail: "{{$json.safeEmail}}",
    Message: "{{$json.safeMessage}}",
  },
  isTestMail: false,
});

const workflow = {
  name: "Contact Mail Gate",
  settings: {},
  nodes: [
    {
      id: "c1",
      name: "Contact Hook",
      category: "trigger",
      type: "webhook",
      version: "v1",
      position: { x: 0, y: 0 },
      parameters: {
        httpMethod: "POST",
        authType: "none",
        httpResponseMode: "last",
        httpResponseData: "all",
        organizationId: "",
        roles: { operator: "all", values: [] },
        permissions: { operator: "any", values: [] },
        authorizationMode: "RolesOnly",
        path: "contact",
      },
      settings: {},
      pinData: null,
    },
    {
      id: "c2",
      name: "Validate Input",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 240, y: 0 },
      parameters: {
        mode: "each",
        language: "js",
        script: validateScript,
      },
      settings: {},
      pinData: null,
    },
    {
      id: "c3",
      name: "Input OK?",
      category: "logic",
      type: "if",
      version: "v1",
      position: { x: 480, y: 0 },
      parameters: {
        conditionType: "all",
        conditions: [
          { left: "{{$json.valid}}", operator: "equals", right: "true", type: "string" },
        ],
      },
      settings: {},
      pinData: null,
    },
    {
      id: "c4",
      name: "Send Mail",
      category: "action",
      type: "httpRequest",
      version: "v1",
      position: { x: 720, y: -80 },
      parameters: {
        httpMethod: "POST",
        // SendToAny, not Send: Send rejects external recipients with a
        // bogus "There is no recipient" 400 (proven live 2026-10-23);
        // SendToAny delivers to any address and is what carries the
        // tenant's mail config + PortfolioContact template.
        url: "https://blocksapi.slsblx.com/logic/v4/Mail/SendToAny",
        haveQueryParameters: false,
        haveHeaders: true,
        headers: { "x-blocks-key": projectKey },
        authenticationType: "clientCredential",
        clientId,
        clientSecret,
        haveBody: true,
        bodyContentType: "json",
        body: mailBody,
      },
      settings: {},
      pinData: null,
    },
    {
      id: "c5",
      name: "Mail Sent?",
      category: "logic",
      type: "if",
      version: "v1",
      position: { x: 960, y: -80 },
      parameters: {
        conditionType: "all",
        conditions: [
          { left: "{{$json.isSuccess}}", operator: "equals", right: "true", type: "string" },
        ],
      },
      settings: {},
      pinData: null,
    },
    {
      id: "c6",
      name: "Done",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 1200, y: -160 },
      parameters: {
        mode: "each",
        language: "js",
        script: "return { isSuccess: true };",
      },
      settings: {},
      pinData: null,
    },
    {
      id: "c7",
      name: "Mail Failed",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 1200, y: -80 },
      parameters: {
        mode: "each",
        language: "js",
        script: "return { isSuccess: false, errors: 'MAIL_FAILED' };",
      },
      settings: {},
      pinData: null,
    },
    {
      id: "c8",
      name: "Reject",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 720, y: 80 },
      parameters: {
        mode: "each",
        language: "js",
        script: "return { isSuccess: false, errors: 'INVALID_INPUT' };",
      },
      settings: {},
      pinData: null,
    },
  ],
  edges: [
    { id: "ce1", source: "c1", target: "c2", sourceHandle: "source", targetHandle: "target" },
    { id: "ce2", source: "c2", target: "c3", sourceHandle: "source", targetHandle: "target" },
    { id: "ce3", source: "c3", target: "c4", sourceHandle: "if-true", targetHandle: "target" },
    { id: "ce4", source: "c4", target: "c5", sourceHandle: "source", targetHandle: "target" },
    { id: "ce5", source: "c5", target: "c6", sourceHandle: "if-true", targetHandle: "target" },
    { id: "ce6", source: "c5", target: "c7", sourceHandle: "if-false", targetHandle: "target" },
    { id: "ce7", source: "c3", target: "c8", sourceHandle: "if-false", targetHandle: "target" },
  ],
};

const out = new URL("contact-mail-gate.json", import.meta.url);
writeFileSync(out, JSON.stringify(workflow, null, 2));
console.log(
  `wrote ${out.pathname} — secrets injected (key length ${projectKey.length}, client ${clientId.slice(0, 8)}…, recipient ${OWNER_EMAIL})`
);
