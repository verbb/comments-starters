import { cookieSession } from '@verbb/comments-core';

/**
 * The app runs on Craft's own origin (through the dev server's proxy, or served from Craft when
 * built), so Craft's session cookie identifies the person: sign-in tier 1. It's made once, here, so
 * every thread shares it, and `reset()` after signing in or out has them read the viewer again.
 */
export const auth = cookieSession();

export const endpoint = import.meta.env.VITE_COMMENTS_ENDPOINT || '/actions/comments/api';

export type Session = { isGuest: boolean; username: string | null; csrfTokenValue: string };

// Comments never handles passwords, so members sign in to Craft itself, with its own actions.
async function action<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`/actions/${path}`, {
        ...init,
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(body.message ?? `Craft answered ${response.status}.`);
    }

    return body as T;
}

let reading: Promise<Session> | null = null;

/**
 * Callers at the same time share one read. For a guest, each read starts Craft's CSRF cookie afresh,
 * so two at once, such as React's StrictMode mounting the sign-in twice in development, could replace
 * the cookie after the comments have their token, and their next write would need a retry.
 */
export function getSession(): Promise<Session> {
    reading ??= action<Session>('users/session-info').finally(() => { reading = null; });

    return reading;
}

export async function signIn(loginName: string, password: string): Promise<void> {
    const { csrfTokenValue } = await getSession();

    await action('users/login', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfTokenValue },
        body: JSON.stringify({ loginName, password }),
    });
    auth.reset?.();
}

export async function signOut(): Promise<void> {
    const { csrfTokenValue } = await getSession();

    await action('users/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfTokenValue } });
    auth.reset?.();
}
