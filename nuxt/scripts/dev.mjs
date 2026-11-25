/**
 * `npm run dev`: makes the certificate if it's missing, then starts Nuxt's dev server over HTTPS.
 */
import { spawn } from 'node:child_process';

import { caFile, ensureCertificate } from './certificate.mjs';

ensureCertificate();

// Node doesn't use the system's trust store, so the server's own reads from Craft (the count and
// the JSON-LD) would refuse DDEV's certificate. mkcert's CA signs it, so Node is told to trust that.
const env = { ...process.env, NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS || caFile() };

const child = spawn('nuxt', ['dev', ...process.argv.slice(2)], { stdio: 'inherit', env, shell: process.platform === 'win32' });

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
