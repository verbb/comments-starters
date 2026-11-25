'use client';

import { guestSession, memberToken } from '@verbb/comments-core';
import { CommentsProvider, CommentsThread, type CommentsFieldOverrides, type CommentsPartOverrides } from '@verbb/comments-react';
import { useMemo, type ReactNode } from 'react';

import { RatingDisplay, RatingInput } from './Rating';
import { VerifiedBadge } from './VerifiedBadge';

const parts: CommentsPartOverrides = { badge: VerifiedBadge };
const fields: CommentsFieldOverrides = { rating: { input: RatingInput, display: RatingDisplay } };

/**
 * The thread, in a client component because its overrides and event props are functions. This app
 * is on another site from Craft, so Craft's cookies never reach it (sign-in tier 3):
 *
 * - Members get short-lived member tokens from this app's own server, at /api/comments-token, which
 *   signs its request to Comments with the Member Token Key. Core asks again before each expires.
 * - Guests get a guest session token from Comments, kept for the tab in sessionStorage so their own
 *   pending comment and votes follow them across pages.
 */
export function Comments({ uri, count, signedIn, endpoint }: { uri: string; count: number; signedIn: boolean; endpoint?: string }) {
    return (
        <StarterCommentsProvider signedIn={signedIn} endpoint={endpoint}>
            <CommentsThread key={uri} ownerUri={uri} count={count} parts={parts} fields={fields} />
        </StarterCommentsProvider>
    );
}

/** The endpoint and sign-in every thread and hook inside shares. */
export function StarterCommentsProvider({ signedIn, endpoint, children }: { signedIn: boolean; endpoint?: string; children: ReactNode }) {
    // One provider per kind of sign-in, so signing in or out starts the thread again as that person.
    const auth = useMemo(() => {
        // The proxy variant uses Craft's own session through the proxy, and the server render needs
        // no sign-in at all, since only the mount point is drawn there.
        if (endpoint || typeof window === 'undefined') {
            return undefined;
        }

        return signedIn
            ? memberToken({ getToken: () => fetch('/api/comments-token', { cache: 'no-store' }).then((response) => response.json()) })
            : guestSession({ storage: sessionStorage });
    }, [signedIn, endpoint]);

    return (
        <CommentsProvider endpoint={endpoint ?? process.env.NEXT_PUBLIC_COMMENTS_ENDPOINT} auth={auth} theme="auto">
            {children}
        </CommentsProvider>
    );
}
