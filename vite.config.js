import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const vitePort = env.VITE_PORT ? Number(env.VITE_PORT) : 5173;

    return {
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
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: [
                        'import',
                        'mixed-decls',
                        'color-functions',
                        'global-builtin',
                    ],
                },
            },
        },
        server: {
            port: vitePort,
        },
    };
});