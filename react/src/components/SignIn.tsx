import { useEffect, useState } from 'react';

import { getSession, signIn, signOut, type Session } from '../craft';

// The seeded people, all with the password "password".
const people = [
    { loginName: 'priya', label: 'Priya, a member' },
    // The seeded moderator only signs in locally. On a public demo, Craft refuses them.
    ...(import.meta.env.DEV ? [{ loginName: 'sam', label: 'Sam, a moderator' }] : []),
];

export function SignIn() {
    const [session, setSession] = useState<Session | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSession().then(setSession, () => setError('Couldn’t reach Craft.'));
    }, []);

    const run = async (task: () => Promise<void>) => {
        setBusy(true);
        setError(null);

        try {
            await task();
            setSession(await getSession());
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Something went wrong.');
        } finally {
            setBusy(false);
        }
    };

    if (!session) {
        return error ? <p className="text-sm text-red-700">{error}</p> : null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            {session.isGuest ? (
                <>
                    <span className="text-slate-600">Reading as a guest. Sign in as</span>
                    {people.map((person) => (
                        <button key={person.loginName} type="button" disabled={busy} onClick={() => run(() => signIn(person.loginName, 'password'))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                            {person.label}
                        </button>
                    ))}
                </>
            ) : (
                <>
                    <span className="text-slate-600">Signed in as <strong className="text-slate-900">{session.username}</strong></span>
                    <button type="button" disabled={busy} onClick={() => run(signOut)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                        Sign out
                    </button>
                </>
            )}
            {error ? <span role="alert" className="text-red-700">{error}</span> : null}
        </div>
    );
}
