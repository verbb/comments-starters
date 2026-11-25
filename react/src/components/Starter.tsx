import type { ReactNode } from 'react';

import { CodeDrawer, type CodeFile } from './CodeDrawer';

/**
 * The chrome every starter shares, here and on the Craft site: the Comments mark and name linking
 * home, this starter's mark beside it, sign-in on the right, the Verbb footer, and an aside saying
 * what the page shows, with its code, the thread's events and how to run it. None of it is needed to
 * use Comments.
 */

// The starters' home page on the Craft site. Served from Craft, the built app is on the same site.
const startersUrl = import.meta.env.VITE_STARTERS_URL || '/';

export function StarterHeader({ children }: { children?: ReactNode }) {
    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-3 px-6 py-4">
                <a href={startersUrl} className="flex items-center gap-2.5 text-lg font-semibold">
                    <CommentsLogo className="size-7" />
                    Comments Starters
                </a>
                <svg viewBox="0 0 16 16" className="size-4 text-slate-300" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="flex items-center gap-2 text-lg font-semibold">
                    <ReactLogo className="size-5" />
                    React
                </span>
                <div className="ml-auto">{children}</div>
            </div>
        </header>
    );
}

export function StarterFooter() {
    return (
        <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-8 text-sm text-slate-500">
            <span>Drawn with <code>@verbb/comments-react</code>.</span>
            <a href="https://verbb.io" aria-label="Verbb" className="text-slate-300 hover:text-slate-400">
                <VerbbLogo className="h-4 w-auto" />
            </a>
        </footer>
    );
}

export type StarterTab = { path: string; label: string };

/** The starter's own pages, as tabs above the demo. */
export function StarterTabs({ tabs, current, href, onSelect }: { tabs: StarterTab[]; current: string; href: (path: string) => string; onSelect: (path: string) => void }) {
    return (
        <nav aria-label="Pages" className="mb-8 flex flex-wrap gap-x-6 border-b border-slate-200">
            {tabs.map((tab) => (
                <a
                    key={tab.path}
                    href={href(tab.path)}
                    onClick={(event) => {
                        event.preventDefault();
                        onSelect(tab.path);
                    }}
                    aria-current={tab.path === current ? 'page' : undefined}
                    className="-mb-px border-b-2 border-transparent pb-3 text-sm text-slate-500 hover:text-slate-900 aria-[current=page]:border-slate-900 aria-[current=page]:font-semibold aria-[current=page]:text-slate-900"
                >
                    {tab.label}
                </a>
            ))}
        </nav>
    );
}

/** Two columns: the demo, and the aside. */
export function StarterPage({ children, aside }: { children: ReactNode; aside: ReactNode }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="min-w-0">{children}</div>
            <aside className="text-sm lg:sticky lg:top-6 lg:self-start">{aside}</aside>
        </div>
    );
}

/**
 * What the page shows, the files behind it in a drawer, the events the thread has sent (when the
 * page listens for any), and how to run the starter.
 */
export function StarterAside({ about, code, events }: { about: ReactNode; code: { title: string; files: CodeFile[] }; events?: string[] }) {
    return (
        <div className="space-y-8">
            <p className="text-slate-600">{about}</p>

            <section>
                <h2 className="font-semibold">Code</h2>
                <p className="mt-1 text-slate-500">The {code.files.length} files behind this page, as they run.</p>
                <CodeDrawer title={code.title} files={code.files} />
            </section>

            {events ? (
                <section>
                    <h2 className="font-semibold">Events</h2>
                    <p className="mt-1 text-slate-500">What the thread tells the app, through its event props.</p>
                    <ol className="mt-3 space-y-1 text-slate-700" aria-live="polite">
                        {events.length ? events.map((line, index) => <li key={`${index}-${line}`}>{line}</li>) : <li className="text-slate-400">Nothing yet. Vote or comment.</li>}
                    </ol>
                </section>
            ) : null}

            <section>
                <h2 className="font-semibold">Run it locally</h2>
                <p className="mt-1 text-slate-500">With the Craft site and packages installed as the README describes:</p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-700">npm run dev --prefix react</pre>
            </section>
        </div>
    );
}

/** Choosing between items, such as the seeded posts. */
export const pillClass = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300 aria-pressed:border-indigo-300 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-900';

function CommentsLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 544.2 544.2" className={className} aria-hidden="true">
            <g fill="#ffa515">
                <path d="M272.9 229.4c-12.2 0-22.2 10-22.2 22.2s10 22.2 22.2 22.2 22.2-10 22.2-22.2-10-22.2-22.2-22.2zM193.2 229.4c-12.2 0-22.2 10-22.2 22.2s10 22.2 22.2 22.2c12.9 0 23-10.1 22.2-22.2 0-12.2-10-22.2-22.2-22.2z" />
                <path d="M272.1 0C2.1 0 0 121.8 0 272.1s2.1 272.1 272.1 272.1 272.1-121.8 272.1-272.1S542.1 0 272.1 0zm15.8 379.4c-16.5 2.2-31.5 2.2-46.6 0-52.4 53.8-107.7 43-96.9 34.4 26.6-20.8 32.3-40.2 30.9-56-34.5-20.1-58.9-51-63.2-88.3-8.6-70.4 56.7-135 145-145 88.3-9.3 167.2 39.5 175.1 109.8 7.9 70.4-56.7 134.9-144.3 145.1z" />
                <path d="M352.5 229.4c-12.2 0-22.2 10-22.2 22.2s10 22.2 22.2 22.2 22.3-10.1 22.2-22.2c0-12.2-10-22.2-22.2-22.2z" />
            </g>
        </svg>
    );
}

function ReactLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="-11.5 -10.232 23 20.463" className={className} aria-hidden="true">
            <circle r="2.05" fill="#149eca" />
            <g fill="none" stroke="#149eca" strokeWidth="1">
                <ellipse rx="11" ry="4.2" />
                <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                <ellipse rx="11" ry="4.2" transform="rotate(120)" />
            </g>
        </svg>
    );
}

function VerbbLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 148 33" className={className} aria-hidden="true">
            <path fill="currentColor" d={verbbPath} />
        </svg>
    );
}

const verbbPath = 'M49.508.392c-8.65 0-15.328 6.724-17.34 12.974C28.904 23.498 35.4 32.32 45.194 32.32c6.057 0 11.377-2.498 14.52-5.642 1.332-1.33.486-2.157-.53-2.685-.558-.29-2.22-1.125-2.22-1.125-.9-.46-2.062-.523-3.046.045-1.405.807-2.765 2.148-7.704 2.148-3.972 0-6.907-2.673-7.443-6.308 0 0 16.407-.055 22.168-.055 1.93 0 2.62-1.572 2.62-4.48 0-8.3-6.138-13.825-14.052-13.825zM39.73 13.326c1.7-3.31 5.194-5.676 8.933-5.676 3.737 0 6.564 2.367 7.333 5.676H39.73zM32.706.953c1.236 0 1.86 1.055 1.295 2.265L20.623 29.532c-.68 1.34-2.08 2.228-3.506 2.228h-5.835c-1.236 0-2.23-.777-2.48-1.942L3.558 5.584H1.707c-.594 0-1.08-.358-1.233-.908L.01 2.994c-.27-.97.594-2.04 1.647-2.04h7.98c1.12 0 2.01.726 2.194 1.796l3.596 20.798L25.604 2.574c.472-.97 1.476-1.62 2.502-1.62h4.6zm107.615.03c4.638.333 7.803 4.197 7.133 8.968-.324 2.31-1.51 4.395-3.16 5.99 1.64 1.678 2.505 4.09 2.124 6.805-.71 5.056-5.387 9.09-10.44 9.09l-14.02-.04c-1.012-.003-1.716-.825-1.574-1.838l.026-.19c1.723-2.055 2.922-4.48 3.298-7.17.357-2.523-.07-4.977-1.183-7.053 1.172-1.77 1.94-3.735 2.22-5.74.3-2.137.03-4.156-.686-5.93l.14-1.01c.15-1.072 1.145-1.94 2.217-1.938l13.903.057zm-1.477 21.303c.256-1.82-.735-3.29-2.212-3.307l.003-.006h-7.025l-.932 6.627 7.025-.005c1.484-.015 2.887-1.487 3.143-3.31zm1.746-12.11c.262-1.884-.74-3.414-2.24-3.414h-7.026l-.96 6.827h7.024c1.502 0 2.936-1.53 3.2-3.414zM113.194.956c4.638.334 7.803 4.198 7.133 8.967-.324 2.31-1.51 4.395-3.16 5.992 1.64 1.676 2.504 4.09 2.124 6.803-.71 5.057-5.387 9.09-10.44 9.09l-14.02-.04c-1.012-.003-1.716-.825-1.574-1.838l3.818-27.093C97.226 1.767 98.214.9 99.284.9h.008l13.903.057zm-1.477 21.304c.256-1.82-.735-3.292-2.212-3.307l.002-.006h-7.025l-.932 6.627 7.026-.006c1.483-.015 2.886-1.486 3.142-3.308zm1.746-12.11c.263-1.885-.738-3.415-2.24-3.415H104.2l-.96 6.828h7.023c1.502 0 2.936-1.53 3.2-3.413zm-21.2-1.44c0 4.94-4.24 9.76-9.49 9.76l7 10.615c1.154 1.872.094 2.66-1.446 2.66l-4.3.01c-1.303 0-2.643-1.024-3.388-2.357l-5.424-10.504h-1.15L72.59 29.398c-.183 1.3-1.385 2.358-2.688 2.358h-3.266c-1.3 0-2.208-1.057-2.024-2.358L68.28 3.305c.18-1.3 1.385-2.358 2.686-2.358h13.66l-.005.017c4.87.087 7.645 3.852 7.645 7.745zm-8.226 1.368c.265-1.887-.737-3.415-2.24-3.415h-6.012l-.96 6.828h6.013c1.5 0 2.933-1.528 3.198-3.412z';
