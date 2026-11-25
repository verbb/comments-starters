import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const craftUrl = env.COMMENTS_CRAFT_URL || 'https://comments-starters.ddev.site';

    return {
        plugins: [tailwindcss(), vue()],
        server: {
            port: 5274,
            strictPort: true,
            // Forward Craft's actions, so the app, Comments' data API and Craft's sign-in share this
            // origin (sign-in tier 1), as they do when the built app is served from Craft's own domain.
            proxy: {
                '/actions': {
                    target: craftUrl,
                    changeOrigin: true,
                    // DDEV's certificate isn't in Node's trust store.
                    secure: false,
                    // Keep Craft's cookies on this origin, whatever domain Craft sets them for.
                    cookieDomainRewrite: { '*': '' },
                    configure(proxy) {
                        // Craft refuses a write whose Origin isn't its own. Only a request from this dev
                        // server's own pages is passed on as Craft's, so any other site is still refused.
                        // A production proxy keeps the Host header, or sends an X-Forwarded-Host Craft
                        // trusts, rather than rewriting Origin.
                        proxy.on('proxyReq', (request, incoming) => {
                            const origin = request.getHeader('origin');

                            if (origin && origin === `http://${incoming.headers.host}`) {
                                request.setHeader('origin', new URL(craftUrl).origin);
                            }
                        });
                    },
                },
            },
        },
        preview: {
            port: 4274,
            strictPort: true,
        },
    };
});
