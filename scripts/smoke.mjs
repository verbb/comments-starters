/**
 * A smoke test of every starter in a real browser, run against the Craft site and the starters' dev
 * or preview servers (`npm run dev` here, with the Craft site seeded by craft/scripts/install.sh).
 * It reads threads, signs in and out, and casts one guest vote per starter that it takes straight
 * back, so every starter's write path is exercised and the seeded comments stay as they are.
 *
 *     npm run smoke
 *     npm run smoke -- --only=craft,react
 *
 * Each starter's address can be changed with SMOKE_<NAME>_URL, such as SMOKE_NEXT_URL, to check a
 * hosted deployment instead. Install a browser first with `npx playwright install chromium`.
 */
import { chromium } from 'playwright';

const urls = {
    craft: process.env.SMOKE_CRAFT_URL ?? 'https://comments-starters.ddev.site',
    react: process.env.SMOKE_REACT_URL ?? 'http://localhost:5273',
    vue: process.env.SMOKE_VUE_URL ?? 'http://localhost:5274',
    web: process.env.SMOKE_WEB_URL ?? 'http://localhost:5275',
    next: process.env.SMOKE_NEXT_URL ?? 'http://localhost:3101',
    nuxt: process.env.SMOKE_NUXT_URL ?? 'https://nuxt.comments-starters.ddev.site:3102',
};
const only = process.argv.find((argument) => argument.startsWith('--only='))?.slice(7).split(',');
const post = 'welcome-to-the-comments-starters';
// The seeded welcome post: 9 comments a guest can see, two by a verified buyer, three with ratings.
const seeded = { comments: 9, verified: 2, ratings: 3 };

const browser = await chromium.launch();
const failures = [];

