import { NextResponse, type NextRequest } from 'next/server';

import { signedRequest } from '@/lib/comments-server';
import { people } from '@/lib/people';
import { currentPerson } from '@/lib/session';

/**
 * Called by `memberToken({ getToken })` in the browser, when the thread starts and again shortly
 * before each token expires. It asks Comments for a short-lived token for whoever is signed in to
 * this app, for this app's origin only, so a token copied to another site doesn't work there.
 */
export async function GET(request: NextRequest) {
    const person = await currentPerson();

    if (!person) {
        return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });
    }

    try {
        const minted = await signedRequest<{ token: string; expiresAt: number }>('member-token', {
            user: { email: people[person].email },
            // The origin the browser's requests will carry. Behind a proxy, the request's own URL may name
            // an internal host or plain http, so a deployment sets its public origin.
            origin: process.env.STARTER_PUBLIC_ORIGIN || request.nextUrl.origin,
        });

        return NextResponse.json({ token: minted.token, expiresAt: minted.expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Couldn’t get a token.' }, { status: 502 });
    }
}
