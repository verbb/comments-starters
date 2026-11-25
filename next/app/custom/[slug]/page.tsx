import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CustomThread } from '@/components/CustomThread';
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

    return { title: post ? `${post.title} · Your own interface · Comments Next.js Starter` : 'Not found' };
}

/** The same thread, drawn with the app's own components on the hooks. */
export default async function CustomPost({ params }: Props) {
    const { slug } = await params;
    const post = posts.find((item) => item.slug === slug);

    if (!post) {
        notFound();
    }

    const [person, code] = await Promise.all([currentPerson(), readSources('custom')]);

    return (
        <StarterPage
            aside={
                <StarterAside code={code} events={false}>
                    The same thread drawn with the app’s own components, built on <code>useCommentsThread()</code> and <code>useCommentForm()</code>. Comments gives the state and actions, and none of its markup.
                </StarterAside>
            }
        >
            <PostNav slug={slug} base="/custom" />
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">{post.title}</h1>
            <CustomThread uri={ownerUri(slug)} signedIn={person !== null} />
        </StarterPage>
    );
}
