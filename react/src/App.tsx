import { CommentsProvider } from '@verbb/comments-react';

import { auth, endpoint } from './craft';
import { SignIn } from './components/SignIn';
import { StarterFooter, StarterHeader, StarterTabs } from './components/Starter';
import { CustomPage } from './pages/CustomPage';
import { ThreadPage } from './pages/ThreadPage';
import { href, navigate, usePath } from './router';

const pages = [
    { path: '/', label: 'The thread' },
    { path: '/custom', label: 'Your own interface' },
];

export function App() {
    const path = usePath();

    return (
        // Every thread and hook inside shares the endpoint and the sign-in.
        <CommentsProvider endpoint={endpoint} auth={auth} theme="auto">
            <StarterHeader>
                <SignIn />
            </StarterHeader>

            <main className="mx-auto max-w-5xl px-6 py-10">
                <StarterTabs tabs={pages} current={path} href={href} onSelect={navigate} />
                {path === '/custom' ? <CustomPage /> : <ThreadPage />}
            </main>

            <StarterFooter />
        </CommentsProvider>
    );
}
