// One-off builder: writes blocks/invite-content-gate.json with the project key
// and workflow client credential injected from the environment (or .env.local
// as the local fallback) — so no secret ever lands in the file's source or
// the terminal output. Run: node blocks/build-invite-workflow.mjs
import { writeFileSync } from "node:fs";
import { requireCredentials } from "./env.mjs";

const {
  VITE_BLOCKS_PROJECT_KEY: projectKey,
  BLOCKS_WORKFLOW_CLIENT_ID: clientId,
  BLOCKS_WORKFLOW_CLIENT_SECRET: clientSecret,
} = requireCredentials([
  "VITE_BLOCKS_PROJECT_KEY",
  "BLOCKS_WORKFLOW_CLIENT_ID",
  "BLOCKS_WORKFLOW_CLIENT_SECRET",
]);

// The owner whose content guest links reveal — same constant the app seeds with.
const MERAJ_USER_ID = "87e107b5-7be2-4964-a461-0a46348d3ef2";

// Gateway reads list WITHOUT a filter: the gateway silently ignores the
// {"Field":"value"} filter shape (proven live — every token matched the
// oldest revoked row), so the code nodes match token/UserId themselves,
// the same client-side pattern the Job Alert webhook uses.
const gatewayRead = (operationName, fields) =>
  JSON.stringify({
    operationName,
    query: `query ${operationName}($input: DynamicQueryInput) { ${operationName}(input: $input) { items { ${fields} } totalCount } }`,
    variables: { input: { pageNo: 1, pageSize: 100 } },
  });

