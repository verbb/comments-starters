/**
 * Runs a command with mkcert's local certificate authority trusted by Node, so this app's server can
 * reach the DDEV Craft site over HTTPS. Node only reads NODE_EXTRA_CA_CERTS when it starts, which is
 * why it's set here rather than in an env file. Without mkcert, the command runs as it is.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const env = { ...process.env };

if (!env.NODE_EXTRA_CA_CERTS) {
    try {
        const root = execFileSync('mkcert', ['-CAROOT'], { encoding: 'utf8' }).trim();
        const certificate = path.join(root, 'rootCA.pem');

        if (existsSync(certificate)) {
            env.NODE_EXTRA_CA_CERTS = certificate;
        }
    } catch {
        // No mkcert, so the Craft site needs a certificate Node already trusts.
    }
}

const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, { env, stdio: 'inherit', shell: process.platform === 'win32' });

child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
