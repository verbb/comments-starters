'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The starter's pages, as tabs above the demo. Each keeps the post you're on.
export function StarterTabs() {
    const pathname = usePathname();
    const slug = pathname.split('/')[2] ?? '';
    const tabs = [
        { base: '/blog', label: 'The thread' },
        { base: '/custom', label: 'Your own interface' },
        { base: '/proxy', label: 'Through a proxy' },
    ];

    return (
        <nav aria-label="Pages" className="mb-8 flex flex-wrap gap-x-6 border-b border-slate-200">
            {tabs.map((tab) => (
                <Link
                    key={tab.base}
                    href={`${tab.base}/${slug}`}
                    aria-current={pathname.startsWith(`${tab.base}/`) ? 'page' : undefined}
                    className="-mb-px border-b-2 border-transparent pb-3 text-sm text-slate-500 hover:text-slate-900 aria-[current=page]:border-slate-900 aria-[current=page]:font-semibold aria-[current=page]:text-slate-900"
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
