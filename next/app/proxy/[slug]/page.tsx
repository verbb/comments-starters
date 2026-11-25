import { notFound } from 'next/navigation';

import { Comments } from '@/components/Comments';
import { PostNav } from '@/components/PostNav';
import { StarterPage } from '@/components/Starter';
import { StarterAside } from '@/components/StarterAside';
import { ownerUri, posts } from '@/lib/posts';
import { readSources } from '@/lib/sources';

type Props = { params: Promise<{ slug: string }> };

/**
 * The proxy variant: app/actions/comments/[...path]/route.ts forwards Comments' actions to Craft, so
 * the browser only ever talks to this origin and Craft's own session applies, with no member tokens.
 * That route's comment lists what a proxy has to do for this to work.
 */
export default async function ProxiedPost({ params }: Props) {
    const { slug } = await params;
    const post = posts.find((item) => item.slug === slug);

    if (!post) {
        notFound();
    }

    const code = await readSources('proxy');

    return (
        <StarterPage
            aside={
                <StarterAside code={code}>
                    The same thread through this app’s proxy, so Comments sees one origin and needs no tokens. Visitors comment as guests here, because this demo’s sign-in only covers member tokens.
                </StarterAside>
            }
        >
            <PostNav slug={slug} base="/proxy" />
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">{post.title}</h1>

            <div className="mt-8">
                <Comments uri={ownerUri(slug)} count={0} signedIn={false} endpoint="/actions/comments/api" />
            </div>
        </StarterPage>
    );
}
