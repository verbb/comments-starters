'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { people, type PersonKey } from '@/lib/people';

/** Signs in and out of this demo site. Members are then signed in to Comments with member tokens. */
export function SessionBar({ person }: { person: PersonKey | null }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const change = async (init: RequestInit) => {
        setBusy(true);

        try {
            await fetch('/api/session', { ...init, headers: { 'Content-Type': 'application/json' } });
            // The page reads who's signed in on the server, and the thread changes sign-in with it.
            router.refresh();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            {person ? (
                <>
                    <span className="text-slate-600">Signed in as <strong className="text-slate-900">{people[person].name}</strong></span>
                    <button type="button" disabled={busy} onClick={() => change({ method: 'DELETE' })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                        Sign out
                    </button>
                </>
            ) : (
                <>
                    <span className="text-slate-600">Reading as a guest. Sign in as</span>
                    {(Object.keys(people) as PersonKey[]).map((key) => (
                        <button key={key} type="button" disabled={busy} onClick={() => change({ method: 'POST', body: JSON.stringify({ person: key }) })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                            {people[key].label}
                        </button>
                    ))}
                </>
            )}
        </div>
    );
}
