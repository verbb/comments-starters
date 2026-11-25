/** The posts the starters' Craft site seeds. A real app would read these from its CMS. */
export const posts = [
    { slug: 'welcome-to-the-comments-starters', title: 'Short thread' },
    { slug: 'a-long-conversation', title: 'Long thread' },
    { slug: 'comments-are-closed-here', title: 'Closed thread' },
];

export function ownerUri(slug: string): string {
    return `blog/${slug}`;
}
