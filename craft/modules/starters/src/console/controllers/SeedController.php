<?php
namespace modules\starters\console\controllers;

use Craft;
use craft\console\Controller;
use craft\elements\Asset;
use craft\elements\conditions\users\GroupConditionRule;
use craft\elements\Entry;
use craft\elements\User;
use craft\enums\CmsEdition;
use craft\fieldlayoutelements\CustomField;
use craft\fieldlayoutelements\entries\EntryTitleField;
use craft\fields\Assets as AssetsField;
use craft\fields\Number;
use craft\fields\PlainText;
use craft\fs\Local;
use craft\helpers\Console;
use craft\helpers\FileHelper;
use craft\helpers\StringHelper;
use craft\models\EntryType;
use craft\models\FieldLayout;
use craft\models\FieldLayoutTab;
use craft\models\Section;
use craft\models\Section_SiteSettings;
use craft\models\UserGroup;
use craft\models\Volume;
use DateTime;
use modules\starters\Module;
use verbb\comments\Comments;
use verbb\comments\elements\Comment;
use verbb\comments\enums\InteractionType;
use verbb\comments\fieldlayoutelements\CommentsField as CommentsLayoutElement;
use verbb\comments\fields\CommentsField;
use verbb\comments\models\CommentSubmission;
use verbb\comments\services\Comments as CommentsService;
use verbb\comments\services\FormFields;
use yii\console\ExitCode;

/**
 * Builds the starters' Craft site: a blog with comments in every state, the people the front ends sign
 * in as, and the four custom fields the starters show.
 *
 * Run it once on a fresh install. The structure (groups, fields, the blog and Comments' settings) is
 * saved to project config, so it's only built when missing, and `--content` wipes the seeded posts'
 * comments and creates them again.
 *
 *     ddev craft starters/seed
 *     ddev craft starters/seed --content
 */
class SeedController extends Controller
{
    // Properties
    // =========================================================================

    public $defaultAction = 'index';

    /** Recreate the seeded comments, keeping the structure. */
    public bool $content = false;

    private ?User $_admin = null;
    private ?Volume $_photoVolume = null;
    private array $_groups = [];
    private array $_users = [];


    // Public Methods
    // =========================================================================

    public function options($actionID): array
    {
        return [...parent::options($actionID), 'content'];
    }

    public function actionIndex(): int
    {
        $this->_admin = User::find()->admin(true)->one();

        if (!$this->_admin) {
            $this->stderr("Install Craft first, so there's an admin to seed as.\n", Console::FG_RED);

            return ExitCode::UNSPECIFIED_ERROR;
        }

        // User groups and more than one account need Craft Pro.
        if (Craft::$app->edition !== CmsEdition::Pro) {
            Craft::$app->setEdition(CmsEdition::Pro);
        }

        $this->_photoVolume = $this->_ensurePhotoVolume();
        $this->_ensureGroups();
        $fields = $this->_ensureFields();
        $this->_ensureBlog($fields['body'], $fields['comments']);
        $this->_ensureCommentLayout($fields);
        $this->_ensureUsers();

        // Write the structure to project config now, so a failure while seeding content can't leave
        // database rows that project config doesn't know about.
        Craft::$app->getProjectConfig()->saveModifiedConfigData();

        // Seeding never sends email, and the seeded comments aren't coming from a browser, so nothing
        // could answer the spam protection. Both are only turned off for this request.
        $settings = Comments::$plugin->getSettings();
        $settings->participantNotifications = [];
        $settings->staffNotifications = [];
        $settings->challengeProvider = '';
        $settings->spamClassifier = '';
        $settings->honeypotEnabled = false;
        $settings->replayProtectionEnabled = false;
        $settings->rateLimitEnabled = false;
        $settings->minimumSubmitTime = 0;
        $settings->enableSpamChecks = false;

        $this->_seedContent();

        Craft::$app->getProjectConfig()->saveModifiedConfigData();
        Comments::$plugin->getDiagnostics()->rebuildAllAggregates();

        $this->stdout("\nDone. Open " . rtrim((string)Craft::$app->getSites()->getPrimarySite()->getBaseUrl(), '/') . "/\n", Console::FG_GREEN);

        return ExitCode::OK;
    }


