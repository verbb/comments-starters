#!/usr/bin/env bash
#
# Builds the starters' Craft site from scratch: installs Craft from the committed project config, then
# seeds the blog, the people the front ends sign in as and their comments with `craft starters/seed`.
#
# Running it again starts over. It drops every table in this DDEV project's database, so only run it
# against the starters' own database.

set -euo pipefail

CRAFT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOSITORY_ROOT="$(cd "$CRAFT_ROOT/.." && pwd)"

cd "$CRAFT_ROOT"

if ! command -v ddev >/dev/null 2>&1; then
    echo "DDEV is required to run the starters' Craft site." >&2
    exit 1
fi

# This drops every table, so only ever against this folder's own DDEV database. A .env that points
# Craft at another database server would otherwise send it there.
if ! grep -q '^name: comments-starters$' .ddev/config.yaml; then
    echo "This isn't the comments-starters DDEV project, so nothing was changed." >&2
    exit 1
fi

if [[ -f .env ]] && grep -Eq '^CRAFT_DB_SERVER=.+' .env && ! grep -q '^CRAFT_DB_SERVER=db$' .env; then
    echo "craft/.env points Craft at another database server, so nothing was changed." >&2
    exit 1
fi

random_key() {
    openssl rand -hex "$1"
}

# Set KEY=value in an env file when it's missing or empty there.
fill_env() {
    local file="$1" key="$2" value="$3"

    if grep -q "^$key=$" "$file"; then
        sed -i.bak "s|^$key=$|$key=$value|" "$file" && rm -f "$file.bak"
    elif ! grep -q "^$key=" "$file"; then
        printf '%s=%s\n' "$key" "$value" >> "$file"
    fi
}

if [[ ! -f .env ]]; then
    cp .env.example.dev .env
fi

fill_env .env CRAFT_SECURITY_KEY "$(random_key 16)"
fill_env .env COMMENTS_MEMBER_TOKEN_KEY "$(random_key 32)"
MEMBER_TOKEN_KEY="$(grep '^COMMENTS_MEMBER_TOKEN_KEY=' .env | cut -d= -f2-)"

# Each front end reads its own env file: .env.local for Vite and Next.js, and .env for Nuxt, which
# reads no other. The Next starter's server signs member token requests with the same key as Craft.
for app in react vue web next nuxt; do
    example="$REPOSITORY_ROOT/$app/.env.example"
    target="$REPOSITORY_ROOT/$app/.env.local"

    if [[ "$app" == nuxt ]]; then
        target="$REPOSITORY_ROOT/$app/.env"
    fi

    if [[ -f "$example" && ! -f "$target" ]]; then
        cp "$example" "$target"
    fi
done

if [[ -f "$REPOSITORY_ROOT/next/.env.local" ]]; then
    fill_env "$REPOSITORY_ROOT/next/.env.local" COMMENTS_MEMBER_TOKEN_KEY "$MEMBER_TOKEN_KEY"
    fill_env "$REPOSITORY_ROOT/next/.env.local" STARTER_SESSION_SECRET "$(random_key 32)"
fi

ddev start
ddev composer install --no-interaction

ddev craft db/drop-all-tables --interactive=0
ddev craft install/craft --interactive=0 \
    --username=admin \
    --password=password \
    --email=admin@example.test \
    --site-name="Comments Starters" \
    --site-url='$PRIMARY_SITE_URL' \
    --language=en-US

# The committed project config installs the plugins. Without it (when rebuilding the structure from
# the seed command alone), install whichever aren't installed yet.
for plugin in comments sprig datastar; do
    if ! ddev craft plugin/list 2>/dev/null | grep -Eq "^ +[A-Za-z ]+ +$plugin +.* Yes +Yes"; then
        ddev craft plugin/install "$plugin"
    fi
done

ddev craft starters/seed
ddev craft clear-caches/all

cat <<'DONE'

The Comments starters' Craft site is ready.

Site:           https://comments-starters.ddev.site/
Control panel:  https://comments-starters.ddev.site/admin (admin / password)
Members:        priya, dan and alex (password: password)
Moderator:      sam (password: password)
DONE
