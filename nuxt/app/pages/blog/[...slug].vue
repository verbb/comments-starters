<script setup lang="ts">
import { CommentsThread, type CommentsEventMap, type CommentsFieldOverrides, type CommentsPartOverrides } from '@verbb/comments-vue';
import { fetchCommentsCount, fetchStructuredData, jsonLdScript } from '@verbb/comments-vue/server';
import { computed, ref } from 'vue';

import PostPicker from '~/components/PostPicker.vue';
import RatingDisplay from '~/components/RatingDisplay.vue';
import RatingInput from '~/components/RatingInput.vue';
import StarterPage from '~/components/StarterPage.vue';
import VerifiedBadge from '~/components/VerifiedBadge.vue';
import { useViewer } from '~/composables/viewer';
import { posts } from '~/posts';

// Setup runs once for each post, so the thread is given the same overrides on every render rather
// than new ones that would make it redraw. They're imported components, not ones defined in a render function.
const parts: CommentsPartOverrides = { badge: VerifiedBadge };
const fields: CommentsFieldOverrides = { rating: { input: RatingInput, display: RatingDisplay } };

const route = useRoute();
const config = useRuntimeConfig();
const viewer = useViewer();

// The app's paths are the posts' URIs on the Craft site, which the thread is keyed by.
const uri = computed(() => `blog/${[route.params.slug ?? []].flat().join('/')}`);
const post = computed(() => posts.find((item) => item.uri === uri.value));

if (!post.value) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' });
}

// The count and the structured data, read on the server for the first page. A move to another post
// reads them in the browser, from the public endpoint, which Craft answers for any origin. Either
// read can fail, such as on a post that doesn't take comments, and the page renders without it.
const { data: meta } = await useAsyncData(() => `comments:${uri.value}`, async () => {
    const endpoint = import.meta.server ? config.commentsServerUrl : config.public.commentsEndpoint;
    const options = { endpoint, ownerUri: uri.value };
    const skip = (what: string) => (error: unknown) => {
        console.warn(`Comments: couldn’t read the ${what} for ${uri.value}.`, error);

        return null;
    };
    const [count, jsonLd] = await Promise.all([
        fetchCommentsCount(options).catch(skip('count')),
        fetchStructuredData(options).catch(skip('structured data')),
    ]);

    return { count, jsonLd };
});

useHead(() => ({
    title: `${post.value?.title} · Comments Nuxt Starter`,
    // `jsonLdScript()` escapes `<`, `>` and `&`, so a comment holding a closing script tag can't end
    // the script. (Writing that tag here would end this SFC's own script block too.)
    script: meta.value?.jsonLd ? [{ key: 'comments-json-ld', type: 'application/ld+json', innerHTML: jsonLdScript(meta.value.jsonLd) }] : [],
}));

const events = ref<string[]>([]);

function log(line: string) {
    events.value = [line, ...events.value].slice(0, 5);
}

// The thread reads who's asking with Craft's session cookie, so the header can show them.
function readViewer(event: CommentsEventMap['comments:viewer-loaded']) {
    viewer.value = event.detail.controller?.store.getState().viewer ?? null;
}
</script>

<template>
    <StarterPage page="thread" :events="events">
        <PostPicker />
        <h1 class="mt-8 text-3xl font-semibold tracking-tight">{{ post?.title }}</h1>

        <div class="mt-8">
            <!-- The key starts a fresh thread for each post. On the server only its mount point renders. -->
            <CommentsThread
                :key="uri"
                :owner-uri="uri"
                :count="meta?.count ?? undefined"
                :parts="parts"
                :fields="fields"
                @viewer-loaded="readViewer"
                @comment-created="(event) => log(`Posted a comment (${event.detail.moderationState})`)"
                @vote-changed="(event) => log(event.detail.vote ? `Voted ${event.detail.vote}` : 'Took a vote back')"
                @follow-changed="(event) => log(event.detail.following ? 'Following the discussion' : 'Stopped following')"
            />
        </div>

        <template #about>
            Comments never handles passwords, so you sign in on the Craft site. This app is on a subdomain of it, so Craft’s session cookie comes with the thread’s requests, and coming back here keeps you signed in. The count and structured data are read on the server.
        </template>
    </StarterPage>
</template>
