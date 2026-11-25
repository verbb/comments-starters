import type { CommentsFieldDisplayProps, CommentsFieldInputProps } from '@verbb/comments-react';

const scores = [1, 2, 3, 4, 5];

/**
 * The rating field as five stars on the form. Comments keeps the field's label, instructions and
 * error around it and posts whatever `setValue()` was given last.
 */
export function RatingInput({ value, setValue, error, id, labelId, describedBy }: CommentsFieldInputProps) {
    const current = Number(value) || 0;

    return (
        <div id={id} role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy ?? undefined} aria-invalid={error ? 'true' : undefined} className="flex gap-1">
            {scores.map((score) => (
                <button
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={current === score}
                    aria-label={`${score} out of 5`}
                    onClick={() => setValue(current === score ? null : score)}
                    className={`text-2xl leading-none ${score <= current ? 'text-amber-400' : 'text-slate-300'} hover:text-amber-300`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

/** The rating on a comment, beside its date. */
export function RatingDisplay({ value }: CommentsFieldDisplayProps) {
    const score = Math.max(0, Math.min(5, Number(value) || 0));

    return (
        <span role="img" aria-label={`Rated ${score} out of 5`} className="text-amber-400">
            {'★'.repeat(score)}
            <span className="text-slate-300">{'★'.repeat(5 - score)}</span>
        </span>
    );
}
