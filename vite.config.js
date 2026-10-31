import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served as a GitHub Pages project site at https://1oh1designllc.github.io/cut-shop/
// If the repo is renamed or moved to a custom domain, change `base` to match
// ('/<new-repo-name>/' or '/' for a custom domain).
export default defineConfig({
  base: '/cut-shop/',
  plugins: [react()],
  build: { outDir: 'dist' },
});
