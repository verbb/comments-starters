import { useCommentForm, useCommentsThread, type CommentData } from '@verbb/comments-react';
import { useState, type FormEvent } from 'react';

import { PostPicker } from '../components/PostPicker';
import { StarterAside, StarterPage } from '../components/Starter';
import { defaultPostUri, posts } from '../posts';
import { sources } from '../sources';

/**
 * A thread drawn entirely by the app. `useCommentsThread()` gives the thread's state and actions with
 * none of Comments' markup, and `useCommentForm()` posts from the app's own form, with the site's spam
 * protection mounted on it.
 */
export function CustomPage() {
    const [uri, setUri] = useState(defaultPostUri);

    const post = posts.find((item) => item.uri === uri) ?? posts[0];

    return (
        <StarterPage aside={<StarterAside about={about} code={{ title: 'Your own interface', files: sources.custom }} />}>
            <PostPicker uri={uri} onChange={setUri} />
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">{post.title}</h1>
            {/* A new key gives the new post a thread of its own. */}
            <Discussion key={uri} uri={uri} />
        </StarterPage>
    );
}

const about = (
    <>
        The same thread drawn with the app’s own components, built on <code>useCommentsThread()</code> and <code>useCommentForm()</code>. Comments gives the state and actions, and none of its markup.
    </>
);

function Discussion({ uri }: { uri: string }) {
    const thread = useCommentsThread({ ownerUri: uri });
    const { state } = thread;
    const viewer = state.viewer;

    if (state.status === 'error') {
        return <p role="alert" className="mt-8 text-red-700">{state.error?.message ?? 'The comments couldn’t load.'}</p>;
    }

    if (state.status !== 'ready') {
        return <p className="mt-8 text-slate-500">Loading comments…</p>;
    }

    return (
        <section className="mt-8" aria-labelledby="discussion-heading">
            <h2 id="discussion-heading" className="text-xl font-semibold">
                {state.conversation?.commentCount ?? 0} comments
            </h2>

            {viewer?.canComment ? (
                <CommentForm thread={thread} className="mt-6" />
            ) : (
                <p className="mt-6 text-slate-600">{state.conversation?.status === 'closed' ? (state.conversation.closedNotice ?? 'Comments are closed.') : 'Sign in to comment.'}</p>
            )}

            <ul className="mt-8 space-y-6">
                {thread.roots.map((comment) => (
                    <Comment key={comment.uid} comment={comment} thread={thread} />
                ))}
            </ul>

            {state.next ? (
                <button type="button" onClick={() => thread.loadMore()} disabled={state.loadingMore} className="mt-6 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100">
                    {state.loadingMore ? 'Loading…' : 'Load more'}
                </button>
            ) : null}
        </section>
    );
}

type Thread = ReturnType<typeof useCommentsThread>;

/**
 * The app's own form, for a new comment or a reply. Each form gets its own `useCommentForm()`, so
 * Protect is mounted on the form being written in and its errors stay with it.
 */