    // Private Methods
    // =========================================================================

    private function _ensurePhotoVolume(): Volume
    {
        $volumes = Craft::$app->getVolumes();
        $volume = $volumes->getVolumeByHandle('commentPhotos');

        if ($volume) {
            return $volume;
        }

        FileHelper::createDirectory(Craft::getAlias('@webroot/uploads/comment-photos'));

        $fs = new Local([
            'name' => 'Comment Photos',
            'handle' => 'commentPhotos',
            'path' => '@webroot/uploads/comment-photos',
            'hasUrls' => true,
            'url' => '@web/uploads/comment-photos',
        ]);

        if (!Craft::$app->getFs()->saveFilesystem($fs)) {
            throw new \RuntimeException('Couldn’t save the Comment Photos filesystem: ' . json_encode($fs->getErrors()));
        }

        $volume = new Volume([
            'name' => 'Comment Photos',
            'handle' => 'commentPhotos',
            'fsHandle' => 'commentPhotos',
        ]);

        if (!$volumes->saveVolume($volume)) {
            throw new \RuntimeException('Couldn’t save the Comment Photos volume: ' . json_encode($volume->getErrors()));
        }

        // Account photos live in the same volume, in a folder per person.
        $projectConfig = Craft::$app->getProjectConfig();
        $projectConfig->set('users.photoVolumeUid', $volume->uid);
        $projectConfig->set('users.photoSubpath', 'people/{id}');

        $this->stdout("Created the Comment Photos volume.\n");

        return $volume;
    }

    private function _ensureGroups(): void
    {
        $userGroups = Craft::$app->getUserGroups();
        $definitions = [
            // Everyone with an account. The members-only field is shown to this group.
            'members' => ['Members', []],
            // Moderate on the site, from the thread's ··· menus. No control panel needed.
            'moderators' => ['Moderators', ['comments-view', 'comments-moderate', 'comments-edit', 'comments-trash']],
            // Gets the "Verified buyer" badge from the starters module.
            Module::BUYERS_GROUP => ['Buyers', []],
        ];

        foreach ($definitions as $handle => [$name, $permissions]) {
            $group = $userGroups->getGroupByHandle($handle);

            if (!$group) {
                $group = new UserGroup(['name' => $name, 'handle' => $handle]);

                if (!$userGroups->saveGroup($group)) {
                    throw new \RuntimeException("Couldn’t save the $name group: " . json_encode($group->getErrors()));
                }

                Craft::$app->getUserPermissions()->saveGroupPermissions($group->id, $permissions);
                $this->stdout("Created the $name group.\n");
            }

            $this->_groups[$handle] = $group;
        }
    }

    private function _ensureFields(): array
    {
        $definitions = [
            'body' => fn() => new PlainText([
                'name' => 'Body',
                'handle' => 'body',
                'multiline' => true,
                'initialRows' => 8,
            ]),
            'comments' => fn() => new CommentsField([
                'name' => 'Comments',
                'handle' => 'comments',
            ]),
            // Collected only. Moderators see it in the control panel, the author when editing, and it's
            // never in a public response.
            'orderNumber' => fn() => new PlainText([
                'name' => 'Order Number',
                'handle' => 'orderNumber',
                'instructions' => 'Only our team sees this. We’ll use it to look into your order.',
                'charLimit' => 20,
            ]),
            // Shown as stars on top-level comments. The React and Vue starters draw their own input.
            'rating' => fn() => new Number([
                'name' => 'Rating',
                'handle' => 'rating',
                'min' => 1,
                'max' => 5,
                'decimals' => 0,
            ]),
            // Only members fill it in, through a user condition on its layout element.
            'readingFrom' => fn() => new PlainText([
                'name' => 'Reading From',
                'handle' => 'readingFrom',
                'instructions' => 'Your city, if you’d like to share it.',
                'charLimit' => 60,
            ]),
            'photo' => fn() => new AssetsField([
                'name' => 'Photo',
                'handle' => 'photo',
                'maxRelations' => 1,
                'restrictFiles' => true,
                'allowedKinds' => ['image'],
                'restrictLocation' => true,
                'restrictedLocationSource' => 'volume:' . $this->_photoVolume->uid,
                'restrictedLocationSubpath' => 'comments',
            ]),
        ];

        $fieldsService = Craft::$app->getFields();
        $fields = [];

        foreach ($definitions as $handle => $make) {
            $field = $fieldsService->getFieldByHandle($handle);

            if (!$field) {
                $field = $make();

                if (!$fieldsService->saveField($field)) {
                    throw new \RuntimeException("Couldn’t save the $handle field: " . json_encode($field->getErrors()));
                }

                $this->stdout("Created the {$field->name} field.\n");
            }

            $fields[$handle] = $field;
        }

        return $fields;
    }

