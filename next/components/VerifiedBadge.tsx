import type { CommentsPartProps } from '@verbb/comments-react';

type Badge = { type: string; label: string };

/**
 * Draws each badge on a comment's author. The starters' Craft module gives buyers a `verified` badge
 * (with Comments' `EVENT_DEFINE_BADGES`), which this draws with a tick. Other badges, such as Team
 * for moderators, keep Comments' own class names, so its stylesheet still styles them.
 */
export function VerifiedBadge(props: CommentsPartProps) {
    const badge = props.badge as Badge;

    if (badge.type !== 'verified') {
        // The same class Comments gives a badge, keeping only the characters it allows in a type.
        return <span className={`comments__badge comments__badge--${badge.type.replace(/[^\w-]/g, '')}`}>{badge.label}</span>;
    }

    return (
        <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current"><path d="M6.4 11.2 3.2 8l1.1-1.1 2.1 2.1 5.3-5.3L12.8 4.8z" /></svg>
            {badge.label}
        </span>
    );
}
