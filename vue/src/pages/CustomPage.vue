<script setup lang="ts">
import { useCommentsThread } from '@verbb/comments-vue';
import { computed, ref } from 'vue';

import CommentForm from '../components/CommentForm.vue';
import DiscussionComment from '../components/DiscussionComment.vue';
import PostPicker from '../components/PostPicker.vue';
import StarterPage from '../components/StarterPage.vue';
import { defaultPostUri, posts } from '../posts';
import { sources } from '../sources';

/**
 * A thread drawn entirely by the app. `useCommentsThread()` gives the thread's state and actions as
 * refs with none of Comments' markup, and `useCommentForm()` posts from the app's own form, with the
 * site's spam protection mounted on it.
 */
const uri = ref(defaultPostUri);

// The options are a getter, so picking another post gives it a thread of its own.
const thread = useCommentsThread(() => ({ ownerUri: uri.value }));
const { state, roots } = thread;

const post = computed(() => posts.find((item) => item.uri === uri.value) ?? posts[0]);
</script>

<template>
    <StarterPage :code="{ title: 'Your own interface', files: sources.custom }">
        <PostPicker v-model="uri" />
        <h1 class="mt-8 text-3xl font-semibold tracking-tight">{{ post.title }}</h1>

        <p v-if="state.status === 'error'" role="alert" class="mt-8 text-red-700">{{ state.error?.message ?? 'The comments couldn’t load.' }}</p>
        <p v-else-if="state.status !== 'ready'" class="mt-8 text-slate-500">Loading comments…</p>

        <section v-else class="mt-8" aria-labelledby="discussion-heading">
            <h2 id="discussion-heading" class="text-xl font-semibold">{{ state.conversation?.commentCount ?? 0 }} comments</h2>

            <CommentForm v-if="state.viewer?.canComment" :thread="thread" class="mt-6" />
            <p v-else class="mt-6 text-slate-600">{{ state.conversation?.status === 'closed' ? (state.conversation.closedNotice ?? 'Comments are closed.') : 'Sign in to comment.' }}</p>

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
