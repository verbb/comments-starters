<script setup lang="ts">
/**
 * Two columns: the demo, and an aside saying what the page shows, with its code, the thread's events
 * and how to run the starter. The `about` slot is the aside's opening sentence or two.
 */
import type { CodeFile } from './CodeDrawer.vue';
import StarterAside from './StarterAside.vue';

defineProps<{ code: { title: string; files: CodeFile[] }; events?: string[] }>();
</script>

<template>
    <div class="grid grid-cols-[minmax(0,1fr)] gap-10 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div class="min-w-0">
            <slot />
        </div>
        <aside class="text-sm lg:sticky lg:top-6 lg:self-start">
            <StarterAside :code="code" :events="events" run="npm run dev --prefix vue">
                <slot name="about" />
            </StarterAside>
        </aside>
    </div>
</template>
