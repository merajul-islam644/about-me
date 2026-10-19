const env = import.meta.env;

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
