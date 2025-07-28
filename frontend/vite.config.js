import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3010,
        hmr: {
            overlay: false,
            clientPort: 3010,
            host: 'localhost'
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3002',
                changeOrigin: true,
            },
        },
    },
    // Ensure proper handling of client-side routing in preview mode
    preview: {
        port: 3010,
    },
    // This is important for SPA routing - it tells Vite to serve index.html for any route
    appType: 'spa',
});