    private function _ensureBlog(PlainText $bodyField, CommentsField $commentsField): void
    {
        $entries = Craft::$app->getEntries();

        if ($entries->getSectionByHandle('blog')) {
            return;
        }

        $entryType = new EntryType([
            'name' => 'Post',
            'handle' => 'post',
        ]);

        $layout = new FieldLayout(['type' => Entry::class]);
        $content = new FieldLayoutTab(['name' => 'Content', 'layout' => $layout]);
        $content->setElements([new EntryTitleField(), new CustomField($bodyField)]);
        // Comments' own tab, as the docs recommend, so editors find the panel in one place.
        $discussion = new FieldLayoutTab(['name' => 'Comments', 'layout' => $layout]);
        $discussion->setElements([new CustomField($commentsField)]);
        $layout->setTabs([$content, $discussion]);
        $entryType->setFieldLayout($layout);

        if (!$entries->saveEntryType($entryType)) {
            throw new \RuntimeException('Couldn’t save the Post entry type: ' . json_encode($entryType->getErrors()));
        }

        $section = new Section([
            'name' => 'Blog',
            'handle' => 'blog',
            'type' => Section::TYPE_CHANNEL,
            'enableVersioning' => false,
        ]);
        $section->setSiteSettings(array_map(static fn($site) => new Section_SiteSettings([
            'siteId' => $site->id,
            'hasUrls' => true,
            'uriFormat' => 'blog/{slug}',
            'template' => 'blog/_entry',
        ]), Craft::$app->getSites()->getAllSites()));
        $section->setEntryTypes([$entryType]);

        if (!$entries->saveSection($section)) {
            throw new \RuntimeException('Couldn’t save the Blog section: ' . json_encode($section->getErrors()));
        }

        $this->stdout("Created the Blog section.\n");
    }

