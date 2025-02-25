import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import accessibility from '../src/integration.js';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    accessibility({
      enableDevChecks: true,
      enableBuildChecks: true,
      failOnErrors: true,
      checkInterval: 3000, // Check every 3 seconds during dev
      // Test both normal and force build scenarios
      forceBuild: process.env.FORCE_BUILD === 'true'
    })
  ],
  server: {
    port: 4321
  }
});
