# Deploying the Starters

The hosted starters live at `comments-starters.verbb.io`. The Craft site installs Comments, Editor and Protect from Packagist, and the front ends install the `@verbb/*` packages from npm. Before deploying a change, run `npm run build` and `npm run smoke` locally.

## The Craft Site and the Vite Starters

Provision one PHP site on Forge for Craft, with `/craft/web` as its web directory, PHP 8.3, MySQL 8 and Node.js 22. The React, Vue and web components starters are served from its `/react/`, `/vue/` and `/web/` folders, on Craft's own origin, so they need no allowed origins.

Start from `craft/.env.example.production`. Generate a new `CRAFT_SECURITY_KEY` and `COMMENTS_MEMBER_TOKEN_KEY` (`openssl rand -hex 32`), use real Turnstile keys for the hosted domains, and list the Next.js and Nuxt origins in `COMMENTS_ALLOWED_ORIGINS`, as described in `craft/config/comments.php`.

The deployment script installs Composer packages, builds and copies the Vite starters, and migrates:

```bash
cd /home/forge/comments-starters.verbb.io
git pull origin "$FORGE_SITE_BRANCH"
"$FORGE_PHP" "$(command -v composer)" --working-dir=craft install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci && npm ci --prefix react && npm ci --prefix vue && npm ci --prefix web
npm run assemble:hosted
"$FORGE_PHP" craft/craft up --interactive=0
"$FORGE_PHP" craft/craft clear-caches/all
```

Add history fallbacks for the Vite apps before Craft's own rule in the site's Nginx config:

```nginx
location ^~ /react/ { try_files $uri $uri/ /react/index.html; }
location ^~ /vue/ { try_files $uri $uri/ /vue/index.html; }
location ^~ /web/ { try_files $uri $uri/ /web/index.html; }
```

### Seeding

Install Craft with a random admin password, then create the posts, people and comments:

```bash
"$FORGE_PHP" craft/craft install/craft --interactive=0 --username=admin --password="$(openssl rand -hex 24)" --email=you@example.com --site-name="Comments Starters" --site-url='$PRIMARY_SITE_URL' --language=en-US
"$FORGE_PHP" craft/craft starters/seed
```

Reset the admin password from the command line when you need to sign in (`users/set-password admin`). The seeded people sign in with the password `password`, which is the point of a demo. Outside `dev`, the starters module stops them changing their own accounts from the site, so nobody can rename Priya or lock the others out. Sam, the seeded moderator, only signs in locally. Outside `dev` Craft refuses the sign-in and the starters don't offer it, so visitors can't moderate the demo. The smoke test skips its moderator checks there.

A public demo collects real visitors' comments, so reset it on a schedule. A nightly job that runs `db/drop-all-tables`, then the two commands above, keeps it tidy. Only ever run it against the starters' own database.

## Next.js and Nuxt

Both run as Node servers, because the Next.js starter mints member tokens in a route handler and the Nuxt starter renders on the server. Run each with `npm ci`, `npm run build` and `npm run start`, behind a Forge daemon and an Nginx proxy.

Each needs an origin that matches what it demonstrates:

- **Next.js** needs a different site from Craft, such as a domain of its own, so the browser treats it as a separate site and member tokens are what sign people in. Set `COMMENTS_SERVER_URL`, `COMMENTS_MEMBER_TOKEN_KEY` (the same as Craft's), `STARTER_SESSION_SECRET` and `STARTER_PUBLIC_ORIGIN`, and `NEXT_PUBLIC_COMMENTS_ENDPOINT` before building, since Next.js puts it in the browser bundle at build time. List its origin in Craft's `COMMENTS_ALLOWED_ORIGINS` with `memberTokens`. Its `/proxy/…` pages forward Comments' actions through the app, and the route that does it explains what a production proxy needs to pass on.
- **Nuxt** needs a subdomain of the Craft site, such as `nuxt.comments-starters.verbb.io`, with Craft's `CRAFT_DEFAULT_COOKIE_DOMAIN` set to `.comments-starters.verbb.io`, and its origin listed with `credentials`.

Set `NEXT_STARTER_URL` and `NUXT_STARTER_URL` on the Craft site, so its home page links to them.

## Checking a Deployment

Point the smoke test at the hosted addresses, with `SMOKE_CRAFT_URL`, `SMOKE_REACT_URL` and the rest, and run `npm run smoke`.
