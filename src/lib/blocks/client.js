import { createBlocksClient } from "@seliseblocks/client";
import { blocksConfig } from "./config";

// The single Blocks client for the whole app — every call goes through here,
// there is no raw fetch anywhere in this stack.
export const blocksClient = createBlocksClient({
  apiUrl: blocksConfig.apiUrl,
  xBlocksKey: blocksConfig.xBlocksKey,
  oidc: {
    clientId: blocksConfig.oidc.clientId,
    url: blocksConfig.oidc.url,
    scope: blocksConfig.oidc.scope,
  },
});
