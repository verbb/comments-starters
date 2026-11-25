<script setup lang="ts">
/** A guest's name or email on the "Your own interface" form, with the data API's messages for it. */
withDefaults(defineProps<{ label: string; name: string; type?: string; errors?: string[] }>(), { type: 'text', errors: () => [] });
</script>

<template>
    <label class="block">
        <span class="text-sm font-medium">{{ label }}</span>
        <input :name="name" :type="type" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" :aria-invalid="errors.length ? 'true' : undefined">
        <span v-for="message in errors" :key="message" class="mt-1 block text-sm text-red-700">{{ message }}</span>
    </label>
</template>
