// Config source, in priority order: on the deployment, nginx-env.sh writes
// the release secret set into /env.js at container start (window.__ENV__) —
// a static bundle has no build-time env. Locally the placeholder is empty
// and Vite's .env.local values (import.meta.env) apply.
const env = {
  ...import.meta.env,
  ...(typeof window !== "undefined" && window.__ENV__ ? window.__ENV__ : {}),
};

export const blocksConfig = {
  apiUrl: env.VITE_BLOCKS_API_URL,
  xBlocksKey: env.VITE_BLOCKS_PROJECT_KEY,
  oidc: {
    clientId: env.VITE_BLOCKS_OIDC_CLIENT_ID,
    url: env.VITE_BLOCKS_OIDC_URL,
    scope: env.VITE_BLOCKS_OIDC_SCOPE,
  },
};

export function isLoginConfigured() {
  return Boolean(blocksConfig.apiUrl && blocksConfig.oidc.url && blocksConfig.oidc.clientId);
}
