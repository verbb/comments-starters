<script setup lang="ts">
import { postPath, posts } from '~/posts';

// Each post is a page of its own, so the picker links to them, and the router marks the current one.
// `base` keeps the picker on the page you're on, such as `/custom` for Your own interface.
withDefaults(defineProps<{ base?: string }>(), { base: '' });
</script>

<template>
    <nav aria-label="Posts" class="flex flex-wrap gap-2">
        <NuxtLink
            v-for="post in posts"
            :key="post.uri"
            :to="`${base}${postPath(post.uri)}`"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300 aria-[current=page]:border-indigo-300 aria-[current=page]:bg-indigo-50 aria-[current=page]:text-indigo-900"
        >
            {{ post.title }}
        </NuxtLink>
    </nav>
</template>
