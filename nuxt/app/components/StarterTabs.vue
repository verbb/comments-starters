<script setup lang="ts">
import { postPath, posts } from '~/posts';

// The starter's pages, as tabs above the demo. Each keeps the post you're on.
const route = useRoute();
const custom = computed(() => route.path.startsWith('/custom/'));
const uri = computed(() => route.path.replace(/^\/(custom\/)?/, '') || posts[0].uri);

const tabs = computed(() => [
    { to: postPath(uri.value), label: 'The thread', current: !custom.value },
    { to: `/custom${postPath(uri.value)}`, label: 'Your own interface', current: custom.value },
]);
</script>

<template>
    <nav aria-label="Pages" class="mb-8 flex flex-wrap gap-x-6 border-b border-slate-200">
        <NuxtLink
            v-for="tab in tabs"
            :key="tab.label"
            :to="tab.to"
            :aria-current="tab.current ? 'page' : undefined"
            class="-mb-px border-b-2 border-transparent pb-3 text-sm text-slate-500 hover:text-slate-900 aria-[current=page]:border-slate-900 aria-[current=page]:font-semibold aria-[current=page]:text-slate-900"
        >
            {{ tab.label }}
        </NuxtLink>
    </nav>
</template>
