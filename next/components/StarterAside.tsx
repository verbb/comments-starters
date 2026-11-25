'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { CodeDrawer, type CodeSet } from './CodeDrawer';

const describe: Record<string, (detail: Record<string, unknown>) => string> = {
    'comments:comment-created': (detail) => `Posted a comment (${detail.moderationState})`,
    'comments:vote-changed': (detail) => (detail.vote ? `Voted ${detail.vote}` : 'Took a vote back'),
    'comments:follow-changed': (detail) => (detail.following ? 'Following the discussion' : 'Stopped following'),
};

/**
 * What the page shows, the files behind it in a drawer, the thread's events and how to run the starter. The thread's `comments:*`
 * events bubble up to the document, so this listens there rather than through the thread's props,
 * which keeps the thread itself free of the starter's chrome. A page drawn on the hooks sends no DOM
 * events, so it leaves Events out.
 */
export function StarterAside({ children, code, events: showEvents = true }: { children: ReactNode; code: CodeSet; events?: boolean }) {
    const [events, setEvents] = useState<string[]>([]);

    useEffect(() => {
        if (!showEvents) {
            return;
        }

        const listeners = Object.entries(describe).map(([name, line]) => {
            const listener = (event: Event) => {
                const text = line((event as CustomEvent<Record<string, unknown>>).detail);
                setEvents((previous) => [text, ...previous].slice(0, 5));
            };
            document.addEventListener(name, listener);

            return [name, listener] as const;
        });

        return () => listeners.forEach(([name, listener]) => document.removeEventListener(name, listener));
    }, [showEvents]);

    return (
        <div className="space-y-8">
            <p className="text-slate-600">{children}</p>

            <section>
                <h2 className="font-semibold">Code</h2>
                <p className="mt-1 text-slate-500">The {code.files.length} files behind this page, as they run.</p>
                <CodeDrawer title={code.title} files={code.files} />
            </section>

            {showEvents ? (
                <section>
                    <h2 className="font-semibold">Events</h2>
                    <p className="mt-1 text-slate-500">What the thread tells the page, through its <code>comments:*</code> events.</p>
                    <ol className="mt-3 space-y-1 text-slate-700" aria-live="polite">
                        {events.length ? events.map((line, index) => <li key={`${index}-${line}`}>{line}</li>) : <li className="text-slate-400">Nothing yet. Vote or comment.</li>}
                    </ol>
                </section>
            ) : null}

            <section>
                <h2 className="font-semibold">Run it locally</h2>
                <p className="mt-1 text-slate-500">With the Craft site and packages installed as the README describes:</p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-700">npm run dev --prefix next</pre>
            </section>
        </div>
    );
}
