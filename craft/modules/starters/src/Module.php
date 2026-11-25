<?php
namespace modules\starters;

use Craft;
use craft\base\Element;
use craft\console\Application as ConsoleApplication;
use craft\elements\User;
use craft\events\AuthenticateUserEvent;
use craft\events\ModelEvent;
use craft\helpers\App;
use verbb\comments\events\DefineBadgesEvent;
use verbb\comments\services\Comments as CommentsService;
use yii\base\Event;
use yii\base\Module as BaseModule;

/**
 * Site module for the Comments starters: the `starters/seed` console command, a "Verified buyer"
 * badge that the React and Vue starters draw with their own component, and protection for the seeded
 * accounts on a public demo, where the moderator can't sign in at all.
 */
class Module extends BaseModule
{
    // Constants
    // =========================================================================

    // Members of this group get the badge. In a real shop it'd come from orders, but a group keeps the
    // starter self-contained.
    public const BUYERS_GROUP = 'buyers';

    // The people `starters/seed` creates, whose passwords are published so anyone can try the demo.
    public const SEEDED_USERNAMES = ['priya', 'dan', 'alex', 'sam'];

    // The seeded moderator. Anyone signed in as them could moderate a public demo's comments, so they
    // can only sign in locally.
    public const SEEDED_MODERATOR = 'sam';


    // Properties
    // =========================================================================

    /** The buyers' user IDs, looked up once per request. */
    private ?array $_buyerIds = null;


    // Public Methods
    // =========================================================================

    public function init(): void
    {
        Craft::setAlias('@modules/starters', __DIR__);

        if (Craft::$app instanceof ConsoleApplication) {
            $this->controllerNamespace = 'modules\\starters\\console\\controllers';
        }

        parent::init();

        Event::on(CommentsService::class, CommentsService::EVENT_DEFINE_BADGES, function(DefineBadgesEvent $event): void {
            $this->_addBuyerBadge($event);
        });

        Event::on(User::class, Element::EVENT_BEFORE_SAVE, function(ModelEvent $event): void {
            $this->_protectSeededAccount($event);
        });

        Event::on(User::class, User::EVENT_BEFORE_AUTHENTICATE, function(AuthenticateUserEvent $event): void {
            /** @var User $user */
            $user = $event->sender;

            // Refused as a wrong password would be, so a public demo says nothing about the account.
            if ($user->username === self::SEEDED_MODERATOR && App::env('CRAFT_ENVIRONMENT') !== 'dev') {
                $user->authError = User::AUTH_INVALID_CREDENTIALS;
            }
        });
    }


    // Private Methods
    // =========================================================================

    private function _addBuyerBadge(DefineBadgesEvent $event): void
    {
        // Badges are public and cached for everyone, so this depends only on the comment's author,
        // never on who's looking. One query covers every comment drawn on the page.
        $this->_buyerIds ??= array_map('intval', User::find()->group(self::BUYERS_GROUP)->ids());
        $authorId = (int)$event->comment?->userId;

        if ($authorId && in_array($authorId, $this->_buyerIds, true)) {
            $event->badges[] = ['type' => 'verified', 'label' => 'Verified buyer'];
        }
    }

    /**
     * On a public demo the seeded people's passwords are known, so nobody may change those accounts
     * from the site, such as renaming Priya on every comment she's seeded with. The seed command and the
     * control panel still can, and anything goes in `dev`.
     */
    private function _protectSeededAccount(ModelEvent $event): void
    {
        /** @var User $user */
        $user = $event->sender;
        $request = Craft::$app->getRequest();

        if (App::env('CRAFT_ENVIRONMENT') === 'dev' || $request->getIsConsoleRequest() || !$request->getIsSiteRequest() || !$user->id) {
            return;
        }

        if (in_array($user->username, self::SEEDED_USERNAMES, true)) {
            $event->isValid = false;
        }
    }
}
