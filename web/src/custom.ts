import { commentForm, type CommentForm } from '@verbb/comments-browser/form';
import {
    cookieSession,
    createCommentsClient,
    createThreadStore,
    guestSession,
    selectReplies,
    selectRoots,
    type CommentData,
    type ThreadState,
    type ThreadStore,
} from '@verbb/comments-core';

import './style.css';
// The starters' own chrome around the example: the code drawer, the theme toggle and the home link.
import './starter';
import { posts } from './posts';

/*
 * A thread drawn entirely by the page, with no framework. Core's thread store gives the thread's
 * state and actions with none of Comments' markup, and `commentForm()` posts from the page's own
 * forms, with the site's spam protection mounted on them.
 */

const endpoint = new URL(import.meta.env.VITE_COMMENTS_ENDPOINT || '/actions/comments/api', window.location.href);

// The same sign-in as the thread page: a guest session on another origin, Craft's own session on its own.
const client = createCommentsClient({
    endpoint: endpoint.href,
    auth: endpoint.origin === window.location.origin ? cookieSession() : guestSession({ storage: sessionStorage }),
});

const root = document.getElementById('discussion')!;
let discussion: { destroy(): void } | null = null;

function showPost(uri: string): void {
    const post = posts.find((item) => item.uri === uri) ?? posts[0];

    document.getElementById('post-title')!.textContent = post.title;
    document.querySelectorAll<HTMLButtonElement>('#posts button').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.uri === post.uri));
    });

    // A new post gets a thread of its own.
    discussion?.destroy();
    discussion = drawDiscussion(createThreadStore(client, { ownerUri: post.uri }));
}

/**
 * Draws one thread into the page and keeps it drawn as its state changes. Each comment's element is
 * kept from one draw to the next, so a reply being written, and wherever focus is, survive a vote or
 * a new comment arriving.
 */
