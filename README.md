# Comments Starters

Examples of [Comments](https://verbb.io/craft-plugins/comments) for Craft CMS on Craft-rendered pages and in front-end frameworks. Every starter shows the same seeded posts from one Craft site, so you can compare how each one draws the thread, signs people in and customises the look.

## The Starters

| Folder | Shows | How people sign in |
| --- | --- | --- |
| `craft/` | The Craft site every starter reads from, with a seeded blog, comments in every state and four custom fields. It also has four Craft-rendered examples: the one-line default, Sprig, Turbo (including Turbo 8's morphing refresh) and Datastar. | Craft's own session |
| `react/` | Vite and React with `<CommentsThread>`, a "Verified buyer" badge and a star rating drawn by the app's own components, and a second page built on `useCommentsThread()` and `useCommentForm()`. | Craft's own session, on Craft's domain |
| `vue/` | The React starter again, in Vite and Vue. | Craft's own session, on Craft's domain |
| `web/` | Vite and Tailwind with `<verbb-comments>`, styled through Comments' stable class names with its stylesheet in a CSS layer, `themeConfig` for buttons and fields, and a dark mode toggle, and a second page built with no framework on core's thread store and `commentForm()`. | Guests, from another site (Craft's own session when it's served from Craft) |
| `next/` | Next.js App Router on another site, with the comment count and structured data rendered on the server, members signed in with member tokens from a route handler, and a proxy variant. | Member tokens, from another site |
| `nuxt/` | Nuxt on a subdomain of the Craft site, with the count and structured data rendered on the server. | Craft's session cookie, shared with the subdomain |

The seeded people all have the password `password`. Priya, Dan and Alex are members, Priya is also a verified buyer, and Sam is a moderator, who only signs in locally so a hosted demo can't be moderated by its visitors. The admin account is `admin`.

## Requirements

- [DDEV](https://ddev.com) for the Craft site.
- Node.js 22 or later for the front ends.
- [mkcert](https://github.com/FiloSottile/mkcert), which DDEV installs, for the Nuxt starter's HTTPS dev server and for the Next.js server to trust the Craft site's certificate.

## Install

Build the Craft site. This installs Craft from the committed project config, then seeds the posts, people and comments with `craft starters/seed`. It also creates each front end's env file from its `.env.example` (`.env.local`, or `.env` for Nuxt), with the Next.js starter's Member Token Key matching Craft's.

```bash
craft/scripts/install.sh
```

Running it again starts the site over, dropping every table in its database.

Install the shared tools, then every front end, which install the `@verbb/*` packages from npm.

```bash
npm install
npm run install:apps
```

Start every front end's dev server, then open the Craft site's home page, which links to each one.

```bash
npm run dev
```

| Starter | Local address |
| --- | --- |
| Craft | https://comments-starters.ddev.site |
| React | http://localhost:5273 |
| Vue | http://localhost:5274 |
| Web Components | http://localhost:5275 |
| Next.js | http://localhost:3101 |
| Nuxt | https://nuxt.comments-starters.ddev.site:3102 |

## How Each Front End Reaches Craft

Comments chooses how to identify people by where the front end runs, and these starters cover each way.

The React and Vue dev servers forward `/actions/*` to Craft, so the browser sees one origin and Craft's session cookie identifies the person, as it does when the built app is served from the Craft site itself. They sign in with Craft's own `users/login` action.

The web components starter runs on another origin, where the browser won't send Craft's cookies, so visitors comment as guests with a guest session token. Its origin is listed under **Settings → Comments → Other Sites** in `craft/config/comments.php`.

The Next.js starter is on another site too, with its own sign-in. When someone is signed in there, its server asks Comments for a short-lived member token with a request signed by the **Member Token Key**, at `/api/comments-token`, and the browser sends the token with each request. Signing out revokes the person's tokens. Its `/proxy/…` pages show the alternative, forwarding `/actions/comments/*` to Craft so no tokens are needed.

The Nuxt starter runs on a subdomain of the Craft site. Craft sets its session cookie for the parent domain, `.comments-starters.ddev.site`, and Comments answers the subdomain with credentialed CORS, so signing in on the Craft site signs you in on the Nuxt site as well.

In the `dev` environment, `craft/config/comments.php` allows the starters' local origins, which you'd otherwise add under **Settings → Comments → Other Sites**. When yours differ, set `COMMENTS_ALLOWED_ORIGINS` in `craft/.env`, as that file describes.

## Checks

`npm run build` type-checks and builds every front end. `npm run smoke` drives every starter in Chromium against the running dev servers and the Craft site. It checks that each thread draws with the seeded comments, that a guest's vote reaches Craft and can be taken back, that signing in shows the right person where a starter has sign-in, that morphing page swaps keep the thread, and that the server renders include structured data. Its only writes are those votes, each taken back straight away, so the seeded comments stay as they are. Install its browser first with `npx playwright install chromium`.

Turnstile can't issue a token in a headless browser, so set `COMMENTS_TURNSTILE=off` in `craft/.env` before running anything automated that posts comments. The starters use Cloudflare's test keys, which always pass in a real browser.

## Licence

The starters are released under the MIT licence, so you can copy their code into your own site. Comments, Editor and Protect keep their own licences.
