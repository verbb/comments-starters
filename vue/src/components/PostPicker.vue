<script setup lang="ts">
import { posts } from '../posts';

// `v-model` on the picker reads and sets the chosen post's URI.
const uri = defineModel<string>({ required: true });
</script>

<template>
    <div role="group" aria-label="Posts" class="flex flex-wrap gap-2">
        <button
            v-for="post in posts"
            :key="post.uri"
            type="button"
            :aria-pressed="post.uri === uri"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300 aria-pressed:border-indigo-300 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-900"
            @click="uri = post.uri"
        >
            {{ post.title }}
        </button>
    </div>
</template>
