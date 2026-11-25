<script setup lang="ts">
import { useCommentForm, type UseCommentsThreadResult } from '@verbb/comments-vue';
import { computed } from 'vue';

import FormField from './FormField.vue';

/**
 * The app's own form, for a new comment or a reply. Each form gets its own `useCommentForm()`, so
 * Protect is mounted on the form being written in and its errors stay with it.
 */
const props = defineProps<{ thread: UseCommentsThreadResult; parentUid?: string }>();
const emit = defineEmits<{ done: [] }>();

// The form's `ref` is bound as `:ref="form.ref"`, which hands Vue the ref itself. vue-tsc doesn't
// count a string `ref="…"` as a use, so destructuring it would fail the unused-locals check.
const form = useCommentForm({ thread: props.thread, mode: props.parentUid ? 'reply' : 'create', parentUid: props.parentUid });
const { fieldErrors, error, posting } = form;
const viewer = computed(() => props.thread.state.value.viewer);

async function submit(event: Event) {
    const element = event.currentTarget as HTMLFormElement;
    const response = await form.handleSubmit(event);

    // Null means it was refused, with the reasons in fieldErrors and error.
    if (response) {
        element.reset();
        emit('done');
    }
}
</script>

<template>
    <form :ref="form.ref" class="space-y-3 rounded-2xl border border-slate-200 bg-white p-5" @submit="submit">
        <div v-if="viewer?.isGuest" class="grid gap-3 sm:grid-cols-2">
            <FormField label="Name" name="guest[name]" :errors="fieldErrors['guest.name']" />
            <FormField label="Email" name="guest[email]" type="email" :errors="fieldErrors['guest.email']" />
        </div>
        <p v-else class="text-sm text-slate-600">Posting as <strong>{{ viewer?.name }}</strong></p>
        <label class="block">
            <span class="text-sm font-medium">{{ parentUid ? 'Reply' : 'Comment' }}</span>
            <textarea name="content" rows="3" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <p v-for="message in fieldErrors.content ?? []" :key="message" class="text-sm text-red-700">{{ message }}</p>
        <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
        <div class="flex gap-2">
            <button :disabled="posting" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                {{ posting ? 'Posting…' : parentUid ? 'Reply' : 'Post' }}
            </button>
            <button v-if="parentUid" type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" @click="emit('done')">
                Cancel
            </button>
        </div>
    </form>
</template>
