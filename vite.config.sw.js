import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    build: {
        outDir: 'public',
        emptyOutDir: false,
        sourcemap: false,
        rollupOptions: {
            input: path.resolve(__dirname, 'app/resources/js/offline/service-worker.js'),
            output: {
                entryFileNames: 'service-worker.js',
            },
        },
    },
    plugins: [],
});