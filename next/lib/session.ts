import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

import { isPersonKey, type PersonKey } from './people';

/**
 * This demo's own sign-in, standing in for whatever sign-in a real site has: a cookie naming the
 * person, signed so the browser can't change it. Comments never sees it, and only trusts this app's
 * signed requests for member tokens. It's deliberately bare. A real site's session would expire,
 * and signing out would end it on the server too, rather than only deleting the cookie.
 */
const COOKIE = 'starter_session';

// Read when it's needed, and required. Next.js bundles route handlers and pages separately, so a
// random fallback would differ between them and no sign-in would ever be recognised.
function sign(value: string): string {
    const secret = process.env.STARTER_SESSION_SECRET;

    if (!secret) {
        throw new Error('Set STARTER_SESSION_SECRET in .env.local to sign in. craft/scripts/install.sh fills it in.');
    }

    return createHmac('sha256', secret).update(value).digest('hex');
}

export async function currentPerson(): Promise<PersonKey | null> {
    const value = (await cookies()).get(COOKIE)?.value ?? '';

    if (!value) {
        return null;
    }

    const [person, signature = ''] = value.split('.');
    const expected = sign(person);

    if (!isPersonKey(person) || signature.length !== expected.length) {
        return null;
    }

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? person : null;
}

export async function signInAs(person: PersonKey): Promise<void> {
    (await cookies()).set(COOKIE, `${person}.${sign(person)}`, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' });
}

export async function signOut(): Promise<void> {
    (await cookies()).delete(COOKIE);
}
