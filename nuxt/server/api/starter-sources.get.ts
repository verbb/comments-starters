import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * The files behind each page, for the header's code drawer, read from this app's own source so the
 * drawer shows what runs. They're read here rather than imported with `?raw`, because Nuxt replaces
 * `import.meta.server` and `import.meta.client` as plain text, inside a raw string too, so a raw
 * import would show the browser `false` where the source says `import.meta.server`. Paths are
 * relative to the app, which is where `nuxt dev` and the production server run.
 */
const pages = {
    thread: ['app/pages/blog/[...slug].vue', 'app/plugins/comments.ts', 'app/components/VerifiedBadge.vue'],
    custom: ['app/pages/custom/[...slug].vue', 'app/components/CommentForm.vue', 'app/components/DiscussionComment.vue', 'app/plugins/comments.ts'],
};

export default defineEventHandler(async () => {
    const read = (files: string[]) => Promise.all(files.map(async (file) => ({ path: `nuxt/${file}`, source: await readFile(path.join(process.cwd(), file), 'utf8') })));

    return { thread: await read(pages.thread), custom: await read(pages.custom) };
});