    private function _ensureCommentLayout(array $fields): void
    {
        $projectConfig = Craft::$app->getProjectConfig();
        $existing = $projectConfig->get(CommentsService::CONFIG_FIELDLAYOUT_KEY) ?? [];

        // A layout that already has the custom fields was built by an earlier run. One with the rating
        // above the comment, as a run on 14 November 2026 seeded it, gets it moved back below.
        if ($existing && str_contains(json_encode($existing), $fields['rating']->uid)) {
            $this->_putRatingAfterComment($existing, $fields['rating']->uid);

            return;
        }

        $layout = new FieldLayout(['type' => Comment::class]);
        $tab = new FieldLayoutTab(['name' => 'Content', 'layout' => $layout]);

        $rating = new CustomField($fields['rating']);
        $readingFrom = new CustomField($fields['readingFrom']);
        $photo = new CustomField($fields['photo']);
        $orderNumber = new CustomField($fields['orderNumber']);

        // Guests never see this field, and Comments refuses it if they send it anyway.
        $condition = User::createCondition();
        $rule = new GroupConditionRule();
        $rule->setValues([$this->_groups['members']->uid]);
        $condition->addConditionRule($rule);
        $readingFrom->setUserCondition($condition);

        $elements = [new CommentsLayoutElement(), $rating, $readingFrom, $photo, $orderNumber];

        // Comment Form Fields refer to layout elements by UID, so they need theirs before saving.
        foreach ($elements as $element) {
            $element->uid = StringHelper::UUID();
        }

        $tab->setElements($elements);
        $layout->setTabs([$tab]);

        $layoutUid = $existing ? array_key_first($existing) : StringHelper::UUID();
        $projectConfig->set(CommentsService::CONFIG_FIELDLAYOUT_KEY, [$layoutUid => $layout->getConfig()]);

        // Comment Form Fields (Settings → Comments → Fields) and the rest of the starters' settings. They're
        // saved straight into project config, rather than through `savePluginSettings()`, so the values
        // config/comments.php sets, such as the allowed origins, stay out of it.
        $settings = [
            'formFields' => [
                $rating->uid => ['mode' => FormFields::MODE_COLLECT_AND_SHOW, 'placement' => FormFields::PLACEMENT_INLINE, 'replies' => false],
                $readingFrom->uid => ['mode' => FormFields::MODE_COLLECT_AND_SHOW, 'placement' => FormFields::PLACEMENT_INLINE, 'replies' => true],
                $photo->uid => ['mode' => FormFields::MODE_COLLECT_AND_SHOW, 'placement' => FormFields::PLACEMENT_DETAILS, 'replies' => false],
                $orderNumber->uid => ['mode' => FormFields::MODE_COLLECT, 'placement' => FormFields::PLACEMENT_DETAILS, 'replies' => false],
            ],
            'allowGuestFieldUploads' => true,
            'moderatorUserGroup' => $this->_groups['moderators']->uid,
            'staffBadgeGroups' => [$this->_groups['moderators']->uid],
            'staffBadgeLabel' => 'Team',
            'interactionMode' => 'updown',
            'allowAttachments' => true,
            'attachmentVolume' => $this->_photoVolume->uid,
        ];
        $model = Comments::$plugin->getSettings();

        foreach ($settings as $name => $value) {
            $projectConfig->set("plugins.comments.settings.$name", $value);
            // This request's settings were loaded before, so the seeding below needs them too.
            $model->$name = $value;
        }

        // Comments works the volume's ID out from its UID when it loads its settings, which this
        // request already has.
        $model->attachmentVolumeId = (int)$this->_photoVolume->id;

        $this->stdout("Set up the comment form's fields and Comments' settings.\n");
    }

    /**
     * Moves the rating to just after the Comment element in a layout that has it before.
     */
    private function _putRatingAfterComment(array $existing, string $ratingFieldUid): void
    {
        $layoutUid = array_key_first($existing);
        $config = $existing[$layoutUid];
        $elements = $config['tabs'][0]['elements'] ?? [];
        $comment = null;
        $rating = null;

        foreach ($elements as $index => $element) {
            if (($element['type'] ?? null) === CommentsLayoutElement::class) {
                $comment ??= $index;
            } elseif (($element['fieldUid'] ?? null) === $ratingFieldUid) {
                $rating = $index;
            }
        }

        if ($comment === null || $rating === null || $rating > $comment) {
            return;
        }

        $moved = $elements[$rating];
        unset($elements[$rating]);
        $elements = array_values($elements);
        // The Comment element moved up one when the rating came out from before it.
        array_splice($elements, $comment, 0, [$moved]);
        $config['tabs'][0]['elements'] = array_values($elements);
        Craft::$app->getProjectConfig()->set(CommentsService::CONFIG_FIELDLAYOUT_KEY . '.' . $layoutUid, $config);

        $this->stdout("Moved the rating below the comment.\n");
    }

