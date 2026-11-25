<script setup lang="ts">
/**
 * The chrome every starter shares, here and on the Craft site: the Comments mark and name linking
 * home, this starter's mark beside it, and sign-in, in the slot, on the right.
 */

// The starters' home page on the Craft site. Served from Craft, the built app is on the same site.
const startersUrl = import.meta.env.VITE_STARTERS_URL || '/';
</script>

<template>
    <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-3 px-6 py-4">
            <a :href="startersUrl" class="flex items-center gap-2.5 text-lg font-semibold">
                <svg viewBox="0 0 544.2 544.2" class="size-7" aria-hidden="true">
                    <g fill="#ffa515">
                        <path d="M272.9 229.4c-12.2 0-22.2 10-22.2 22.2s10 22.2 22.2 22.2 22.2-10 22.2-22.2-10-22.2-22.2-22.2zM193.2 229.4c-12.2 0-22.2 10-22.2 22.2s10 22.2 22.2 22.2c12.9 0 23-10.1 22.2-22.2 0-12.2-10-22.2-22.2-22.2z" />
                        <path d="M272.1 0C2.1 0 0 121.8 0 272.1s2.1 272.1 272.1 272.1 272.1-121.8 272.1-272.1S542.1 0 272.1 0zm15.8 379.4c-16.5 2.2-31.5 2.2-46.6 0-52.4 53.8-107.7 43-96.9 34.4 26.6-20.8 32.3-40.2 30.9-56-34.5-20.1-58.9-51-63.2-88.3-8.6-70.4 56.7-135 145-145 88.3-9.3 167.2 39.5 175.1 109.8 7.9 70.4-56.7 134.9-144.3 145.1z" />
                        <path d="M352.5 229.4c-12.2 0-22.2 10-22.2 22.2s10 22.2 22.2 22.2 22.3-10.1 22.2-22.2c0-12.2-10-22.2-22.2-22.2z" />
                    </g>
                </svg>
                Comments Starters
            </a>
            <svg viewBox="0 0 16 16" class="size-4 text-slate-300" aria-hidden="true">
                <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" />
            </svg>
            <span class="flex items-center gap-2 text-lg font-semibold">
                <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
                    <path fill="#42b883" d="M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z" />
                </svg>
                Vue
            </span>
            <div class="ml-auto">
                <slot />
            </div>
        </div>
    </header>
</template>
