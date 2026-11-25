<?php
/**
 * Yii Application Config
 *
 * @link https://craftcms.com/docs/5.x/reference/config/app.html
 */

use craft\helpers\App;
use modules\starters\Module as StartersModule;

return [
    'id' => App::env('CRAFT_APP_ID') ?: 'CraftCMS',
    'modules' => [
        'starters' => StartersModule::class,
    ],
    'bootstrap' => ['starters'],
];
