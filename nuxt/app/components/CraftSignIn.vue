<script setup lang="ts">
import { useViewer } from '~/composables/viewer';

/**
 * Who's signed in, from the thread's `viewer` read. Comments never handles passwords, and Craft's
 * login action can't be called with credentials from another origin, so members sign in on the
 * Craft site itself. Its session cookie comes back with the thread's requests from here.
 */
const viewer = useViewer();
const craftUrl = useRuntimeConfig().public.craftUrl;
</script>

<template>
    <div class="flex flex-wrap items-center gap-2 text-sm">
        <template v-if="viewer && !viewer.isGuest">
            <span class="text-slate-600">Signed in as <strong class="text-slate-900">{{ viewer.name }}</strong></span>
            <a :href="`${craftUrl}/logout`" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">Sign out on the Craft site</a>
        </template>
        <template v-else>
            <span v-if="viewer" class="text-slate-600">Reading as a guest.</span>
            <a :href="`${craftUrl}/login`" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">Sign in on the Craft site</a>
        </template>
    </div>
</template>
