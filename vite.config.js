import { defineConfig } from 'vite';
// base './' — сайт работает по любому адресу (GitHub Pages: /Bible.vidget/, свой домен, localhost)
export default defineConfig({ base: './', build: { target: 'es2020', chunkSizeWarningLimit: 600 }, test: { include: ['tests/*.test.js'] } });
