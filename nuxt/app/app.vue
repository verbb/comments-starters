<script setup lang="ts">
import CraftSignIn from '~/components/CraftSignIn.vue';
import StarterFooter from '~/components/StarterFooter.vue';
import StarterHeader from '~/components/StarterHeader.vue';
import StarterTabs from '~/components/StarterTabs.vue';

// `plugins/comments.ts` gives every thread and composable here the endpoint and the sign-in.
</script>

<template>
    <StarterHeader>
        <CraftSignIn />
    </StarterHeader>

    <main class="mx-auto max-w-5xl px-6 py-10">
        <StarterTabs />
        <NuxtPage />
    </main>

    <StarterFooter />
</template>
