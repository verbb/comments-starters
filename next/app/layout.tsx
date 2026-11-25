import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SessionBar } from '@/components/SessionBar';
import { StarterFooter, StarterHeader } from '@/components/Starter';
import { StarterTabs } from '@/components/StarterTabs';
import { currentPerson } from '@/lib/session';

import './globals.css';

export const metadata: Metadata = {
    title: 'Comments Next.js Starter',
    icons: '/favicon.svg',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
    const person = await currentPerson();

    return (
        <html lang="en">
            <body>
                <StarterHeader>
                    <SessionBar person={person} />
                </StarterHeader>
                <main className="mx-auto max-w-5xl px-6 py-10">
                    <StarterTabs />
                    {children}
                </main>
                <StarterFooter />
            </body>
        </html>
    );
}
