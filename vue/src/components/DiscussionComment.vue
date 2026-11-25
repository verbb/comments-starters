<script setup lang="ts">
import type { CommentData, UseCommentsThreadResult } from '@verbb/comments-vue';
import { computed, ref } from 'vue';

import CommentForm from './CommentForm.vue';

/** One comment on the "Your own interface" page, with its replies drawn by this same component. */
const props = defineProps<{ comment: CommentData; thread: UseCommentsThreadResult }>();

// Comments a reader doesn't see. The author sees their own while it waits, and moderators see them all.
const stateLabels: Partial<Record<CommentData['state'], string>> = {
    pending: 'Waiting for approval',
    held: 'Held for review',
    reported: 'Reported',
    spam: 'Spam',
    removed: 'Removed',
};

// The author's `avatarTone` picks one of a few colours, so a person keeps theirs across the thread.
const tones = ['bg-teal-700', 'bg-indigo-700', 'bg-rose-700', 'bg-amber-700', 'bg-sky-700', 'bg-violet-700'];

const replying = ref(false);
const permissions = computed(() => props.thread.state.value.permissions[props.comment.uid]);
const vote = computed(() => permissions.value?.vote ?? null);
const busy = computed(() => Boolean(props.thread.state.value.busy[`vote:${props.comment.uid}`]));
const replies = computed(() => props.thread.replies(props.comment.uid));
const author = computed(() => props.comment.author);
const voteButton = 'inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-sm text-slate-600 hover:border-slate-300 aria-pressed:border-indigo-300 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-900 disabled:opacity-50';
</script>

<template>
    <li class="flex gap-3">
        <img v-if="author?.avatarUrl" :src="author.avatarUrl" alt="" class="size-9 shrink-0 rounded-full">
        <span v-else :class="['flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white', tones[(author?.avatarTone ?? 0) % tones.length]]">{{ author?.initials }}</span>

        <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-x-2 text-sm">
                <strong>{{ author?.name }}</strong>
                <span v-for="badge in author?.badges ?? []" :key="badge.type" class="rounded-full bg-slate-100 px-2 text-xs text-slate-700">{{ badge.label }}</span>
                <span class="text-slate-500">{{ comment.display?.timeAgo }}</span>
                <span v-if="stateLabels[comment.state]" class="rounded bg-amber-100 px-1.5 text-xs text-amber-800">{{ stateLabels[comment.state] }}</span>
            </p>
            <p class="mt-1 whitespace-pre-line">{{ comment.content?.text }}</p>

            <div class="mt-2 flex flex-wrap items-center gap-2">
                <template v-if="comment.interaction">
                    <button type="button" aria-label="Upvote" :aria-pressed="vote === 'upvote'" :disabled="busy || !permissions?.canVote" :class="voteButton" @click="thread.vote(comment.uid, vote === 'upvote' ? null : 'upvote')">
                        ▲ {{ comment.interaction.upvotes }}
                    </button>
                    <button v-if="permissions?.canDownvote" type="button" aria-label="Downvote" :aria-pressed="vote === 'downvote'" :disabled="busy" :class="voteButton" @click="thread.vote(comment.uid, vote === 'downvote' ? null : 'downvote')">
                        ▼ {{ comment.interaction.downvotes }}
                    </button>
                </template>
                <button v-if="permissions?.canReply" type="button" :aria-expanded="replying" class="px-1 text-sm text-slate-600 hover:text-slate-900" @click="replying = !replying">
                    Reply
                </button>
                <button v-if="comment.replies.count > 0 && replies.length === 0" type="button" class="px-1 text-sm text-indigo-700 hover:underline" @click="thread.loadReplies(comment.uid)">
                    Show {{ comment.replies.count }} {{ comment.replies.count === 1 ? 'reply' : 'replies' }}
                </button>
            </div>

            <CommentForm v-if="replying" :thread="thread" :parent-uid="comment.uid" class="mt-4" @done="replying = false" />

            <ul v-if="replies.length" class="mt-4 space-y-4 border-l border-slate-200 pl-5">
                <DiscussionComment v-for="reply in replies" :key="reply.uid" :comment="reply" :thread="thread" />
            </ul>
        </div>
    </li>
</template>
