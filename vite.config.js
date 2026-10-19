import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Hosted Blocks login needs HTTPS on the project's real domain — the session
// cookie is Secure and browsers never store it on plain http://localhost.
// When .cert/ holds a generated pair (npm run cert), serve over HTTPS on that
// domain. strictPort: the port is part of the OIDC client's registered
// redirect URI, so falling back to another port would break login silently.
const readEnv = (name, fallback) => {
  try {
    const contents = readFileSync(".env.local", "utf8");
    const match = contents.match(new RegExp(`^${name}=(.*)$`, "m"));
    if (match) return match[1].trim();
  } catch {
    // .env.local missing — fall through
  }
  return fallback;
};

const devHost = process.env.VITE_BLOCKS_DEV_HOST || readEnv("VITE_BLOCKS_DEV_HOST", null);
const devPort = Number(process.env.VITE_BLOCKS_DEV_PORT || readEnv("VITE_BLOCKS_DEV_PORT", 5173));
const certDir = ".cert";
const hasCert = existsSync(`${certDir}/dev-key.pem`) && existsSync(`${certDir}/dev-cert.pem`);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    ...(devHost && hasCert
      ? {
          https: {
            key: readFileSync(`${certDir}/dev-key.pem`),
            cert: readFileSync(`${certDir}/dev-cert.pem`),
          },
          host: devHost,
          port: devPort,
          strictPort: true,
          allowedHosts: [devHost],
        }
      : {}),
  },
});
