import { defineConfig } from 'vite';

// Static-runnable output (tech-stack §제약): relative base so game/ opens from any host.
export default defineConfig({
  base: './',
  server: { port: 5199, strictPort: true, host: true },
  build: { target: 'es2020', outDir: 'dist' },
});
