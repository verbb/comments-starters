import { cookieSession } from '@verbb/comments-core';
import { CommentsPlugin } from '@verbb/comments-vue';

/**
 * The app runs on a subdomain of the Craft site, so Craft's session cookie identifies the person
 * through credentialed CORS: sign-in tier 2. Craft lists this origin with Shared Cookies. The
 * sign-in is made once, here, so every thread shares it. On the server the threads render only
 * their mount points, but the settings are given there too, so both renders write the same markup.
 */
export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();

    nuxtApp.vueApp.use(CommentsPlugin, {
        endpoint: config.public.commentsEndpoint,
        auth: cookieSession({ profile: 'same-site-credentialed' }),
        theme: 'auto',
    });
});
