import { redirect } from 'next/navigation';

export default function Home() {
    const uri = process.env.NEXT_PUBLIC_COMMENTS_ENTRY_URI || 'blog/welcome-to-the-comments-starters';

    redirect(`/${uri}`);
}