function CommentForm({ thread, parentUid, onDone, className = '' }: { thread: Thread; parentUid?: string; onDone?: () => void; className?: string }) {
    const form = useCommentForm({ thread, mode: parentUid ? 'reply' : 'create', parentUid });
    const viewer = thread.state.viewer;

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        const element = event.currentTarget;
        const response = await form.handleSubmit(event);

        // Null means it was refused, with the reasons in fieldErrors and error.
        if (response) {
            element.reset();
            onDone?.();
        }
    };

    return (
        <form ref={form.ref} onSubmit={submit} className={`space-y-3 rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>
            {viewer?.isGuest ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" name="guest[name]" errors={form.fieldErrors['guest.name']} />
                    <Field label="Email" name="guest[email]" type="email" errors={form.fieldErrors['guest.email']} />
                </div>
            ) : (
                <p className="text-sm text-slate-600">Posting as <strong>{viewer?.name}</strong></p>
            )}
            <label className="block">
                <span className="text-sm font-medium">{parentUid ? 'Reply' : 'Comment'}</span>
                <textarea name="content" rows={3} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            {form.fieldErrors.content?.map((message) => <p key={message} className="text-sm text-red-700">{message}</p>)}
            {form.error ? <p role="alert" className="text-sm text-red-700">{form.error}</p> : null}
            <div className="flex gap-2">
                <button disabled={form.posting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                    {form.posting ? 'Posting…' : parentUid ? 'Reply' : 'Post'}
                </button>
                {onDone && parentUid ? (
                    <button type="button" onClick={onDone} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                        Cancel
                    </button>
                ) : null}
            </div>
        </form>
    );
}

// Comments a reader doesn't see. The author sees their own while it waits, and moderators see them all.
const stateLabels: Partial<Record<CommentData['state'], string>> = {
    pending: 'Waiting for approval',
    held: 'Held for review',
    reported: 'Reported',
    spam: 'Spam',
    removed: 'Removed',
};

// The author's `avatarTone` picks one of a few colours, so a person keeps theirs across the thread.
const tones = ['bg-teal-700', 'bg-indigo-700', 'bg-rose-700', 'bg-amber-700', 'bg-sky-700', 'bg-violet-700'];

function Comment({ comment, thread }: { comment: CommentData; thread: Thread }) {
    const [replying, setReplying] = useState(false);
    const permissions = thread.state.permissions[comment.uid];
    const vote = permissions?.vote ?? null;
    const busy = Boolean(thread.state.busy[`vote:${comment.uid}`]);
    const replies = thread.replies(comment.uid);
    const author = comment.author;
    const voteButton = 'inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-sm text-slate-600 hover:border-slate-300 aria-pressed:border-indigo-300 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-900 disabled:opacity-50';

    return (
        <li className="flex gap-3">
            {author?.avatarUrl ? (
                <img src={author.avatarUrl} alt="" className="size-9 shrink-0 rounded-full" />
            ) : (
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${tones[(author?.avatarTone ?? 0) % tones.length]}`}>{author?.initials}</span>
            )}

            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm">
                    <strong>{author?.name}</strong>
                    {author?.badges.map((badge) => <span key={badge.type} className="rounded-full bg-slate-100 px-2 text-xs text-slate-700">{badge.label}</span>)}
                    <span className="text-slate-500">{comment.display?.timeAgo}</span>
                    {stateLabels[comment.state] ? <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-800">{stateLabels[comment.state]}</span> : null}
                </p>
                <p className="mt-1 whitespace-pre-line">{comment.content?.text}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {comment.interaction ? (
                        <>
                            <button type="button" aria-label="Upvote" aria-pressed={vote === 'upvote'} disabled={busy || !permissions?.canVote} onClick={() => thread.vote(comment.uid, vote === 'upvote' ? null : 'upvote')} className={voteButton}>
                                ▲ {comment.interaction.upvotes}
                            </button>
                            {permissions?.canDownvote ? (
                                <button type="button" aria-label="Downvote" aria-pressed={vote === 'downvote'} disabled={busy} onClick={() => thread.vote(comment.uid, vote === 'downvote' ? null : 'downvote')} className={voteButton}>
                                    ▼ {comment.interaction.downvotes}
                                </button>
                            ) : null}
                        </>
                    ) : null}
                    {permissions?.canReply ? (
                        <button type="button" aria-expanded={replying} onClick={() => setReplying(!replying)} className="px-1 text-sm text-slate-600 hover:text-slate-900">
                            Reply
                        </button>
                    ) : null}
                    {comment.replies.count > 0 && replies.length === 0 ? (
                        <button type="button" onClick={() => thread.loadReplies(comment.uid)} className="px-1 text-sm text-indigo-700 hover:underline">
                            Show {comment.replies.count} {comment.replies.count === 1 ? 'reply' : 'replies'}
                        </button>
                    ) : null}
                </div>

                {replying ? <CommentForm thread={thread} parentUid={comment.uid} onDone={() => setReplying(false)} className="mt-4" /> : null}

                {replies.length ? (
                    <ul className="mt-4 space-y-4 border-l border-slate-200 pl-5">
                        {replies.map((reply) => <Comment key={reply.uid} comment={reply} thread={thread} />)}
                    </ul>
                ) : null}
            </div>
        </li>
    );
}

function Field({ label, name, type = 'text', errors }: { label: string; name: string; type?: string; errors?: string[] }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input name={name} type={type} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" aria-invalid={errors?.length ? 'true' : undefined} />
            {errors?.map((message) => <span key={message} className="mt-1 block text-sm text-red-700">{message}</span>)}
        </label>
    );
}
