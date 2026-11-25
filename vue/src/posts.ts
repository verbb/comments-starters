/** The posts the starters' Craft site seeds. A real app would list these from its CMS. */
export const posts = [
    { uri: 'blog/welcome-to-the-comments-starters', title: 'Short thread' },
    { uri: 'blog/a-long-conversation', title: 'Long thread' },
    { uri: 'blog/comments-are-closed-here', title: 'Closed thread' },
];

export const defaultPostUri = import.meta.env.VITE_COMMENTS_ENTRY_URI || posts[0].uri;