const workflow = {
  name: "Invite Content Gate",
  settings: {},
  nodes: [
    {
      id: "n1",
      name: "Invite Hook",
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
        path: "invite",
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n2",
      name: "Parse Token",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 240, y: 0 },
      parameters: {
        mode: "each",
        language: "js",
        script:
          'const j = $json ?? {};\nconst body = j.output ?? j.body ?? j;\nreturn { token: String(body.token ?? "") };',
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n3",
      name: "Find Invite",
      category: "action",
      type: "httpRequest",
      version: "v1",
      position: { x: 480, y: 0 },
      parameters: {
        httpMethod: "POST",
        url: "https://blocksapi.slsblx.com/data/v4/gateway",
        haveQueryParameters: false,
        haveHeaders: true,
        headers: { "x-blocks-key": projectKey },
        authenticationType: "clientCredential",
        clientId,
        clientSecret,
        haveBody: true,
        bodyContentType: "json",
        body: gatewayRead("getInvites", "ItemId Token Label ExpiresAt Revoked Role CvId CreatedBy"),
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n4",
      name: "Validate Invite",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 720, y: 0 },
      parameters: {
        mode: "each",
        language: "js",
        script: `var resp = ($node["Find Invite"] ?? {}).json ?? {};\nvar out = resp.output ?? resp;\nvar items = (((out.data ?? {}).getInvites ?? {}).items) ?? [];\nvar parsed = (($node["Parse Token"] ?? {}).json ?? {});\nparsed = parsed.output ?? parsed;\nvar token = String(parsed.token ?? "");\nvar inv = items.find(function (r) { return String(r.Token ?? "") === token; });\nif (!inv) return { valid: false, reason: "not_found" };\nvar revoked = inv.Revoked === true || String(inv.Revoked).toLowerCase() === "true";\nif (revoked) return { valid: false, reason: "revoked" };\nif (inv.ExpiresAt && new Date(inv.ExpiresAt) < new Date()) return { valid: false, reason: "expired" };\nreturn { valid: true, label: String(inv.Label ?? ""), role: String(inv.Role ?? ""), cvid: String(inv.CvId ?? ""), createdBy: String(inv.CreatedBy ?? "") };`,
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n5",
      name: "Invite Valid?",
      category: "logic",
      type: "if",
      version: "v1",
      position: { x: 960, y: 0 },
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
      id: "n6",
      name: "Get Portfolio",
      category: "action",
      type: "httpRequest",
      version: "v1",
      position: { x: 1200, y: -80 },
      parameters: {
        httpMethod: "POST",
        url: "https://blocksapi.slsblx.com/data/v4/gateway",
        haveQueryParameters: false,
        haveHeaders: true,
        headers: { "x-blocks-key": projectKey },
        authenticationType: "clientCredential",
        clientId,
        clientSecret,
        haveBody: true,
        bodyContentType: "json",
        body: gatewayRead("getPortfolios", "ItemId UserId DisplayName Content"),
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n6a",
      name: "Find Picture",
      category: "action",
      type: "httpRequest",
      version: "v1",
      position: { x: 1380, y: -80 },
      parameters: {
        httpMethod: "GET",
        // The creator's picture lives in the shared Cloud/profile folder under
        // a fixed id (same constant as src/lib/blocks/storage.js), named
        // profile-picture-<userId>.*. The machine credential reads storage
        // even though signed-out guests cannot — that is exactly why the
        // picture travels through this webhook instead of a browser call.
        url: "https://blocksapi.slsblx.com/data/v4/objects/get-objects?parentDirectoryId=5124daf6-d9e3-46ce-87c1-63080e3921ce&type=file",
        haveQueryParameters: false,
        haveHeaders: true,
        headers: { "x-blocks-key": projectKey },
        authenticationType: "clientCredential",
        clientId,
        clientSecret,
        haveBody: false,
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n6b",
      name: "Picture Id",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 1560, y: -80 },
      parameters: {
        mode: "each",
        language: "js",
        script: `var resp = ($node["Find Picture"] ?? {}).json ?? {};\nvar out = resp.output ?? resp;\nvar items = out.items ?? (out.data ?? {}).items ?? [];\n// The face belongs to the LINK CREATOR: match their own upload\n// (profile-picture-<creatorId>.*), falling back to the site owner for\n// legacy rows whose CreatedBy is empty.\nvar checkedPic = (($node["Validate Invite"] ?? {}).json ?? {});\ncheckedPic = checkedPic.output ?? checkedPic;\nvar creatorForPic = String(checkedPic.createdBy ?? "") || "${MERAJ_USER_ID}";\nvar prefix = "profile-picture-" + creatorForPic.toLowerCase();\nvar match = null;\nfor (var i = 0; i < items.length; i++) {\n  var name = String((items[i] ?? {}).name ?? "").toLowerCase();\n  if (name.indexOf(prefix) === 0) { match = items[i]; break; }\n}\n// No match still yields a well-formed FileId: get-file soft-fails it with\n// isSuccess=false over HTTP 200 (a MISSING FileId is the only hard 400),\n// so the chain never throws and the CV simply goes out without a photo.\nreturn { pictureFileId: String((match ?? {}).itemId ?? "00000000-0000-0000-0000-000000000000") };`,
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n6c",
      name: "Picture URL",
      category: "action",
      type: "httpRequest",
      version: "v1",
      position: { x: 1740, y: -80 },
      parameters: {
        httpMethod: "GET",
        // Trade the file id for a ~5-minute presigned read URL — fetched
        // fresh on every guest visit, so expiry never bites the page load.
        url: "https://blocksapi.slsblx.com/data/v4/files/get-file?ConfigurationName=Default&FileId={{$json.pictureFileId}}",
        haveQueryParameters: false,
        haveHeaders: true,
        headers: { "x-blocks-key": projectKey },
        authenticationType: "clientCredential",
        clientId,
        clientSecret,
        haveBody: false,
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n7",
      name: "Return Content",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 1920, y: -80 },
      parameters: {
        mode: "each",
        language: "js",
        script: `var resp = ($node["Get Portfolio"] ?? {}).json ?? {};\nvar out = resp.output ?? resp;\nvar items = (((out.data ?? {}).getPortfolios ?? {}).items) ?? [];\nvar checked = (($node["Validate Invite"] ?? {}).json ?? {});\nchecked = checked.output ?? checked;\n// The link serves ITS CREATOR's content — any clouduser can mint links\n// and share their own CV. Legacy rows (CreatedBy empty) predate that:\n// they belong to the site owner.\nvar creatorId = String(checked.createdBy ?? "") || "${MERAJ_USER_ID}";\nvar row = items.find(function (r) { return String(r.UserId ?? "") === creatorId; });\nif (!row) return { isSuccess: false, errors: "CONTENT_MISSING" };\nvar pic = (($node["Picture URL"] ?? {}).json ?? {});\npic = pic.output ?? pic;\nvar picId = (($node["Picture Id"] ?? {}).json ?? {});\npicId = picId.output ?? picId;\n// The picture lookup matches the CREATOR's own upload in the shared\n// profile folder, so a guest only ever receives the face of the\n// person who minted their link — never another user's.\nvar pictureUrl = pic.isSuccess === true ? String(pic.url ?? "") : "";\ntry {\n  var content = JSON.parse(row.Content);\n  // The guest browses THEIR CREATOR's showcase — hero, about, skills,\n  // projects and contact all ride along so every menu matches the person\n  // who minted the link. Per-invite CV sharing stays: the link's CvId\n  // picks the ONE cv the guest may see; an empty id (nothing shared) or\n  // a stale one (the cv was deleted) shares nothing — the app renders\n  // an empty state. The creator's OTHER cvs never leave the server, and\n  // the legacy single-cv field is dropped so it cannot leak a second cv.\n  var cvid = String(checked.cvid ?? "");\n  var all = Array.isArray(content.cvs) ? content.cvs : (content.cv ? [content.cv] : []);\n  var shared = null;\n  for (var ci = 0; ci < all.length; ci++) {\n    if (String(all[ci].id ?? "") === cvid) { shared = all[ci]; break; }\n  }\n  content.cvs = shared ? [shared] : [];\n  content.activeCvId = shared ? String(shared.id) : "";\n  delete content.cv;\n  return { isSuccess: true, content: content, role: String(checked.role ?? ""), pictureUrl: pictureUrl, pictureFileId: String(picId.pictureFileId ?? "").slice(0, 8) };\n} catch (e) {\n  return { isSuccess: false, errors: "CONTENT_CORRUPT" };\n}`,
      },
      settings: {},
      pinData: null,
    },
    {
      id: "n8",
      name: "Reject",
      category: "transform",
      type: "code",
      version: "v1",
      position: { x: 1200, y: 80 },
      parameters: {
        mode: "each",
        language: "js",
        script:
          'var v = (($node["Validate Invite"] ?? {}).json ?? {});\nreturn { isSuccess: false, errors: "INVITE_" + String((v.output ?? v).reason ?? "INVALID").toUpperCase() };',
      },
      settings: {},
      pinData: null,
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", sourceHandle: "source", targetHandle: "target" },
    { id: "e2", source: "n2", target: "n3", sourceHandle: "source", targetHandle: "target" },
    { id: "e3", source: "n3", target: "n4", sourceHandle: "source", targetHandle: "target" },
    { id: "e4", source: "n4", target: "n5", sourceHandle: "source", targetHandle: "target" },
    { id: "e5", source: "n5", target: "n6", sourceHandle: "if-true", targetHandle: "target" },
    { id: "e6", source: "n6", target: "n6a", sourceHandle: "source", targetHandle: "target" },
    { id: "e6b", source: "n6a", target: "n6b", sourceHandle: "source", targetHandle: "target" },
    { id: "e6c", source: "n6b", target: "n6c", sourceHandle: "source", targetHandle: "target" },
    { id: "e7", source: "n6c", target: "n7", sourceHandle: "source", targetHandle: "target" },
    { id: "e8", source: "n5", target: "n8", sourceHandle: "if-false", targetHandle: "target" },
  ],
};

const out = new URL("invite-content-gate.json", import.meta.url);
writeFileSync(out, JSON.stringify(workflow, null, 2));
console.log(
  `wrote ${out.pathname} — secrets injected (key length ${projectKey.length}, client ${clientId.slice(0, 8)}…)`
);