    private function _ensureUsers(): void
    {
        $people = [
            // Username, first name, last name, groups, photo.
            ['priya', 'Priya', 'Raman', ['members', Module::BUYERS_GROUP], 'priya-raman.png'],
            ['dan', 'Dan', 'Okafor', ['members'], 'dan-okafor.png'],
            ['alex', 'Alex', 'Morgan', ['members'], null],
            ['sam', 'Sam', 'Whitfield', ['members', 'moderators'], null],
        ];

        foreach ($people as [$username, $first, $last, $groups, $photo]) {
            $user = User::find()->username($username)->status(null)->one();

            if (!$user) {
                $user = new User([
                    'username' => $username,
                    'email' => "$username@example.test",
                    'firstName' => $first,
                    'lastName' => $last,
                    'newPassword' => 'password',
                ]);

                if (!Craft::$app->getElements()->saveElement($user)) {
                    throw new \RuntimeException("Couldn’t save $username: " . json_encode($user->getErrors()));
                }

                Craft::$app->getUsers()->activateUser($user);
                Craft::$app->getUsers()->assignUserToGroups($user->id, array_map(fn($handle) => $this->_groups[$handle]->id, $groups));

                if ($photo) {
                    $this->_assignPhoto($user, Craft::getAlias('@root/seeds/avatars/' . $photo));
                }

                $this->stdout("Created $first $last ($username).\n");
            }

            $this->_users[$username] = $user;
        }
    }

    private function _assignPhoto(User $user, string $source): void
    {
        if (!is_file($source)) {
            $this->stderr("Missing the photo $source, so {$user->username} gets initials.\n", Console::FG_YELLOW);

            return;
        }

        // Craft moves the file it's given, so hand it a copy.
        $temporary = Craft::$app->getPath()->getTempPath() . '/' . uniqid('avatar-', true) . '.png';
        copy($source, $temporary);
        Craft::$app->getUsers()->saveUserPhoto($temporary, $user, basename($source));
    }

    private function _seedContent(): void
    {
        $posts = [
            'welcome-to-the-comments-starters' => [
                'Short thread',
                "Every starter shows this post's comments, drawn by the same renderer the plugin uses on Craft's own pages.\n\nSign in as Priya to comment as a member, or as Sam to see the moderator's view, with the comment that's waiting for approval and the one that's been reported. As a guest you can still comment, vote and report.\n\nThe comment form asks for a rating, which is shown on the comment, an order number that only the team sees, and a photo. Members are also asked where they're reading from.",
            ],
            'a-long-conversation' => [
                'Long thread',
                "This post has 64 top-level comments, so the thread draws its first comments straight away and the rest while the browser is idle, then pages with **Load more**.",
            ],
            'comments-are-closed-here' => [
                'Closed thread',
                "The discussion on this post is closed. Its comments can still be read and reported, but nobody can add to them.",
            ],
        ];
        $entries = [];

        // Each a day older than the one before, so Craft lists them newest first in this order.
        foreach (array_keys($posts) as $position => $slug) {
            [$title, $body] = $posts[$slug];
            $entries[$slug] = $this->_ensurePost($slug, $title, $body, new DateTime('-' . (14 + $position) . ' days'));
        }

        // Closed through its Comments field, as an editor closes one, so saving the post keeps it closed.
        $this->_setDiscussion($entries['comments-are-closed-here'], CommentsField::STATE_CLOSED);

        $ownerIds = array_map(static fn(Entry $entry) => $entry->id, $entries);
        $existing = Comment::find()->ownerId($ownerIds)->status(null)->count();

        if ($existing && !$this->content) {
            $this->stdout("The posts already have comments. Run with --content to create them again.\n");

            return;
        }

        if ($existing) {
            // Replies point at their parents, so delete the deepest first.
            $comments = Comment::find()->ownerId($ownerIds)->status(null)->all();
            usort($comments, static fn(Comment $a, Comment $b) => (int)$b->depth <=> (int)$a->depth);

            foreach ($comments as $comment) {
                Craft::$app->getElements()->deleteElement($comment, true);
            }

            // The seeded photo goes too, so a rerun doesn't leave another copy each time.
            $photos = Asset::find()->volumeId($this->_photoVolume->id)->folderPath('comments/')->all();

            foreach ($photos as $photo) {
                Craft::$app->getElements()->deleteElement($photo, true);
            }

            $this->stdout('Deleted ' . count($comments) . " seeded comments and the seeded photo.\n");
        }

        $this->_seedWelcome($entries['welcome-to-the-comments-starters']);
        $this->_seedLongConversation($entries['a-long-conversation']);
        $this->_seedClosed($entries['comments-are-closed-here']);
    }

