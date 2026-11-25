/**
 * The people this demo site can sign in as. A real site has its own accounts. Comments only needs to
 * know which Craft user a visitor is, here by the email address both sites have for them.
 */
export const people = {
    priya: { name: 'Priya Raman', email: 'priya@example.test', label: 'Priya, a member' },
    sam: { name: 'Sam Whitfield', email: 'sam@example.test', label: 'Sam, a moderator' },
} as const;

export type PersonKey = keyof typeof people;

export function isPersonKey(value: unknown): value is PersonKey {
    return typeof value === 'string' && Object.hasOwn(people, value);
}
