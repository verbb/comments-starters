<script setup lang="ts">
/**
 * Draws each badge on a comment's author. The starters' Craft module gives buyers a `verified` badge
 * (with Comments' `EVENT_DEFINE_BADGES`), which this draws with a tick. Other badges, such as Team
 * for moderators, keep Comments' own class names, so its stylesheet still styles them.
 */
type Badge = { type: string; label: string };

// An override gets only the props it declares, so the rest of the part's context stays off the element.
defineProps<{ badge: Badge }>();
</script>

<template>
    <span v-if="badge.type !== 'verified'" :class="`comments__badge comments__badge--${badge.type.replace(/[^\w-]/g, '')}`">{{ badge.label }}</span>
    <span v-else class="ml-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
        <svg aria-hidden="true" viewBox="0 0 16 16" class="size-3 fill-current"><path d="M6.4 11.2 3.2 8l1.1-1.1 2.1 2.1 5.3-5.3L12.8 4.8z" /></svg>
        {{ badge.label }}
    </span>
</template>