    private function _ensurePost(string $slug, string $title, string $body, DateTime $postDate): Entry
    {
        $entry = Entry::find()->section('blog')->slug($slug)->status(null)->one();

        // A post seeded before its title changed takes the new title and its place in the order.
        if ($entry && $entry->title !== $title) {
            $entry->title = $title;
            $entry->postDate = $postDate;

            if (!Craft::$app->getElements()->saveElement($entry)) {
                throw new \RuntimeException("Couldn’t rename the post $slug: " . json_encode($entry->getErrors()));
            }

            $this->stdout("Renamed the post “{$title}”.\n");
        }

        if ($entry) {
            return $entry;
        }

        $section = Craft::$app->getEntries()->getSectionByHandle('blog');
        $entry = new Entry([
            'sectionId' => $section->id,
            'typeId' => $section->getEntryTypes()[0]->id,
            'title' => $title,
            'slug' => $slug,
            'postDate' => $postDate,
        ]);
        $entry->setAuthorId($this->_admin->id);
        $entry->setFieldValue('body', $body);

        if (!Craft::$app->getElements()->saveElement($entry)) {
            throw new \RuntimeException("Couldn’t save the post $title: " . json_encode($entry->getErrors()));
        }

        $this->stdout("Created the post “{$title}”.\n");

        return $entry;
    }

    /**
     * Every state a reader, a member and a moderator can meet: approved comments with replies, votes
     * and custom field values, a guest's comment, one waiting for approval, one reported and one
     * marked as spam.
     */
    private function _seedWelcome(Entry $entry): void
    {
        $priya = $this->_users['priya'];
        $dan = $this->_users['dan'];
        $alex = $this->_users['alex'];
        $sam = $this->_users['sam'];

        $first = $this->_post($entry, 'These starters are a great way to see Comments outside a Craft template. The React one is next on my list.', $priya, ago: '9 days', fields: ['rating' => 5, 'readingFrom' => 'Melbourne', 'orderNumber' => 'VB-10442']);
        $reply = $this->_post($entry, 'Same here. I tried the Next.js starter first because our site is headless, and signing in through member tokens took about five minutes.', $dan, parent: $first, ago: '8 days', fields: ['readingFrom' => 'Lagos']);
        $this->_post($entry, 'Glad it helped! The Nuxt starter does the same thing with a shared cookie, if your front end is on a subdomain.', $sam, parent: $reply, ago: '8 days');
        $this->_post($entry, 'Does the thread keep working when Turbo morphs the page?', null, parent: $first, ago: '7 days', guest: ['name' => 'Jamie Lee', 'email' => 'jamie@example.test']);

        $second = $this->_post($entry, 'I bought the plugin last week. The rating on this comment is a custom field, shown as stars by the React and Vue starters.', $priya, ago: '6 days', fields: ['rating' => 4]);
        $this->_post($entry, 'Comments without an account work too. Guests can vote, report and follow on this site.', null, ago: '5 days', guest: ['name' => 'Morgan Ellis', 'email' => 'morgan@example.test']);
        $third = $this->_post($entry, 'Has anyone styled the thread with Tailwind? The web starter does it with the stable class names.', $alex, ago: '3 days', fields: ['rating' => 3, 'readingFrom' => 'Wellington']);
        $this->_post($entry, 'It does, with Comments’ stylesheet in its own CSS layer so the utilities win.', $dan, parent: $third, ago: '2 days');

        // Held for review. Only moderators, and Alex as its author, see it.
        $this->_post($entry, 'Waiting for approval. Moderators see this with Approve, Spam and Remove.', $alex, ago: '1 day', state: 'pending');

        // Reported by two readers, so it shows in the moderators' Reported list.
        $reported = $this->_post($entry, 'First! Nobody reads these anyway.', null, ago: '20 hours', guest: ['name' => 'Taylor Brooks', 'email' => 'taylor@example.test']);
        $this->_report($reported, $priya, 'off-topic');
        $this->_report($reported, $dan, 'spam');

        // Spam is hidden from readers. Moderators see it in the thread with Not spam, and in the control
        // panel's Spam source.
        $this->_post($entry, 'Cheap watches at definitely-not-spam.example', null, ago: '12 hours', guest: ['name' => 'Watch Deals', 'email' => 'deals@example.test'], state: 'spam');

        $this->_vote($first, [$dan, $alex, $sam], InteractionType::Upvote);
        $this->_vote($second, [$dan], InteractionType::Upvote);
        $this->_vote($second, [$alex], InteractionType::Downvote);
        $this->_vote($third, [$priya, $sam], InteractionType::Upvote);
        $this->_vote($reply, [$priya], InteractionType::Upvote);

        $this->_attachPhoto($second, Craft::getAlias('@root/seeds/photos/desk.jpg'));

        $this->stdout("Seeded the welcome post’s thread.\n");
    }

