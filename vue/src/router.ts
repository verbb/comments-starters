import { onMounted, onUnmounted, readonly, ref, type Ref } from 'vue';

/**
 * Two pages don't need a router library. Paths are relative to Vite's base, which is `/vue/` when
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

export function usePath(): Readonly<Ref<string>> {
    const path = ref(currentPath());
    const update = () => {
        path.value = currentPath();
    };

    onMounted(() => window.addEventListener('popstate', update));
    onUnmounted(() => window.removeEventListener('popstate', update));

    return readonly(path);
}
