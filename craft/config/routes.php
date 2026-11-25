<?php
/**
 * Site URL Rules
 *
 * @link https://craftcms.com/docs/5.x/system/routing.html
 */

return [
    'api' => 'graphql/api',
    'turbo/<slug:{slug}>' => ['template' => 'turbo/_post'],
];
