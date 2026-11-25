<script setup lang="ts">
import type { CommentsFieldInputProps } from '@verbb/comments-vue';
import { computed } from 'vue';

/**
 * The rating field as five stars on the form. Comments keeps the field's label, instructions and
 * error around it and posts whatever `setValue()` was given last.
 */
const props = defineProps<Pick<CommentsFieldInputProps, 'value' | 'setValue' | 'error' | 'id' | 'labelId' | 'describedBy'>>();

const scores = [1, 2, 3, 4, 5];
const current = computed(() => Number(props.value) || 0);
</script>

<template>
    <div :id="id" role="radiogroup" :aria-labelledby="labelId" :aria-describedby="describedBy ?? undefined" :aria-invalid="error ? 'true' : undefined" class="flex gap-1">
        <button
            v-for="score in scores"
            :key="score"
            type="button"
            role="radio"
            :aria-checked="current === score"
            :aria-label="`${score} out of 5`"
            :class="['text-2xl leading-none hover:text-amber-300', score <= current ? 'text-amber-400' : 'text-slate-300']"
            @click="setValue(current === score ? null : score)"
        >
            ★
        </button>
    </div>
</template>
