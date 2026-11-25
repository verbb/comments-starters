import type { ViewerData } from '@verbb/comments-core';

/**
 * Who's reading, as the thread's `viewer` read last said. The thread sets it, and the header shows
 * it. It's null until a thread has loaded in the browser, since nothing personal is read on the server.
 */
export function useViewer() {
    return useState<ViewerData | null>('comments-viewer', () => null);
}
