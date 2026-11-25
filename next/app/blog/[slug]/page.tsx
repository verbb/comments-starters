import { fetchCommentsCount, fetchStructuredData, jsonLdScript } from '@verbb/comments-react/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Comments } from '@/components/Comments';
import { PostNav } from '@/components/PostNav';
import { StarterPage } from '@/components/Starter';
import { StarterAside } from '@/components/StarterAside';
import { ownerUri, posts } from '@/lib/posts';
import { readSources } from '@/lib/sources';
import { currentPerson } from '@/lib/session';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = posts.find((item) => item.slug === slug);

    return { title: post ? `${post.title} · Comments Next.js Starter` : 'Not found' };
}

export default async function Post({ params }: Props) {
    const { slug } = await params;
    const post = posts.find((item) => item.slug === slug);

    if (!post) {
        notFound();
    }

    const uri = ownerUri(slug);
    const endpoint = process.env.COMMENTS_SERVER_URL ?? 'https://comments-starters.ddev.site/actions/comments/api';
    // Rendered on the server: the count, so the heading doesn't jump when the thread loads, and the
    // structured data for search engines. Both are public reads Craft caches. Either failing leaves
    // the page without it rather than breaking it.
    const [count, structuredData, person, code] = await Promise.all([
        fetchCommentsCount({ endpoint, ownerUri: uri }).catch(() => 0),
        fetchStructuredData({ endpoint, ownerUri: uri }).catch(() => null),
        currentPerson(),
        readSources('blog'),
    ]);

    return (
        <StarterPage
            aside={
                <StarterAside code={code}>
                    This app is on another site from Craft. Members are signed in to Comments with short-lived member tokens from this app’s server, and guests with a guest session. Moderating through a member token is off unless the Craft site allows it for this origin, so Sam sees the thread as a member does here.
                </StarterAside>
            }
        >
            {/* jsonLdScript() escapes <, > and &, so a comment containing </script> can't end the script. */}
            {structuredData ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }} /> : null}

            <PostNav slug={slug} />
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">{post.title}</h1>

            <div className="mt-8">
                <Comments uri={uri} count={count} signedIn={person !== null} />
            </div>
        </StarterPage>
    );
}
