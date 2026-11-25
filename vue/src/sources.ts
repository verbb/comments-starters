import type { CodeFile } from './components/CodeDrawer.vue';

// The files behind each page, as Vite reads them, for the header's code drawer. Imported with `?raw`,
// so the drawer shows the starter's own source rather than a copy that could drift from it.
import commentForm from './components/CommentForm.vue?raw';
import discussionComment from './components/DiscussionComment.vue?raw';
import ratingDisplay from './components/RatingDisplay.vue?raw';
import ratingInput from './components/RatingInput.vue?raw';
import verifiedBadge from './components/VerifiedBadge.vue?raw';
import craft from './craft.ts?raw';
import main from './main.ts?raw';
import customPage from './pages/CustomPage.vue?raw';
import threadPage from './pages/ThreadPage.vue?raw';

const file = (path: string, source: string): CodeFile => ({ path: `vue/src/${path}`, source });

export const sources = {
    thread: [
        file('pages/ThreadPage.vue', threadPage),
        file('components/VerifiedBadge.vue', verifiedBadge),
        file('components/RatingInput.vue', ratingInput),
        file('components/RatingDisplay.vue', ratingDisplay),
        file('main.ts', main),
        file('craft.ts', craft),
    ],
    custom: [file('pages/CustomPage.vue', customPage), file('components/CommentForm.vue', commentForm), file('components/DiscussionComment.vue', discussionComment), file('main.ts', main)],
} satisfies Record<string, CodeFile[]>;