function drawDiscussion(store: ThreadStore): { destroy(): void } {
    const heading = h('h2', { id: 'discussion-heading', class: 'text-xl font-semibold' });
    const intro = h('div', { class: 'mt-6' });
    const list = h('ul', { class: 'mt-8 space-y-6' });
    const more = h('button', { type: 'button', class: 'btn btn-secondary mt-6', 'data-key': 'more' }, 'Load more');
    const comments = new Map<string, CommentView>();
    const replyForms = new Map<string, OwnForm>();
    let mainForm: OwnForm | null = null;
    let introKey = '';
    // A control that had focus when it was drawn again, kept until it can take focus back.
    let lostFocus: string | undefined;

    more.addEventListener('click', () => store.loadMore().catch(() => undefined));
    root.replaceChildren(h('p', { class: 'mt-8 text-slate-500 dark:text-slate-400' }, 'Loading comments…'));

    const draw = (state: ThreadState) => {
        if (state.status === 'error') {
            root.replaceChildren(h('p', { role: 'alert', class: 'mt-8 text-red-700 dark:text-red-400' }, state.error?.message ?? 'The comments couldn’t load.'));
            return;
        }

        if (state.status !== 'ready') return;

        // Drawing replaces a comment's buttons, so focus goes back to the one with the same key. A vote
        // button is disabled while its vote saves, so it takes focus back on the draw after.
        const active = document.activeElement as HTMLElement | null;
        const focused = active?.closest<HTMLElement>('[data-key]')?.dataset.key ?? (active === document.body ? lostFocus : undefined);

        if (!root.contains(heading)) root.replaceChildren(h('section', { class: 'mt-8', 'aria-labelledby': 'discussion-heading' }, heading, intro, list, more));

        heading.textContent = `${state.conversation?.commentCount ?? 0} comments`;
        drawIntro(state);
        keepInOrder(list, selectRoots(state).map((comment) => drawComment(comment, state)));
        more.hidden = !state.next;
        more.disabled = state.loadingMore;
        more.textContent = state.loadingMore ? 'Loading…' : 'Load more';

        if (focused && document.activeElement === document.body) {
            const target = root.querySelector<HTMLElement>(`[data-key="${focused}"]`);
            target?.focus();
            lostFocus = target && document.activeElement !== target ? focused : undefined;
        }
    };

    // The form for a new comment, or why there isn't one. Made again only when who's reading changes.
    const drawIntro = (state: ThreadState) => {
        const viewer = state.viewer;
        const closed = state.conversation?.status === 'closed';
        const key = JSON.stringify([viewer?.canComment, viewer?.isGuest, viewer?.name, closed]);

        if (key === introKey) return;

        introKey = key;
        mainForm?.destroy();
        mainForm = null;

        if (viewer?.canComment) {
            mainForm = ownForm(store, state);
            intro.replaceChildren(mainForm.element);
        } else {
            intro.replaceChildren(h('p', { class: 'text-slate-600 dark:text-slate-400' }, closed ? state.conversation?.closedNotice ?? 'Comments are closed.' : 'Sign in to comment.'));
        }
    };

    const drawComment = (comment: CommentData, state: ThreadState): HTMLElement => {
        const uid = comment.uid;
        let view = comments.get(uid);

        if (!view) {
            view = { item: h('li', { class: 'flex gap-3' }), body: h('div'), formSlot: h('div'), replies: h('ul', { class: 'mt-4 space-y-4 border-l border-slate-200 pl-5 dark:border-slate-800' }) };
            view.item.append(avatar(comment), h('div', { class: 'min-w-0 flex-1' }, view.body, view.formSlot, view.replies));
            comments.set(uid, view);
        }

        const permissions = state.permissions[uid];
        const vote = permissions?.vote ?? null;
        const busy = Boolean(state.busy[`vote:${uid}`]);
        const replies = selectReplies(state, uid);
        const author = comment.author;
        const voteClass = 'inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-sm text-slate-600 hover:border-slate-300 aria-pressed:border-indigo-300 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-900 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:aria-pressed:border-indigo-700 dark:aria-pressed:bg-indigo-950 dark:aria-pressed:text-indigo-100';
        const voteFor = (value: 'upvote' | 'downvote') => () => store.vote(uid, vote === value ? null : value).catch(() => undefined);

        view.body.replaceChildren(
            h('p', { class: 'flex flex-wrap items-center gap-x-2 text-sm' },
                h('strong', {}, author?.name ?? ''),
                ...(author?.badges ?? []).map((badge) => h('span', { class: 'rounded-full bg-slate-100 px-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300' }, badge.label)),
                h('span', { class: 'text-slate-500 dark:text-slate-400' }, comment.display?.timeAgo ?? ''),
                stateLabels[comment.state] ? h('span', { class: 'rounded bg-amber-100 px-1.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200' }, stateLabels[comment.state]!) : null,
            ),
            h('p', { class: 'mt-1 whitespace-pre-line' }, comment.content?.text ?? ''),
            h('div', { class: 'mt-2 flex flex-wrap items-center gap-2' },
                comment.interaction
                    ? h('button', { type: 'button', class: voteClass, 'data-key': `up-${uid}`, 'aria-label': 'Upvote', 'aria-pressed': String(vote === 'upvote'), disabled: busy || !permissions?.canVote, onclick: voteFor('upvote') }, `▲ ${comment.interaction.upvotes}`)
                    : null,
                comment.interaction && permissions?.canDownvote
                    ? h('button', { type: 'button', class: voteClass, 'data-key': `down-${uid}`, 'aria-label': 'Downvote', 'aria-pressed': String(vote === 'downvote'), disabled: busy, onclick: voteFor('downvote') }, `▼ ${comment.interaction.downvotes}`)
                    : null,
                permissions?.canReply
                    ? h('button', { type: 'button', class: 'px-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100', 'data-key': `reply-${uid}`, 'aria-expanded': String(replyForms.has(uid)), onclick: () => toggleReply(uid) }, 'Reply')
                    : null,
                comment.replies.count > 0 && replies.length === 0
                    ? h('button', { type: 'button', class: 'px-1 text-sm text-indigo-700 hover:underline dark:text-indigo-300', 'data-key': `replies-${uid}`, onclick: () => store.loadReplies(uid).catch(() => undefined) }, `Show ${comment.replies.count} ${comment.replies.count === 1 ? 'reply' : 'replies'}`)
                    : null,
            ),
        );

        view.replies.hidden = replies.length === 0;
        keepInOrder(view.replies, replies.map((reply) => drawComment(reply, state)));

        return view.item;
    };

    // Each reply gets a form of its own, so the spam protection is mounted on the one being written in.
    const toggleReply = (uid: string) => {
        const open = replyForms.get(uid);
        const view = comments.get(uid)!;

        if (open) {
            open.destroy();
            replyForms.delete(uid);
            view.formSlot.replaceChildren();
        } else {
            const form = ownForm(store, store.getState(), uid, () => toggleReply(uid));
            form.element.classList.add('mt-4');
            replyForms.set(uid, form);
            view.formSlot.replaceChildren(form.element);
            form.element.querySelector('textarea')?.focus();
        }

        view.body.querySelector('[data-key^="reply-"]')?.setAttribute('aria-expanded', String(replyForms.has(uid)));
    };

    const stop = store.subscribe(draw);
    store.load().catch(() => undefined);

    return {
        destroy() {
            stop();
            mainForm?.destroy();
            replyForms.forEach((form) => form.destroy());
            store.destroy();
        },
    };
}

type CommentView = { item: HTMLElement; body: HTMLElement; formSlot: HTMLElement; replies: HTMLElement };
type OwnForm = { element: HTMLFormElement; destroy(): void };

/**
 * The page's own form, for a new comment or a reply. `commentForm()` reads its `content` and
 * `guest[…]` fields, mounts the spam protection when someone starts writing, and gives the
 * server's messages for each field.
 */
