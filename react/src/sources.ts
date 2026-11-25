import type { CodeFile } from './components/CodeDrawer';

// The files behind each page, as Vite reads them, for the header's code drawer. Imported with `?raw`,
// so the drawer shows the starter's own source rather than a copy that could drift from it.
import craft from './craft.ts?raw';
import rating from './components/Rating.tsx?raw';
import verifiedBadge from './components/VerifiedBadge.tsx?raw';
import customPage from './pages/CustomPage.tsx?raw';
import threadPage from './pages/ThreadPage.tsx?raw';

const file = (path: string, source: string): CodeFile => ({ path: `react/src/${path}`, source });

export const sources = {
    thread: [file('pages/ThreadPage.tsx', threadPage), file('components/VerifiedBadge.tsx', verifiedBadge), file('components/Rating.tsx', rating), file('craft.ts', craft)],
    custom: [file('pages/CustomPage.tsx', customPage), file('craft.ts', craft)],
} satisfies Record<string, CodeFile[]>;
