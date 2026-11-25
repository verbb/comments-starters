<script setup lang="ts">
import { CommentsThread, type CommentsFieldOverrides, type CommentsPartOverrides } from '@verbb/comments-vue';
import { computed, ref } from 'vue';

import PostPicker from '../components/PostPicker.vue';
import RatingDisplay from '../components/RatingDisplay.vue';
import RatingInput from '../components/RatingInput.vue';
import StarterPage from '../components/StarterPage.vue';
import VerifiedBadge from '../components/VerifiedBadge.vue';
import { defaultPostUri, posts } from '../posts';
import { sources } from '../sources';

// Setup runs once, so the thread is given the same overrides on every render rather than new ones
// that would make it redraw. They're imported components, not ones defined in a render function.
const parts: CommentsPartOverrides = { badge: VerifiedBadge };
const fields: CommentsFieldOverrides = { rating: { input: RatingInput, display: RatingDisplay } };

const uri = ref(defaultPostUri);
const events = ref<string[]>([]);
const post = computed(() => posts.find((item) => item.uri === uri.value) ?? posts[0]);

function log(line: string) {
    events.value = [line, ...events.value].slice(0, 5);
}
</script>

<template>
    <StarterPage :code="{ title: 'The thread', files: sources.thread }" :events="events">
        <PostPicker v-model="uri" />
        <h1 class="mt-8 text-3xl font-semibold tracking-tight">{{ post.title }}</h1>

        <div class="mt-8">
            <!-- The key starts a fresh thread for each post. -->
            <CommentsThread
                :key="uri"
                :owner-uri="uri"
                :parts="parts"
                :fields="fields"
                @comment-created="(event) => log(`Posted a comment (${event.detail.moderationState})`)"
                @vote-changed="(event) => log(event.detail.vote ? `Voted ${event.detail.vote}` : 'Took a vote back')"
                @follow-changed="(event) => log(event.detail.following ? 'Following the discussion' : 'Stopped following')"
            />
        </div>

        <template #about>
            <code>&lt;CommentsThread&gt;</code> draws the thread, with the app’s own component for the buyer badge and star ratings for the rating field. The app is on Craft’s own domain, so Craft’s session signs people in.
        </template>
    </StarterPage>
</template>
