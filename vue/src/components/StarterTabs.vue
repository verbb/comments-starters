<script setup lang="ts">
// The starter's own pages, as tabs above the demo.
defineProps<{ tabs: { path: string; label: string }[]; current: string; href: (path: string) => string }>();
defineEmits<{ select: [path: string] }>();
</script>

<template>
    <nav aria-label="Pages" class="mb-8 flex flex-wrap gap-x-6 border-b border-slate-200">
        <a
            v-for="tab in tabs"
            :key="tab.path"
            :href="href(tab.path)"
            :aria-current="tab.path === current ? 'page' : undefined"
            class="-mb-px border-b-2 border-transparent pb-3 text-sm text-slate-500 hover:text-slate-900 aria-[current=page]:border-slate-900 aria-[current=page]:font-semibold aria-[current=page]:text-slate-900"
            @click.prevent="$emit('select', tab.path)"
        >
            {{ tab.label }}
        </a>
    </nav>
</template>
