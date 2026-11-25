/**
 * Copies the hosted builds of the React, Vue and web components starters into the Craft site's web
 * root, at /react/, /vue/ and /web/, so they're served from Craft's own origin. Run after
 * `npm run build:hosted`. Next.js and Nuxt run as servers of their own, because member tokens and a
 * shared cookie both need their own origin (see docs/forge-deployment.md).
 */
import { cp, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

for (const app of ['react', 'vue', 'web']) {
    const source = path.join(root, app, 'dist');

    if (!(await stat(source).catch(() => null))?.isDirectory()) {
        throw new Error(`Missing ${app}/dist. Run npm run build:hosted first.`);
    }

    const target = path.join(root, 'craft', 'web', app);
    await rm(target, { recursive: true, force: true });
    await cp(source, target, { recursive: true });
    console.log(`Copied ${app}/dist to craft/web/${app}`);
}
