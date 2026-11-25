<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';

/** A file shown in the drawer: its path in the starters repository, and its source as it runs. */
export type CodeFile = { path: string; source: string };

/**
 * "View code" and the drawer it opens: the files behind the page, read from the starter's own
 * source, so what's shown is what runs. A native `<dialog>` gives the focus trap, Escape to close
 * and the backdrop, the same in every starter.
 */
const props = defineProps<{ title: string; files: CodeFile[] }>();

// Where the repository's files are browsed. Each file links to its own page there.
const repository = 'https://github.com/verbb/comments-starters/blob/main';

const dialog = ref<HTMLDialogElement | null>(null);
const index = ref(0);
const copied = ref(false);
// The drawer always has at least one file, but the fallback keeps strict index checks happy.
const file = computed(() => props.files[index.value] ?? props.files[0] ?? { path: '', source: '' });

// Shiki colours the code. It's loaded the first time the drawer shows a file, so the page itself
// stays small, and the plain source shows until it's ready.
const languages: Record<string, string> = { ts: 'typescript', vue: 'vue' };
let shiki: Promise<typeof import('shiki')> | null = null;
const open = ref(false);
// Shallow, so the file is kept as itself and compares with the one showing.
const highlighted = shallowRef<{ file: CodeFile; html: string } | null>(null);

watch([open, file], async ([shown, current]) => {
    if (!shown) return;

    try {
        const { codeToHtml } = await (shiki ??= import('shiki'));
        const html = await codeToHtml(current.source, { lang: languages[current.path.split('.').pop() ?? ''] ?? 'text', theme: 'github-dark', structure: 'inline' });

        // The visitor may have picked another file meanwhile.
        if (file.value === current) highlighted.value = { file: current, html };
    } catch {
        // The plain source stays.
    }
});

function openDrawer() {
    dialog.value?.showModal();
    open.value = true;
}

async function copy() {
    await navigator.clipboard.writeText(file.value.source);
    copied.value = true;
    window.setTimeout(() => {
        copied.value = false;
    }, 1500);
}

// A click on the backdrop lands on the dialog itself, outside its panel.
function closeFromBackdrop(event: MouseEvent) {
    if (event.target === dialog.value) {
        dialog.value?.close();
    }
}
</script>

<template>
    <button type="button" class="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100" @click="openDrawer">
        <span aria-hidden="true" class="font-mono text-xs text-slate-500">&lt;/&gt;</span>
        View the code
    </button>

    <dialog
        ref="dialog"
        aria-labelledby="code-drawer-title"
        class="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-[min(64rem,92vw)] border-l border-slate-200 bg-white p-0 text-slate-900 shadow-2xl starter-drawer max-md:max-w-none"
        @click="closeFromBackdrop"
    >
        <div class="flex h-full flex-col">
            <div class="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
                <h2 id="code-drawer-title" class="font-semibold">Code for {{ title }}</h2>
                <button type="button" autofocus class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100" @click="dialog?.close()">
                    Close
                </button>
            </div>

            <div class="grid min-h-0 flex-1 md:grid-cols-[14rem_minmax(0,1fr)]">
                <nav aria-label="Files" class="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-3 md:flex-col md:border-r md:border-b-0">
                    <button
                        v-for="(item, position) in files"
                        :key="item.path"
                        type="button"
                        :aria-current="position === index ? 'true' : undefined"
                        class="shrink-0 rounded-md px-2 py-1.5 text-left font-mono break-all text-xs text-slate-600 hover:text-slate-900 aria-[current=true]:bg-white aria-[current=true]:font-semibold aria-[current=true]:text-slate-900 aria-[current=true]:ring-1 aria-[current=true]:ring-slate-200"
                        @click="index = position"
                    >
                        <!-- The path inside the starter, since names such as page.vue repeat. -->
                        {{ item.path.split('/').slice(1).join('/') }}
                    </button>
                </nav>

                <div class="flex min-h-0 min-w-0 flex-col">
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 text-xs text-slate-500">
                        <span class="font-mono">{{ file.path }}</span>
                        <span class="flex gap-4">
                            <a :href="`${repository}/${file.path}`" target="_blank" rel="noreferrer" class="text-indigo-700 hover:underline">View on GitHub</a>
                            <button type="button" class="hover:text-slate-900" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
                        </span>
                    </div>
                    <!-- Shiki escapes the source it colours, and the source is this starter's own. -->
                    <pre class="min-h-0 flex-1 overflow-auto bg-slate-950 p-4 text-[13px] leading-6 text-slate-100"><code v-if="highlighted?.file === file" v-html="highlighted.html" /><code v-else>{{ file.source }}</code></pre>
                </div>
            </div>
        </div>
    </dialog>
</template>
