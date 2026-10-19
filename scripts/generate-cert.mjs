// Generates .cert/dev-key.pem + .cert/dev-cert.pem for serving the dev server
// over HTTPS on the project's real domain (required for hosted Blocks login —
// the session cookie is Secure and never lands on plain http://localhost).
// Pure Node via `selfsigned` — no OpenSSL needed.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import selfsigned from "selfsigned";

// Domain resolution order matches the scaffold: explicit arg > process.env > .env.local/.env
const argDomain = process.argv[2];
let devHost = argDomain || process.env.VITE_BLOCKS_DEV_HOST;

if (!devHost) {
  for (const envFile of [".env.local", ".env"]) {
    try {
      const contents = readFileSync(envFile, "utf8");
      const match = contents.match(/^VITE_BLOCKS_DEV_HOST=(.*)$/m);
      if (match) {
        devHost = match[1].trim();
        break;
      }
    } catch {
      // file missing — try the next one
    }
  }
}

if (!devHost) {
  console.error(
    "No domain given. Set VITE_BLOCKS_DEV_HOST in .env.local or run: npm run cert -- <domain>"
  );
  process.exit(1);
}

const attrs = [{ name: "commonName", value: devHost }];
const extensions = [
  {
    name: "subjectAltName",
    altNames: [
      { type: 2, value: devHost }, // DNS
      { type: 2, value: "localhost" },
      { type: 7, ip: "127.0.0.1" }, // IP
    ],
  },
];

const pems = await selfsigned.generate(attrs, {
  extensions,
  validityDays: 825,
  keySize: 2048,
  algorithm: "sha256",
});

mkdirSync(".cert", { recursive: true });
writeFileSync(join(".cert", "dev-key.pem"), pems.private);
writeFileSync(join(".cert", "dev-cert.pem"), pems.cert);

console.log(`Dev certificate written for ${devHost} (plus localhost, 127.0.0.1).`);
console.log("Optional — trust it so the browser stops warning (elevated prompt):");
console.log("  Windows:  certutil -addstore -f Root .cert\\dev-cert.pem");
console.log("  macOS:    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .cert/dev-cert.pem");
console.log("  Linux:    sudo cp .cert/dev-cert.pem /usr/local/share/ca-certificates/blocks-dev.crt && sudo update-ca-certificates");
console.log("Restart the browser after trusting.");
