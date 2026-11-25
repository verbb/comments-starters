import { CommentsThread, type CommentsFieldOverrides, type CommentsPartOverrides } from '@verbb/comments-react';
import { useState } from 'react';

import { PostPicker } from '../components/PostPicker';
import { RatingDisplay, RatingInput } from '../components/Rating';
import { StarterAside, StarterPage } from '../components/Starter';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { defaultPostUri, posts } from '../posts';
import { sources } from '../sources';

// Overrides are defined once, outside the component, so React keeps the same components between
// renders rather than mounting new ones each time.
const parts: CommentsPartOverrides = { badge: VerifiedBadge };
const fields: CommentsFieldOverrides = { rating: { input: RatingInput, display: RatingDisplay } };

export function ThreadPage() {
    const [uri, setUri] = useState(defaultPostUri);
    const [events, setEvents] = useState<string[]>([]);
    const post = posts.find((item) => item.uri === uri) ?? posts[0];
    const log = (line: string) => setEvents((previous) => [line, ...previous].slice(0, 5));

    return (
        <StarterPage aside={<StarterAside about={about} code={{ title: 'The thread', files: sources.thread }} events={events} />}>
            <PostPicker uri={uri} onChange={setUri} />
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">{post.title}</h1>

            <div className="mt-8">
                {/* The key starts a fresh thread for each post. */}
                <CommentsThread
                    key={uri}
                    ownerUri={uri}
                    parts={parts}
                    fields={fields}
                    onCommentCreated={(event) => log(`Posted a comment (${event.detail.moderationState})`)}
                    onVoteChanged={(event) => log(event.detail.vote ? `Voted ${event.detail.vote}` : 'Took a vote back')}
                    onFollowChanged={(event) => log(event.detail.following ? 'Following the discussion' : 'Stopped following')}
                />
            </div>
        </StarterPage>
    );
}

const about = (
    <>
        <code>&lt;CommentsThread&gt;</code> draws the thread, with the app’s own component for the buyer badge and star ratings for the rating field. The app is on Craft’s own domain, so Craft’s session signs people in.
    </>
);
