import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
    plugins: [
        laravel({
            input: 'app/resources/js/app.js',
            refresh: true,
        }),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        vueDevTools({
            appendTo: 'app/resources/js/app.js',
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'app/resources/views'),
        },
    },
    build: {
        outDir: 'public/build',
        assetsDir: 'assets',
    },
});