import tailwindcss from '@tailwindcss/vite';

// The dev server's address, which Craft lists with Shared Cookies. `scripts/certificate.mjs` makes
// its certificate.
const devHost = 'nuxt.comments-starters.ddev.site';
const devPort = 3102;
const craftUrl = (process.env.NUXT_PUBLIC_CRAFT_URL || 'https://comments-starters.ddev.site').replace(/\/$/, '');
const commentsEndpoint = process.env.NUXT_PUBLIC_COMMENTS_ENDPOINT || `${craftUrl}/actions/comments/api`;

export default defineNuxtConfig({
    compatibilityDate: '2026-11-01',
    devtools: { enabled: false },

    // Served from a path, as Formie's starters are on their shared host. Tier 2 needs more than a
    // path, though. The app has to be on its own subdomain origin, listed in Craft with Shared
    // Cookies, and a static `generate` placed under a path on Craft's domain would be Craft's own
    // origin, which refuses the `same-site-credentialed` profile. `generate` also bakes the count
    // and the JSON-LD in at build time, so run `build` with a Node server for this starter.
    app: {
        baseURL: process.env.NUXT_APP_BASE_URL || '/',
        head: {
            title: 'Comments Nuxt Starter',
            htmlAttrs: { lang: 'en' },
            link: [{ rel: 'icon', type: 'image/svg+xml', href: `${(process.env.NUXT_APP_BASE_URL || '/').replace(/\/?$/, '/')}favicon.svg` }],
        },
    },

    css: ['~/assets/css/main.css'],

    // HTTPS on a subdomain of the Craft site, so the browser treats the two as the same site and
    // sends Craft's session cookie with the data API's credentialed requests. `npm run dev` makes
    // the certificate with mkcert first.
    devServer: {
        host: devHost,
        port: devPort,
        https: {
            key: `.certs/${devHost}-key.pem`,
            cert: `.certs/${devHost}.pem`,
        },
    },

    runtimeConfig: {
        // The data API for the server's own reads (the count and the JSON-LD), never sent to the
        // browser. It can be an internal address. `NUXT_COMMENTS_SERVER_URL` overrides it at runtime.
        commentsServerUrl: process.env.COMMENTS_SERVER_URL || commentsEndpoint,
        public: {
            commentsEndpoint,
            craftUrl,
            commentsEntryUri: process.env.NUXT_PUBLIC_COMMENTS_ENTRY_URI || '',
        },
    },

    vite: {
        plugins: [tailwindcss()],
        // Pre-bundled up front, so the dev server doesn't find them on the first visit and reload the page.
        optimizeDeps: {
            include: ['@verbb/comments-core', '@verbb/comments-vue', '@verbb/comments-vue/server', '@verbb/comments-browser/renderer'],
        },
        server: {
            allowedHosts: [devHost],
        },
    },
});