async function check(name, run) {
    if (only && !only.includes(name)) return;

    // A fresh context per starter, so one's sign-in never leaks into another's.
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });

    const expect = (label, actual, expected) => {
        const ok = typeof expected === 'function' ? expected(actual) : actual === expected;
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${label} (${JSON.stringify(actual)})`);
        if (!ok) failures.push(`${name}: ${label}`);
    };

    try {
        await run(page, expect);
        expect('no page or console errors', errors, (list) => list.length === 0);
    } catch (error) {
        console.log(`FAIL ${name}: ${error.message.split('\n')[0]}`);
        failures.push(`${name}: ${error.message.split('\n')[0]}`);
    } finally {
        await context.close();
    }
}

const count = (page, selector) => page.locator(selector).count();
const drawn = (page, minimum = seeded.comments) => page.waitForFunction((min) => document.querySelectorAll('.comments__comment').length >= min, minimum, { timeout: 30000 });

// The thread's root element, marked, so a page swap that keeps the drawn thread can be told from one
// that draws it again.
const mark = (page) => page.evaluate(() => { document.querySelector('[data-comments-root]').dataset.smoke = 'kept'; });
const kept = (page) => page.evaluate(() => document.querySelector('[data-comments-root]')?.dataset.smoke === 'kept');

// Runs a click and waits for the request it should cause, so a swap check fails if nothing happened.
// URLs are decoded first, since Craft's own pages send actions as `?p=actions%2F…`.
async function clickAndWait(page, locator, urlPart) {
    await Promise.all([page.waitForResponse((response) => decodeURIComponent(response.url()).includes(urlPart), { timeout: 15000 }), locator.click()]);
}

/**
 * A guest's vote on the first comment, then the same vote taken back, through whatever sign-in the
 * starter uses. It proves Craft accepts the starter's writes (origin, CSRF, guest session) and leaves
 * the count as it was.
 */
async function voteRoundTrip(page, expect) {
    const comment = page.locator('.comments__comment').first();
    const button = comment.locator('.comments__vote--up').first();
    // A score in up and down mode, a count in likes mode, each with words for screen readers.
    const score = async () => Number((await comment.locator('.comments__score, .comments__vote-count').first().textContent()).replace(/[^\d-]/g, ''));
    const settle = async (expected) => {
        for (let i = 0; i < 40 && (await score()) !== expected; i++) await page.waitForTimeout(250);
    };
    const before = await score();

    await clickAndWait(page, button, '/comments/api/vote');
    await settle(before + 1);
    expect('a guest’s vote reaches Craft', await score(), before + 1);

    await clickAndWait(page, button, '/comments/api/vote');
    await settle(before);
    expect('and can be taken back', await score(), before);
}

/**
 * Signs in as Sam, the seeded moderator, with a starter's own sign-in button. Sam only signs in
 * locally, so against a hosted demo there's no button, and the moderator checks are skipped.
 */
async function signInAsModerator(page, name) {
    const button = page.getByRole('button', { name: 'Sam, a moderator' });

    if (!(await button.count())) {
        console.log(`skip ${name}: the moderator only signs in locally`);
        return false;
    }

    await button.click();
    return true;
}

async function moderatorView(page, expect) {
    await page.waitForFunction(() => document.querySelector('.comments__moderator-bar'), null, { timeout: 30000 });
    expect('moderator sees the held comment', await count(page, '.comments__comment--held, .comments__comment--pending'), (n) => n >= 1);
    expect('moderator sees the reported comment', await count(page, '.comments__comment--reported'), 1);
}

await check('craft', async (page, expect) => {
    await page.goto(`${urls.craft}/blog/${post}`);
    await drawn(page);
    expect('default thread draws', await count(page, '.comments__comment'), seeded.comments);
    expect('verified buyer badges', await count(page, '.comments__badge--verified'), seeded.verified);
    await voteRoundTrip(page, expect);

    if (await signInAsModerator(page, 'craft')) {
        await moderatorView(page, expect);
        await page.getByRole('button', { name: 'Sign out' }).click();
        await page.getByText('Reading as a guest').waitFor({ timeout: 15000 });
    }

    await page.goto(`${urls.craft}/sprig`);
    await drawn(page);
    await mark(page);
    await clickAndWait(page, page.getByRole('button', { name: 'Reload this post' }), 'sprig');
    await page.waitForTimeout(1000);
    expect('Sprig keeps the thread when the same post reloads', await kept(page), true);
    await clickAndWait(page, page.getByRole('button', { name: 'Long thread' }), 'sprig');
    await drawn(page, 20);
    expect('Sprig swaps in another post’s thread', await kept(page), false);

    await page.goto(`${urls.craft}/turbo/${post}`);
    await drawn(page);
    await mark(page);
    await clickAndWait(page, page.getByRole('button', { name: 'Refresh with morph' }), `/turbo/${post}`);
    await page.waitForTimeout(1500);
    expect('Turbo’s morph refresh keeps the thread', await kept(page), true);
    // Without data-turbo-permanent, the morph puts the empty mount point back, and Comments draws the
    // thread again rather than leaving it blank.
    await page.evaluate(() => document.querySelector('[data-turbo-permanent]')?.removeAttribute('data-turbo-permanent'));
    await clickAndWait(page, page.getByRole('button', { name: 'Refresh with morph' }), `/turbo/${post}`);
    await page.waitForTimeout(2500);
    expect('Turbo’s morph without data-turbo-permanent draws the thread again', await count(page, '.comments__comment'), seeded.comments);
    await page.getByRole('link', { name: 'Long thread' }).click();
    await drawn(page, 20);
    await page.goBack();
    await page.waitForURL(`**/turbo/${post}`);
    await drawn(page);
    // Turbo shows its cached copy first, then the fresh page, so let it settle.
    await page.waitForTimeout(1500);
    expect('Turbo draws the thread again after going back', await count(page, '.comments__comment'), seeded.comments);

    await page.goto(`${urls.craft}/datastar`);
    await drawn(page);
    await mark(page);
    await clickAndWait(page, page.getByRole('button', { name: 'Refresh from the server' }), 'datastar');
    await page.waitForTimeout(1500);
    expect('Datastar’s patch keeps the thread', await kept(page), true);
    await clickAndWait(page, page.getByRole('button', { name: 'Long thread' }), 'datastar');
    await drawn(page, 20);
    expect('Datastar swaps in another post’s thread', await kept(page), false);
});

for (const name of ['react', 'vue']) {
    await check(name, async (page, expect) => {
        await page.goto(`${urls[name]}/`);
        await drawn(page);
        expect('thread draws', await count(page, '.comments__comment'), seeded.comments);
        expect('Verified buyer badges drawn by the app', await page.getByText('Verified buyer').count(), seeded.verified);
        expect('ratings drawn as stars', await count(page, '[aria-label^="Rated"]'), seeded.ratings);
        await voteRoundTrip(page, expect);

        if (await signInAsModerator(page, name)) {
            await page.getByText('Signed in as').waitFor({ timeout: 15000 });
            await moderatorView(page, expect);
            await page.getByRole('button', { name: 'Sign out' }).click();
            await page.getByText('Reading as a guest').waitFor({ timeout: 15000 });
        }

        await page.goto(`${urls[name]}/custom`);
        await page.locator('#discussion-heading').waitFor({ timeout: 30000 });
        expect('your own interface lists the thread', (await page.locator('#discussion-heading').innerText()).trim(), `${seeded.comments} comments`);
    });
}

await check('web', async (page, expect) => {
    await page.goto(`${urls.web}/`);
    await drawn(page);
    expect('thread draws on another origin', await count(page, '.comments__comment'), seeded.comments);
    // A guest's form, with its primary button, is drawn once they choose Comment as a guest.
    await page.locator('verbb-comments .comments__join-guest summary').click();
    await page.locator('verbb-comments .btn-primary').first().waitFor({ timeout: 10000 });
    expect('themeConfig puts the site’s button classes on Comments’ controls', await count(page, 'verbb-comments .btn-primary, verbb-comments .btn-secondary'), (n) => n >= 2);
    await voteRoundTrip(page, expect);

    const theme = () => page.locator('verbb-comments[data-comments-theme], verbb-comments [data-comments-theme]').first().getAttribute('data-comments-theme');
    const before = await theme();
    await page.getByRole('button', { name: 'Dark mode' }).click();
    await page.waitForTimeout(300);
    expect('the site’s dark mode toggle switches the thread', [before, await theme()], ([from, to]) => from !== to);

    await page.goto(`${urls.web}/custom.html`);
    await page.locator('#discussion-heading').waitFor({ timeout: 30000 });
    expect('your own interface lists the thread', (await page.locator('#discussion-heading').innerText()).trim(), `${seeded.comments} comments`);
});

await check('next', async (page, expect) => {
    const html = await (await page.request.get(`${urls.next}/blog/${post}`)).text();
    expect('structured data is in the server render', /<script type="application\/ld\+json">[^<]*"@type":"Article"/.test(html), true);

    const viewers = [];
    page.on('request', (request) => {
        if (request.url().includes('/comments/api/viewer')) viewers.push(request.headers()['x-comments-profile']);
    });

    await page.goto(`${urls.next}/blog/${post}`);
    await drawn(page);
    expect('thread draws on another site', await count(page, '.comments__comment'), seeded.comments);
    await voteRoundTrip(page, expect);

    await page.getByRole('button', { name: 'Priya, a member' }).click();
    await page.getByText('Signed in as').waitFor({ timeout: 15000 });
    await page.locator('.comments__posting-as').waitFor({ state: 'attached', timeout: 30000 });
    expect('member is signed in to Comments with a member token', viewers, (list) => list.includes('cross-origin-public') && list.at(-1) === 'cross-origin-member');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.getByText('Reading as a guest').waitFor({ timeout: 15000 });

    await page.goto(`${urls.next}/custom/${post}`);
    await page.locator('#discussion-heading').waitFor({ timeout: 30000 });
    expect('your own interface lists the thread', (await page.locator('#discussion-heading').innerText()).trim(), `${seeded.comments} comments`);

    await page.goto(`${urls.next}/proxy/${post}`);
    await drawn(page);
    expect('the proxy variant draws the thread through this app’s origin', await count(page, '.comments__comment'), seeded.comments);
    await voteRoundTrip(page, expect);
});

await check('nuxt', async (page, expect) => {
    const html = await (await page.request.get(`${urls.nuxt}/blog/${post}`)).text();
    expect('structured data is in the server render', /<script type="application\/ld\+json"[^>]*>[^<]*"@type":"Article"/.test(html), true);

    await page.goto(`${urls.nuxt}/blog/${post}`);
    await drawn(page);
    expect('thread draws on a subdomain', await count(page, '.comments__comment'), seeded.comments);
    expect('ratings drawn as stars', await count(page, '[aria-label^="Rated"]'), seeded.ratings);
    await voteRoundTrip(page, expect);

    await page.goto(`${urls.nuxt}/custom/blog/${post}`);
    await page.locator('#discussion-heading').waitFor({ timeout: 30000 });
    expect('your own interface lists the thread', (await page.locator('#discussion-heading').innerText()).trim(), `${seeded.comments} comments`);

    // Craft's session cookie is set for the parent domain, so signing in on Craft signs in here too.
    await page.goto(`${urls.craft}/blog/${post}`);

    if (await signInAsModerator(page, 'nuxt')) {
        await page.getByText('Signed in as').waitFor({ timeout: 15000 });
        await page.goto(`${urls.nuxt}/blog/${post}`);
        await drawn(page);
        await moderatorView(page, expect);
        await page.goto(`${urls.craft}/blog/${post}`);
        await page.getByRole('button', { name: 'Sign out' }).click();
        await page.getByText('Reading as a guest').waitFor({ timeout: 15000 });
    }
});

await browser.close();

if (failures.length) {
    console.log(`\n${failures.length} check${failures.length === 1 ? '' : 's'} failed.`);
    process.exit(1);
}

console.log('\nEvery check passed.');
