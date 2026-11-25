import { configure } from '@verbb/comments-browser';
import { cookieSession, guestSession } from '@verbb/comments-core';
import { registerCommentsWebComponents } from '@verbb/comments-web-components';

import './style.css';
// The starters' own chrome around the example: the code drawer, the events list, the theme toggle
// and the home link.
import './starter';
import { posts } from './posts';

// Every thread follows the site's own dark mode, the `dark` class the header's toggle keeps on
// <html>, switching as it changes. Given before the element starts, so the thread draws in the right
// theme.
configure({ darkSelector: 'html.dark' });
registerCommentsWebComponents();

const thread = document.querySelector('verbb-comments')!;

const endpoint = new URL(import.meta.env.VITE_COMMENTS_ENDPOINT || '/actions/comments/api', window.location.href);

// On another origin from Craft, the browser won't send Craft's cookies, so visitors comment as guests
// with a guest session token (sign-in tier 3), kept in sessionStorage so a guest's own pending comment
// and votes stay with them across reloads in this tab. Served from the Craft site itself, as the
// hosted build is, Craft's own session applies instead (tier 1).
thread.auth = endpoint.origin === window.location.origin ? cookieSession() : guestSession({ storage: sessionStorage });
thread.endpoint = endpoint.href;

// Tailwind classes for the controls the site's design system already styles, in place of Comments'
// own. Everything else is styled through the stable `comments__*` class names in style.css.
const button = { resetClass: true, attributes: { class: 'btn' } };
thread.themeConfig = {
    primaryButton: { ...button, attributes: { class: 'btn btn-primary' } },
    secondaryButton: { ...button, attributes: { class: 'btn btn-secondary' } },
    input: { resetClass: true, attributes: { class: 'field' } },
    textarea: { resetClass: true, attributes: { class: 'field' } },
};

function showPost(uri: string): void {
    const post = posts.find((item) => item.uri === uri) ?? posts[0];

    document.getElementById('post-title')!.textContent = post.title;
    document.querySelectorAll<HTMLButtonElement>('#posts button').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.uri === post.uri));
    });
    // A new owner draws the new post's thread in place of the old one.
    thread.ownerUri = post.uri;
}

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
