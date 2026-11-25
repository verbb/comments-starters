import type { NextRequest } from 'next/server';

/**
 * The proxy variant (/proxy/…): this app forwards Comments' actions to Craft, so the browser only
 * ever talks to this origin and Craft's own session applies (sign-in tier 1), with no member tokens.
 *
 * A proxy has three jobs for Comments, which any production proxy (Nginx, a CDN, a platform's
 * rewrites) needs as well:
 *
 * 1. Craft must see the request as coming from its own origin. Tier 1 refuses a write whose Origin
 *    isn't one of Craft's, so this sends Craft's origin for requests from this app's own pages. A
 *    production proxy can instead keep the Host header, or send an X-Forwarded-Host Craft trusts.
 * 2. Craft's cookies must be valid for this origin, so their Domain is dropped on the way back.
 * 3. Craft must see the visitor's address, not this server's, or every visitor shares one rate limit.
 *    This sends X-Forwarded-For, which Craft only believes from a proxy it trusts.
 */
const craftActions = (process.env.COMMENTS_SERVER_URL ?? 'https://comments-starters.ddev.site/actions/comments/api').replace(/\/comments\/api\/?$/, '');
const craftOrigin = new URL(craftActions).origin;

// Headers that describe this hop, not the request, which fetch() sets for itself.
const HOP_HEADERS = ['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'accept-encoding'];

async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
    const { path } = await params;
    const target = new URL(`${craftActions}/comments/${path.map(encodeURIComponent).join('/')}`);
    target.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    HOP_HEADERS.forEach((name) => headers.delete(name));

    // Only a request from this app's own pages is passed on as Craft's own. Anything else keeps its
    // Origin, so Craft refuses it as it would without the proxy. Behind a proxy of its own the app is
    // reached over plain HTTP, so its public origin comes from the env when set.
    if (headers.get('origin') === (process.env.STARTER_PUBLIC_ORIGIN || request.nextUrl.origin)) {
        headers.set('origin', craftOrigin);
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        headers.set('x-forwarded-for', forwardedFor);
    }

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const response = await fetch(target, {
        method: request.method,
        headers,
        body: hasBody ? request.body : undefined,
        redirect: 'manual',
        cache: 'no-store',
        // Required by Node to stream a request body, such as an upload.
        ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit);

    const answer = new Headers(response.headers);
    // fetch() has already decoded the body.
    answer.delete('content-encoding');
    answer.delete('content-length');
    answer.delete('set-cookie');

    for (const cookie of response.headers.getSetCookie()) {
        answer.append('set-cookie', cookie.replace(/;\s*domain=[^;]*/i, ''));
    }

    return new Response(response.body, { status: response.status, headers: answer });
}

export { forward as GET, forward as HEAD, forward as OPTIONS, forward as POST };
