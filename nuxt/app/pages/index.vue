<script setup lang="ts">
import { postPath, posts } from '~/posts';

// The starter is the blog's posts, so the home page sends readers to the first one.
const config = useRuntimeConfig();

await navigateTo(postPath(config.public.commentsEntryUri || posts[0].uri), { redirectCode: 302 });
</script>

<template>
    <div />
</template>
