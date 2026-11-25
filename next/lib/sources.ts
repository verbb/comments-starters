import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { CodeSet } from '@/components/CodeDrawer';

// The files behind each page, for the aside's code drawer, read from this app's own source on the
// server so the drawer shows what runs rather than a copy that could drift from it. Paths are
// relative to the app, which is where `next dev` and `next start` run.
const pages = {
    blog: {
        title: 'The thread',
        files: ['app/blog/[slug]/page.tsx', 'components/Comments.tsx', 'app/api/comments-token/route.ts', 'components/VerifiedBadge.tsx'],
    },
    custom: {
        title: 'Your own interface',
        files: ['app/custom/[slug]/page.tsx', 'components/CustomThread.tsx', 'components/Comments.tsx'],
    },
    proxy: {
        title: 'Through a proxy',
        files: ['app/proxy/[slug]/page.tsx', 'app/actions/comments/[...path]/route.ts', 'components/Comments.tsx'],
    },
};

let cached: Promise<Record<keyof typeof pages, CodeSet>> | null = null;

export async function readSources(page: keyof typeof pages): Promise<CodeSet> {
    return (await readAll())[page];
}

function readAll(): Promise<Record<keyof typeof pages, CodeSet>> {
    // The files don't change while a production server runs, so they're read once. In development
    // they're read on each request, so edits show up.
    if (cached && process.env.NODE_ENV === 'production') {
        return cached;
    }

    cached = Promise.all(
        Object.entries(pages).map(async ([key, page]) => {
            const files = await Promise.all(page.files.map(async (file) => ({ path: `next/${file}`, source: await readFile(path.join(process.cwd(), file), 'utf8') })));

            return [key, { title: page.title, files }] as const;
        }),
    ).then((entries) => Object.fromEntries(entries) as Record<keyof typeof pages, CodeSet>);

    return cached;
}
