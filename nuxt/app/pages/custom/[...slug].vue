<script setup lang="ts">
import { useCommentsThread } from '@verbb/comments-vue';
import { computed, watch } from 'vue';

import CommentForm from '~/components/CommentForm.vue';
import DiscussionComment from '~/components/DiscussionComment.vue';
import PostPicker from '~/components/PostPicker.vue';
import StarterPage from '~/components/StarterPage.vue';
import { useViewer } from '~/composables/viewer';
import { posts } from '~/posts';

/**
 * A thread drawn entirely by the app. `useCommentsThread()` gives the thread's state and actions as
 * refs with none of Comments' markup, and `useCommentForm()` posts from the app's own forms, with the
 * site's spam protection mounted on each. It loads in the browser, so the server renders the
 * loading line.
 */
const route = useRoute();
const viewer = useViewer();

const uri = computed(() => [route.params.slug ?? []].flat().join('/'));
const post = computed(() => posts.find((item) => item.uri === uri.value));

if (!post.value) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' });
}

// The options are a getter, so moving to another post gives it a thread of its own.
const thread = useCommentsThread(() => ({ ownerUri: uri.value }));
const { state, roots } = thread;

// The header shows who's signed in, from the thread's viewer read.
watch(() => state.value.viewer, (current) => {
    viewer.value = current ?? null;
});

useHead(() => ({ title: `${post.value?.title} · Your own interface · Comments Nuxt Starter` }));
</script>

<template>
    <StarterPage page="custom">
        <PostPicker base="/custom" />
        <h1 class="mt-8 text-3xl font-semibold tracking-tight">{{ post?.title }}</h1>

        <p v-if="state.status === 'error'" role="alert" class="mt-8 text-red-700">{{ state.error?.message ?? 'The comments couldn’t load.' }}</p>
        <p v-else-if="state.status !== 'ready'" class="mt-8 text-slate-500">Loading comments…</p>

        <section v-else class="mt-8" aria-labelledby="discussion-heading">
            <h2 id="discussion-heading" class="text-xl font-semibold">{{ state.conversation?.commentCount ?? 0 }} comments</h2>

            <CommentForm v-if="state.viewer?.canComment" :key="uri" :thread="thread" class="mt-6" />
            <p v-else class="mt-6 text-slate-600">{{ state.conversation?.status === 'closed' ? (state.conversation.closedNotice ?? 'Comments are closed.') : 'Sign in on the Craft site to comment.' }}</p>

            <ul class="mt-8 space-y-6">
                <DiscussionComment v-for="comment in roots" :key="comment.uid" :comment="comment" :thread="thread" />
            </ul>

            <button v-if="state.next" type="button" :disabled="state.loadingMore" class="mt-6 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100" @click="thread.loadMore()">
                {{ state.loadingMore ? 'Loading…' : 'Load more' }}
            </button>
        </section>

        <template #about>
            The same thread drawn with the app’s own components, built on <code>useCommentsThread()</code> and <code>useCommentForm()</code>. Comments gives the state and actions, and none of its markup.
        </template>
    </StarterPage>
</template>
