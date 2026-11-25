<script setup lang="ts">
import CodeDrawer, { type CodeFile } from './CodeDrawer.vue';

// What the page shows (the slot), the files behind it in a drawer, the events the thread has sent
// when the page listens for any, and how to run the starter.
defineProps<{ code: { title: string; files: CodeFile[] }; events?: string[]; run: string }>();
</script>

<template>
    <div class="space-y-8">
        <p class="text-slate-600"><slot /></p>

        <!-- Left out if the server couldn't read the files, rather than offering an empty drawer. -->
        <section v-if="code.files.length">
            <h2 class="font-semibold">Code</h2>
            <p class="mt-1 text-slate-500">The {{ code.files.length }} files behind this page, as they run.</p>
            <CodeDrawer :title="code.title" :files="code.files" />
        </section>

        <section v-if="events">
            <h2 class="font-semibold">Events</h2>
            <p class="mt-1 text-slate-500">What the thread tells the app, through its component events.</p>
            <ol class="mt-3 space-y-1 text-slate-700" aria-live="polite">
                <template v-if="events.length">
                    <li v-for="(line, index) in events" :key="`${index}-${line}`">{{ line }}</li>
                </template>
                <li v-else class="text-slate-400">Nothing yet. Vote or comment.</li>
            </ol>
        </section>

        <section>
            <h2 class="font-semibold">Run it locally</h2>
            <p class="mt-1 text-slate-500">With the Craft site and packages installed as the README describes:</p>
            <pre class="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-700">{{ run }}</pre>
        </section>
    </div>
</template>
