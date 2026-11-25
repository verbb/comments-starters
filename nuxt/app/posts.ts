/** The posts the starters' Craft site seeds. A real app would list these from its CMS. */
export const posts = [
    { uri: 'blog/welcome-to-the-comments-starters', title: 'Short thread' },
    { uri: 'blog/a-long-conversation', title: 'Long thread' },
    { uri: 'blog/comments-are-closed-here', title: 'Closed thread' },
] as const;

/** A post's path in this app, which is its URI on the Craft site too. */
export function postPath(uri: string): string {
    return `/${uri}`;
}
