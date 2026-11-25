<?php
/**
 * Comments settings for the starters.
 *
 * Everything here can be changed in Settings → Comments too, but a config file wins, so these are
 * the settings each starter depends on. See https://verbb.io/craft-plugins/comments/docs for the rest.
 */

use craft\helpers\App;

$dev = App::env('CRAFT_ENVIRONMENT') === 'dev';

// Front ends on other origins (Settings → Comments → Other Sites). `COMMENTS_ALLOWED_ORIGINS` is a
// comma-separated list of origins, each optionally followed by `|` and the switches it needs:
// `credentials` (Shared Cookies), `memberTokens` (Member Tokens) and `moderation`.
//
//   COMMENTS_ALLOWED_ORIGINS="https://web.example.net,https://next.example.net|memberTokens,https://nuxt.example.com|credentials"
//
// Without it, `dev` allows the starters' local dev and preview servers, and other environments allow
// none. The React and Vue starters reach Craft through their dev server's proxy, or are served from
// Craft's own domain, so they never need listing.
$parseOrigins = static function(string $value): array {
    $origins = [];

    foreach (array_filter(array_map('trim', explode(',', $value))) as $row) {
        $parts = array_map('trim', explode('|', $row));
        $origin = ['origin' => array_shift($parts)];

        foreach (['credentials', 'memberTokens', 'moderation'] as $switch) {
            $origin[$switch] = in_array($switch, $parts, true);
        }

        $origins[] = $origin;
    }

    return $origins;
};

$configuredOrigins = trim((string)App::env('COMMENTS_ALLOWED_ORIGINS'));

if ($configuredOrigins !== '') {
    $allowedOrigins = $parseOrigins($configuredOrigins);
} elseif ($dev) {
    $allowedOrigins = $parseOrigins(implode(',', [
        // web/: Vite dev server and preview, guests only.
        'http://localhost:5275',
        'http://127.0.0.1:5275',
        'http://localhost:4275',
        'http://127.0.0.1:4275',
        // next/: members through member tokens.
        'http://localhost:3101|memberTokens',
        'http://127.0.0.1:3101|memberTokens',
        // nuxt/: a subdomain sharing Craft's session cookie.
        'https://nuxt.comments-starters.ddev.site:3102|credentials',
    ]));
} else {
    $allowedOrigins = [];
}

// Cloudflare's always-pass Turnstile test keys, unless the environment gives real ones. Turnstile
// never issues a token in a headless browser, so automated runs, such as scripts/smoke.mjs, set
// COMMENTS_TURNSTILE=off and rely on the honeypot and minimum time.
$turnstileKey = App::env('TURNSTILE_SITE_KEY') ?: '1x00000000000000000000AA';
$turnstileSecret = App::env('TURNSTILE_SECRET_KEY') ?: '1x0000000000000000000000000000000AA';

return [
    'allowGuest' => true,
    'guestRequireEmailName' => true,
    'allowGuestVoting' => true,
    'allowGuestFlagging' => true,

    'challengeProvider' => App::env('COMMENTS_TURNSTILE') === 'off' ? '' : 'turnstile',
    'turnstileKey' => $turnstileKey,
    'turnstileSecret' => $turnstileSecret,
    // Turnstile checks the hostname a token was issued for. The local front ends run on these.
    'protectionHostnames' => $dev ? ['localhost', '127.0.0.1', 'nuxt.comments-starters.ddev.site'] : [],

    'allowedOrigins' => $allowedOrigins,
    // At least 32 random characters, shared with the Next starter's server and never sent to a browser.
    'memberTokenKey' => '$COMMENTS_MEMBER_TOKEN_KEY',
];
