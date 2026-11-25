<script setup lang="ts">
/**
 * Two columns: the demo, and an aside saying what the page shows, with its code, the thread's events
 * and how to run the starter. The `about` slot is the aside's opening sentence or two.
 */
import StarterAside from './StarterAside.vue';

const props = defineProps<{ page: 'thread' | 'custom'; events?: string[] }>();

// The files behind each page, read on the server by server/api/starter-sources.get.ts. The key
// shares one read between pages.
const { data: sources } = await useFetch('/api/starter-sources', { key: 'starter-sources' });
const code = computed(() => ({
    title: props.page === 'custom' ? 'Your own interface' : 'The thread',
    files: sources.value?.[props.page] ?? [],
}));
</script>

<template>
    <div class="grid grid-cols-[minmax(0,1fr)] gap-10 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div class="min-w-0">
            <slot />
        </div>
        <aside class="text-sm lg:sticky lg:top-6 lg:self-start">
            <StarterAside :code="code" :events="events" run="npm run dev --prefix nuxt">
                <slot name="about" />
            </StarterAside>
        </aside>
    </div>
</template>
