import { blocksClient } from "./client";
import { isLoginConfigured } from "./config";

const RETURN_TO_KEY = "blocks:returnTo";

export async function startLogin(returnTo = "/") {
  if (!isLoginConfigured()) {
    throw new Error(
      "Login is not configured. Set VITE_BLOCKS_OIDC_CLIENT_ID in .env.local."
    );
  }
  sessionStorage.setItem(RETURN_TO_KEY, returnTo);
  // Redirects the browser to the Blocks-hosted login; relies on the client's
  // configured oidc defaults, including the <origin>/login/callback redirect.
  await blocksClient.auth.idp.redirectToProvider();
}

// Sends the browser to SELISE's hosted signup page — no form is owned here.
// The page sits beside the hosted login and needs the same one-time OIDC
// context (state/nonce), so it is built from a fresh IdP initiate each click.
export async function startSignup(returnTo = "/") {
  if (!isLoginConfigured()) {
    throw new Error(
      "Login is not configured. Set VITE_BLOCKS_OIDC_CLIENT_ID in .env.local."
    );
  }
  sessionStorage.setItem(RETURN_TO_KEY, returnTo);
  const response = await blocksClient.auth.idp.initiate();
  const authorize = response?.redirect_uri ?? response?.redirectUri;
  if (!authorize) {
    throw new Error("Blocks IdP initiate response did not include redirect_uri.");
  }
  const url = new URL(authorize);
  const tenantId = url.searchParams.get("tenant_id");
  const signup = new URL(`/oidc/signup/${tenantId}`, url.origin);
  const params = [
    ["client_id", "clientId"],
    ["state", "state"],
    ["nonce", "nonce"],
    ["scope", "scope"],
    ["redirect_uri", "redirect_uri"],
    ["tenant_id", "tenant_id"],
  ];
  for (const [from, to] of params) {
    const value = url.searchParams.get(from);
    if (value) signup.searchParams.set(to, value);
  }
  window.location.assign(signup);
}

export async function completeLogin(callbackUrl) {  let returnTo = "/";
  try {
    returnTo = sessionStorage.getItem(RETURN_TO_KEY) || "/";
  } finally {
    sessionStorage.removeItem(RETURN_TO_KEY);
  }

  const response = await blocksClient.auth.idp.callback(callbackUrl);
  if (response?.error) {
    return {
      ok: false,
      returnTo,
      message: response.error_description || response.error,
    };
  }
  // Default cookie flow: IAM set the session as a Secure httpOnly cookie on
  // this response and returned no token in the body, so nothing is cached here.
  return { ok: true, returnTo };
}

export async function fetchSessionClaims() {
  return blocksClient.auth.userInfo();
}

// userInfo() intentionally never throws on non-2xx — a 401 resolves like
// success — so session checks must go through isAuthenticated(), which
// inspects the raw response status.
export async function isAuthenticated() {
  return blocksClient.auth.isAuthenticated();
}

export async function logout() {
  await blocksClient.auth.logout();
}
