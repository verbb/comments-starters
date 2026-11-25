import 'server-only';

import { createHmac, randomBytes } from 'node:crypto';

/**
 * Server-to-server requests to Comments, signed with the Member Token Key. The signature is an
 * HMAC-SHA256 over the timestamp, a one-off nonce, the method, the action and the exact body, one per
 * line, so a request can't be replayed or changed on the way.
 */
const serverUrl = (process.env.COMMENTS_SERVER_URL ?? '').replace(/\/$/, '');

export async function signedRequest<T>(action: 'member-token' | 'revoke-member-tokens', payload: object): Promise<T> {
    const key = process.env.COMMENTS_MEMBER_TOKEN_KEY;

    if (!key || !serverUrl) {
        throw new Error('Set COMMENTS_SERVER_URL and COMMENTS_MEMBER_TOKEN_KEY to sign members in.');
    }

    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = randomBytes(18).toString('base64url');
    const signature = createHmac('sha256', key).update([timestamp, nonce, 'POST', `comments/api/${action}`, body].join('\n')).digest('hex');

    const response = await fetch(`${serverUrl}/${action}`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Comments-Signature': `t=${timestamp}, n=${nonce}, v1=${signature}`,
        },
        body,
        cache: 'no-store',
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(result?.message ?? `Comments answered ${response.status}.`);
    }

    return result as T;
}
