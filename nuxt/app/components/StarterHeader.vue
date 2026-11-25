<script setup lang="ts">
/**
 * The chrome every starter shares, here and on the Craft site: the Comments mark and name linking
 * home, this starter's mark beside it, and sign-in, in the slot, on the right.
 */

// The starters' home page, on the Craft site this app is a subdomain of.
const startersUrl = `${useRuntimeConfig().public.craftUrl}/`;
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
                    <path fill="#00dc82" d="M13.4642 19.8295h8.9218c.2834 0 .5618-.0723.8072-.2098a1.5899 1.5899 0 0 0 .5908-.5732 1.5293 1.5293 0 0 0 .216-.783 1.529 1.529 0 0 0-.2167-.7828L17.7916 7.4142a1.5904 1.5904 0 0 0-.5907-.573 1.6524 1.6524 0 0 0-.807-.2099c-.2833 0-.5616.0724-.807.2098a1.5904 1.5904 0 0 0-.5907.5731L13.4642 9.99l-2.9954-5.0366a1.5913 1.5913 0 0 0-.591-.573 1.6533 1.6533 0 0 0-.8071-.2098c-.2834 0-.5617.0723-.8072.2097a1.5913 1.5913 0 0 0-.591.573L.2168 17.4808A1.5292 1.5292 0 0 0 0 18.2635c-.0001.2749.0744.545.216.783a1.59 1.59 0 0 0 .5908.5732c.2454.1375.5238.2098.8072.2098h5.6003c2.219 0 3.8554-.9454 4.9813-2.7899l2.7337-4.5922L16.3935 9.99l4.3944 7.382h-5.8586ZM7.123 17.3694l-3.9083-.0009 5.8586-9.8421 2.9232 4.921-1.9572 3.2892c-.7478 1.1967-1.5972 1.6328-2.9163 1.6328z" />
                </svg>
                Nuxt
            </span>
            <div class="ml-auto">
                <slot />
            </div>
        </div>
    </header>
</template>
