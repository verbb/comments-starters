import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const config: NextConfig = {
    // This app is its own project, whatever lockfiles sit in the folders above it.
    turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
};

export default config;
