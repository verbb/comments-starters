import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [tailwindcss()],
    // Two pages: the thread Comments draws, and the same thread drawn by the page's own code.
    build: {
        rolldownOptions: {
            input: {
                main: fileURLToPath(new URL('index.html', import.meta.url)),
                custom: fileURLToPath(new URL('custom.html', import.meta.url)),
            },
        },
    },
    server: {
        port: 5275,
        strictPort: true,
    },
    preview: {
        port: 4275,
        strictPort: true,
    },
});
