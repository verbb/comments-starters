/*
 * The chrome every starter shares, around the examples in main.ts and custom.ts: the home link, the
 * theme toggle, the events the thread sends, and the aside's code drawer. None of it is needed to
 * use Comments.
 */

// The files behind each page, as Vite reads them. Imported with `?raw`, so the drawer shows the
// starter's own source rather than a copy that could drift from it.
import customPage from '../custom.html?raw';
import page from '../index.html?raw';
import custom from './custom.ts?raw';
import main from './main.ts?raw';
import postList from './posts.ts?raw';
import style from './style.css?raw';

const files = document.body.dataset.page === 'custom'
    ? [
        { path: 'web/src/custom.ts', source: custom },
        { path: 'web/custom.html', source: customPage },
        { path: 'web/src/posts.ts', source: postList },
        { path: 'web/src/style.css', source: style },
    ]
    : [
        { path: 'web/src/main.ts', source: main },
        { path: 'web/index.html', source: page },
        { path: 'web/src/posts.ts', source: postList },
        { path: 'web/src/style.css', source: style },
    ];

// Where the repository's files are browsed. Each file links to its own page there.
const repository = 'https://github.com/verbb/comments-starters/blob/main';

// The starters' home page on the Craft site, which the header links to. Served from the Craft site
// itself, as the hosted build is, it's this site's own home page.
document.querySelector<HTMLAnchorElement>('#starters-home')!.href = import.meta.env.VITE_STARTERS_URL || '/';

// The site's own dark-mode toggle. Comments notices the class change on <html> by itself.
const toggle = document.getElementById('theme-toggle')!;
const syncToggle = () => toggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('dark')));

toggle.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');

    try {
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
        // Storage can be unavailable, such as in a private window. The toggle still works.
    }

    syncToggle();
});
syncToggle();

// What the thread tells the page, listed in the thread page's aside. Comments' events bubble up from
// the element.
const eventList = document.getElementById('events');
const describe: Record<string, (detail: Record<string, unknown>) => string> = {
    'comments:comment-created': (detail) => `Posted a comment (${detail.moderationState})`,
    'comments:vote-changed': (detail) => (detail.vote ? `Voted ${detail.vote}` : 'Took a vote back'),
    'comments:follow-changed': (detail) => (detail.following ? 'Following the discussion' : 'Stopped following'),
};

for (const [name, line] of Object.entries(describe)) {
    if (!eventList) break;

    document.addEventListener(name, (event) => {
        eventList.querySelector('[data-empty]')?.remove();
        const item = document.createElement('li');
        item.textContent = line((event as CustomEvent<Record<string, unknown>>).detail);
        eventList.prepend(item);

        // Keep the last five.
        while (eventList.children.length > 5) {
            eventList.lastElementChild!.remove();
        }
    });
}

// The code drawer, a native <dialog>, which gives the focus trap, Escape to close and the backdrop.
const dialog = document.querySelector<HTMLDialogElement>('#code-drawer')!;
const fileList = dialog.querySelector<HTMLElement>('[data-files]')!;
const filePath = dialog.querySelector<HTMLElement>('[data-path]')!;
const fileLink = dialog.querySelector<HTMLAnchorElement>('[data-github]')!;
const fileSource = dialog.querySelector<HTMLElement>('[data-source]')!;
const copyButton = dialog.querySelector<HTMLButtonElement>('[data-copy]')!;
let current = files[0];

// Shiki colours the code. It's loaded the first time the drawer shows a file, so the page itself
// stays small, and the plain source shows until it's ready.
const languages: Record<string, string> = { ts: 'typescript', html: 'html', css: 'css' };
let shiki: Promise<typeof import('shiki')> | null = null;

async function highlight(file: { path: string; source: string }): Promise<string> {
    const { codeToHtml } = await (shiki ??= import('shiki'));

    return codeToHtml(file.source, { lang: languages[file.path.split('.').pop() ?? ''] ?? 'text', theme: 'github-dark', structure: 'inline' });
}

function showFile(index: number): void {
    current = files[index] ?? files[0];
    filePath.textContent = current.path;
    fileLink.href = `${repository}/${current.path}`;
    fileSource.textContent = current.source;

    const shown = current;
    highlight(shown).then((html) => {
        // The visitor may have picked another file meanwhile. Shiki escapes the source it colours.
        if (current === shown) fileSource.innerHTML = html;
    }).catch(() => undefined);
    fileList.querySelectorAll('button').forEach((button, position) => {
        button.setAttribute('aria-current', position === index ? 'true' : 'false');
    });
}

files.forEach((file, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'starter-file';
    // The path inside the starter, which tells index.html from main.ts at a glance.
    button.textContent = file.path.split('/').slice(1).join('/');
    button.addEventListener('click', () => showFile(index));
    fileList.append(button);
});
showFile(0);

document.querySelector('#code-open')!.addEventListener('click', () => dialog.showModal());
dialog.querySelector('[data-close]')!.addEventListener('click', () => dialog.close());

// A click on the backdrop lands on the dialog itself, outside its panel.
dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
        dialog.close();
    }
});

copyButton.addEventListener('click', async () => {
    await navigator.clipboard.writeText(current.source);
    copyButton.textContent = 'Copied';
    window.setTimeout(() => {
        copyButton.textContent = 'Copy';
    }, 1500);
});
