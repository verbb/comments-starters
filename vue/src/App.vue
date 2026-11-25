<script setup lang="ts">
import SignIn from './components/SignIn.vue';
import StarterFooter from './components/StarterFooter.vue';
import StarterHeader from './components/StarterHeader.vue';
import StarterTabs from './components/StarterTabs.vue';
import CustomPage from './pages/CustomPage.vue';
import ThreadPage from './pages/ThreadPage.vue';
import { href, navigate, usePath } from './router';

// `CommentsPlugin` in `main.ts` gives every thread and composable here the endpoint and the sign-in.
const path = usePath();

const pages = [
    { path: '/', label: 'The thread' },
    { path: '/custom', label: 'Your own interface' },
];
</script>

<template>
    <StarterHeader>
        <SignIn />
    </StarterHeader>

    <main class="mx-auto max-w-5xl px-6 py-10">
        <StarterTabs :tabs="pages" :current="path" :href="href" @select="navigate" />
        <CustomPage v-if="path === '/custom'" />
        <ThreadPage v-else />
    </main>

    <StarterFooter />
</template>
