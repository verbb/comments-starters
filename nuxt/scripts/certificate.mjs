/**
 * Makes the dev server's HTTPS certificate with mkcert, which DDEV installs and whose CA it already
 * trusts, into `.certs/`. Run on its own with `node scripts/certificate.mjs`, or through `npm run dev`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep in step with `devServer` in `nuxt.config.ts`.
export const host = 'nuxt.comments-starters.ddev.site';

const folder = fileURLToPath(new URL('../.certs/', import.meta.url));
const certFile = join(folder, `${host}.pem`);
const keyFile = join(folder, `${host}-key.pem`);

function mkcert(args, options = {}) {
    try {
        return execFileSync('mkcert', args, { encoding: 'utf8', ...options });
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('mkcert isn’t installed. DDEV installs it, or see https://github.com/FiloSottile/mkcert.');
            process.exit(1);
        }

        throw error;
    }
}

export function ensureCertificate() {
    if (existsSync(certFile) && existsSync(keyFile)) {
        return;
    }

    mkdirSync(folder, { recursive: true });
    mkcert(['-cert-file', certFile, '-key-file', keyFile, host], { stdio: 'inherit' });
}

/** mkcert's CA, which also signs DDEV's certificate for the Craft site. */
export function caFile() {
    return join(mkcert(['-CAROOT']).trim(), 'rootCA.pem');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    ensureCertificate();
}
