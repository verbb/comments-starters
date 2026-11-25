import { useEffect, useState } from 'react';

/**
 * Two pages don't need a router library. Paths are relative to Vite's base, which is `/react/` when
 * the built app is served from the Craft site.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function currentPath(): string {
    const path = window.location.pathname.slice(base.length) || '/';

    return path.replace(/\/$/, '') || '/';
}

export function href(path: string): string {
    return `${base}${path}`;
}

export function navigate(path: string): void {
    window.history.pushState(null, '', href(path));
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export function usePath(): string {
    const [path, setPath] = useState(currentPath);

    useEffect(() => {
        const update = () => setPath(currentPath());
        window.addEventListener('popstate', update);

        return () => window.removeEventListener('popstate', update);
    }, []);

    return path;
}
