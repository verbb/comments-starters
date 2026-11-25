<script setup lang="ts">
import type { CommentsFieldDisplayProps } from '@verbb/comments-vue';
import { computed } from 'vue';

/** The rating on a comment, beside its date. */
const props = defineProps<Pick<CommentsFieldDisplayProps, 'value'>>();

const score = computed(() => Math.max(0, Math.min(5, Number(props.value) || 0)));
</script>

<template>
    <span role="img" :aria-label="`Rated ${score} out of 5`" class="text-amber-400">
        {{ '★'.repeat(score) }}<span class="text-slate-300">{{ '★'.repeat(5 - score) }}</span>
    </span>
</template>