    /**
     * Enough top-level comments that the thread draws in batches and pages with Load more.
     */
    private function _seedLongConversation(Entry $entry): void
    {
        $people = array_values(array_filter($this->_users, static fn(User $user) => $user->username !== 'sam'));
        $lines = [
            'Adding another comment to make this a long thread.',
            'Long threads draw their first comments at once and the rest while the browser is idle.',
            'Scroll down to see Load more.',
            'Sorting by Top puts the most liked comments first.',
            'This one has a reply underneath it.',
        ];

        for ($i = 1; $i <= 64; $i++) {
            $author = $people[$i % count($people)];
            $comment = $this->_post($entry, "Comment $i. " . $lines[$i % count($lines)], $author, ago: (65 - $i) . ' hours');

            if ($comment && $i % 5 === 0) {
                $this->_post($entry, "A reply to comment $i.", $people[($i + 1) % count($people)], parent: $comment, ago: (64 - $i) . ' hours');
            }

            if ($comment && $i % 7 === 0) {
                $this->_vote($comment, array_slice($people, 0, ($i % 3) + 1), InteractionType::Upvote);
            }
        }

        $this->stdout("Seeded the long conversation.\n");
    }

    private function _seedClosed(Entry $entry): void
    {
        // Open while it's seeded, since a closed discussion refuses new comments, then closed again.
        $this->_setDiscussion($entry, CommentsField::STATE_INHERIT);

        $this->_post($entry, 'This discussion was closed after a week. You can still read it, but nobody can add to it.', $this->_users['sam'], ago: '10 days');
        $this->_post($entry, 'Closed threads keep reporting open, so problems can still reach the moderators.', $this->_users['dan'], ago: '9 days');

        $this->_setDiscussion($entry, CommentsField::STATE_CLOSED);

        $this->stdout("Seeded the closed post.\n");
    }

    /**
     * Opens or closes a post's discussion through its Comments field, which closes the conversation
     * when the post saves.
     */
    private function _setDiscussion(Entry $entry, string $state): void
    {
        if ($entry->getFieldValue('comments') === $state) {
            return;
        }

        $entry->setFieldValue('comments', $state);

        if (!Craft::$app->getElements()->saveElement($entry)) {
            throw new \RuntimeException("Couldn’t set the discussion on {$entry->title}: " . json_encode($entry->getErrors()));
        }
    }

