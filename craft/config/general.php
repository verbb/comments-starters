<?php
/**
 * General Configuration
 *
 * @see \craft\config\GeneralConfig
 * @link https://craftcms.com/docs/5.x/reference/config/general.html
 */

use craft\config\GeneralConfig;
use craft\helpers\App;

// The Nuxt starter runs on a subdomain of the Craft site and shares Craft's session cookie (sign-in
// tier 2), which needs the cookie set on the parent domain. In `dev` that's the DDEV hostname's, so
// `nuxt.comments-starters.ddev.site` works out of the box. Elsewhere it's whatever the environment
// says, and nothing by default, which keeps cookies on Craft's own host.
$cookieDomain = App::env('CRAFT_DEFAULT_COOKIE_DOMAIN');

// An empty value in .env counts as unset.
if (($cookieDomain === null || $cookieDomain === '') && App::env('CRAFT_ENVIRONMENT') === 'dev') {
    $cookieDomain = '.comments-starters.ddev.site';
}

return GeneralConfig::create()
    ->defaultWeekStartDay(1)
    ->omitScriptNameInUrls()
    ->preventUserEnumeration()
    ->enableTwigSandbox()
    ->defaultCookieDomain($cookieDomain ?: '')
    // `@web` set from the site's URL rather than worked out from each request, so Comments' public
    // reads can be cached by a CDN and in Craft's data cache.
    ->aliases([
        '@web' => App::env('PRIMARY_SITE_URL'),
        '@webroot' => dirname(__DIR__) . '/web',
    ])
;
