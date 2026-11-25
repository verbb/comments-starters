import { NextResponse, type NextRequest } from 'next/server';

import { signedRequest } from '@/lib/comments-server';
import { isPersonKey, people } from '@/lib/people';
import { currentPerson, signInAs, signOut } from '@/lib/session';

/**
 * Signs in to this demo site as one of its people. Only JSON from this app's own pages is accepted,
 * so another site can't sign a visitor in with a form of its own.
 */
export async function POST(request: NextRequest) {
    if (!isOwnJsonRequest(request)) {
        return NextResponse.json({ message: 'Sign in from this site.' }, { status: 403 });
    }

    const { person } = await request.json().catch(() => ({}));

    if (!isPersonKey(person)) {
        return NextResponse.json({ message: 'Choose someone to sign in as.' }, { status: 400 });
    }

    await signInAs(person);

    return NextResponse.json({ person });
}

/**
 * Signs out here, and revokes the person's member tokens at Comments, so one still held by an open
 * tab stops working straight away rather than when it expires.
 */
export async function DELETE(request: NextRequest) {
    if (!isOwnJsonRequest(request)) {
        return NextResponse.json({ message: 'Sign out from this site.' }, { status: 403 });
    }

    const person = await currentPerson();

    await signOut();

    if (person) {
        await signedRequest('revoke-member-tokens', { user: { email: people[person].email } }).catch(() => null);
    }

    return NextResponse.json({ person: null });
}

function isOwnJsonRequest(request: NextRequest): boolean {
    const origin = request.headers.get('origin');

    return request.headers.get('content-type')?.startsWith('application/json') === true && (origin === null || origin === request.nextUrl.origin);
}