    /**
     * Posts a comment through Comments' own service, as the site's forms do, then moves it into the
     * state it's meant to be in through moderation, as a moderator would.
     */
    private function _post(Entry $entry, string $content, ?User $author, ?Comment $parent = null, string $ago = '1 hour', array $guest = [], array $fields = [], string $state = 'approved'): ?Comment
    {
        $submission = new CommentSubmission(array_filter([
            'ownerId' => $entry->id,
            'siteId' => $entry->siteId,
            'content' => $content,
            'userId' => $author?->id,
            'parentId' => $parent?->id,
            'name' => $guest['name'] ?? null,
            'email' => $guest['email'] ?? null,
        ], static fn($value) => $value !== null));

        $comment = Comments::$plugin->getComments()->create($submission, function(Comment $comment) use ($ago, $fields): void {
            $comment->commentDate = new DateTime("-$ago");

            if ($fields) {
                $this->_applyFields($comment, $fields);
            }
        })->comment;

        if (!$comment) {
            return null;
        }

        $moderation = Comments::$plugin->getModeration();

        return match ($state) {
            'approved' => $comment->moderationState === 'approved' ? $comment : $moderation->approve($comment, $this->_admin, 'Seeded'),
            'spam' => $moderation->markSpam($comment, $this->_admin, 'Seeded'),
            default => $comment,
        };
    }

    /**
     * Sets custom field values as if the comment had been posted with them, recording the mode each
     * field was in, which decides whether its value is ever shown.
     */
    private function _applyFields(Comment $comment, array $values): void
    {
        $formFields = Comments::$plugin->getFormFields();
        $settings = $formFields->settings();
        $layout = $comment->getFieldLayout();
        $modes = [];

        foreach ($layout?->getCustomFieldElements() ?? [] as $element) {
            $handle = $element->getField()->handle;

            if (array_key_exists($handle, $values) && isset($settings[$element->uid])) {
                $modes[$element->uid] = $settings[$element->uid]['mode'];
            }
        }

        $comment->setFormFieldElements(array_keys($modes));
        $comment->setPostedFieldModes($modes);
        $comment->setFieldValues($values);
    }

    private function _attachPhoto(?Comment $comment, string $source): void
    {
        if (!$comment) {
            return;
        }

        if (!is_file($source)) {
            $this->stderr("Missing the photo $source, so no comment has one.\n", Console::FG_YELLOW);

            return;
        }

        $folder = Craft::$app->getAssets()->ensureFolderByFullPathAndVolume('comments', $this->_photoVolume);
        $temporary = Craft::$app->getPath()->getTempPath() . '/' . basename($source);
        copy($source, $temporary);

        $asset = new Asset([
            'tempFilePath' => $temporary,
            'filename' => basename($source),
            'newFolderId' => $folder->id,
            'volumeId' => $this->_photoVolume->id,
            'avoidFilenameConflicts' => true,
        ]);
        $asset->setScenario(Asset::SCENARIO_CREATE);

        if (!Craft::$app->getElements()->saveElement($asset)) {
            $this->stderr('Couldn’t save the seeded photo: ' . json_encode($asset->getErrors()) . "\n");

            return;
        }

        $modes = $comment->getPostedFieldModes() ?? [];

        foreach ($comment->getFieldLayout()?->getCustomFieldElements() ?? [] as $element) {
            if ($element->getField()->handle === 'photo') {
                $modes[$element->uid] = FormFields::MODE_COLLECT_AND_SHOW;
            }
        }

        $comment->setPostedFieldModes($modes);
        $comment->setFieldValue('photo', [$asset->id]);
        Craft::$app->getElements()->saveElement($comment, false);
    }

    private function _vote(?Comment $comment, array $people, InteractionType $type): void
    {
        if (!$comment) {
            return;
        }

        foreach ($people as $person) {
            $identity = Comments::$plugin->getIdentities()->getOrCreateForUser($person);
            Comments::$plugin->getInteractions()->toggle((int)$comment->id, (int)$identity->id, $type);
        }
    }

    private function _report(?Comment $comment, User $reporter, string $reason): void
    {
        if (!$comment) {
            return;
        }

        $identity = Comments::$plugin->getIdentities()->getOrCreateForUser($reporter);
        Comments::$plugin->getReports()->create((int)$comment->id, (int)$identity->id, $reason);
    }
}
