import Link from 'next/link';

import { posts } from '@/lib/posts';

export function PostNav({ slug, base = '/blog' }: { slug: string; base?: string }) {
    return (
        <nav aria-label="Posts" className="flex flex-wrap gap-2">
            {posts.map((post) => (
                <Link
                    key={post.slug}
                    href={`${base}/${post.slug}`}
                    aria-current={post.slug === slug ? 'page' : undefined}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300 aria-[current=page]:border-indigo-300 aria-[current=page]:bg-indigo-50 aria-[current=page]:text-indigo-900"
                >
                    {post.title}
                </Link>
            ))}
        </nav>
    );
}