function ownForm(store: ThreadStore, state: ThreadState, parentUid?: string, onDone?: () => void): OwnForm {
    const viewer = state.viewer;
    const label = parentUid ? 'Reply' : 'Post';
    const submit = h('button', { class: 'btn btn-primary' }, label);
    const alert = h('p', { role: 'alert', class: 'text-sm text-red-700 empty:hidden dark:text-red-400' });

    const element = h('form', { class: 'space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900' },
        viewer?.isGuest
            ? h('div', { class: 'grid gap-3 sm:grid-cols-2' }, field('Name', 'guest[name]', 'guest.name'), field('Email', 'guest[email]', 'guest.email', 'email'))
            : h('p', { class: 'text-sm text-slate-600 dark:text-slate-400' }, 'Posting as ', h('strong', {}, viewer?.name ?? '')),
        h('label', { class: 'block' },
            h('span', { class: 'text-sm font-medium' }, parentUid ? 'Reply' : 'Comment'),
            h('textarea', { name: 'content', rows: '3', class: 'field mt-1' }),
            h('span', { class: 'mt-1 block text-sm text-red-700 empty:hidden dark:text-red-400', 'data-errors': 'content' }),
        ),
        alert,
        h('div', { class: 'flex gap-2' },
            submit,
            onDone ? h('button', { type: 'button', class: 'btn btn-secondary', onclick: onDone }, 'Cancel') : null,
        ),
    );

    const form: CommentForm = commentForm(element, store, parentUid ? { mode: 'reply', parentUid } : {});

    // The form's state: the server's messages by field, one for the whole form, and whether it's posting.
    form.subscribe(({ fieldErrors, error, posting }) => {
        element.querySelectorAll<HTMLElement>('[data-errors]').forEach((slot) => {
            const messages = fieldErrors[slot.dataset.errors!] ?? [];
            slot.textContent = messages.join(' ');
            slot.closest('label')?.querySelector('input, textarea')?.setAttribute('aria-invalid', String(messages.length > 0));
        });
        alert.textContent = error ?? '';
        submit.disabled = posting;
        submit.textContent = posting ? 'Posting…' : label;
    });

    element.addEventListener('submit', async (event) => {
        // Null means it was refused, with the reasons in the state above.
        if (await form.handleSubmit(event)) onDone?.();
    });

    return { element, destroy: () => form.destroy() };
}

function field(label: string, name: string, errorKey: string, type = 'text'): HTMLElement {
    return h('label', { class: 'block' },
        h('span', { class: 'text-sm font-medium' }, label),
        h('input', { name, type, class: 'field mt-1' }),
        h('span', { class: 'mt-1 block text-sm text-red-700 empty:hidden dark:text-red-400', 'data-errors': errorKey }),
    );
}

// The author's `avatarTone` picks one of a few colours, so a person keeps theirs across the thread.
const tones = ['bg-teal-700', 'bg-indigo-700', 'bg-rose-700', 'bg-amber-700', 'bg-sky-700', 'bg-violet-700'];

function avatar(comment: CommentData): HTMLElement {
    const author = comment.author;

    return author?.avatarUrl
        ? h('img', { src: author.avatarUrl, alt: '', class: 'size-9 shrink-0 rounded-full' })
        : h('span', { class: `flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${tones[(author?.avatarTone ?? 0) % tones.length]}` }, author?.initials ?? '');
}

// Comments a reader doesn't see. The author sees their own while it waits, and moderators see them all.
const stateLabels: Partial<Record<CommentData['state'], string>> = {
    pending: 'Waiting for approval',
    held: 'Held for review',
    reported: 'Reported',
    spam: 'Spam',
    removed: 'Removed',
};

/** Puts `nodes` in `parent` in this order, moving only what's out of place, so focus inside stays put. */
function keepInOrder(parent: HTMLElement, nodes: HTMLElement[]): void {
    nodes.forEach((node, index) => {
        if (parent.children[index] !== node) parent.insertBefore(node, parent.children[index] ?? null);
    });

    while (parent.children.length > nodes.length) parent.lastElementChild!.remove();
}

/** A small element builder: attributes, `on…` listeners, and children as elements or text. */
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: Record<string, unknown> = {}, ...children: Array<Node | string | null>): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    for (const [name, value] of Object.entries(attributes)) {
        if (name.startsWith('on') && typeof value === 'function') element.addEventListener(name.slice(2), value as EventListener);
        else if (value === true) element.setAttribute(name, '');
        else if (value !== false && value != null) element.setAttribute(name, String(value));
    }

    element.append(...children.filter((child): child is Node | string => child !== null));

    return element;
}

// The post picker, as on the thread page.
const picker = document.getElementById('posts')!;

for (const post of posts) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'starter-pill';
    item.dataset.uri = post.uri;
    item.textContent = post.title;
    item.addEventListener('click', () => showPost(post.uri));
    picker.append(item);
}

showPost(import.meta.env.VITE_COMMENTS_ENTRY_URI || posts[0].uri);
