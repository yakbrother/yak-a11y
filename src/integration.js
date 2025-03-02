import { checkAccessibility } from './index.js';
import chalk from 'chalk';

function getLocalUrl(config = {}) {
  const host = config?.server?.host ?? 'localhost';
  const port = config?.server?.port ?? 4321;
  return `http://${host}:${port}`;
}

async function runAccessibilityCheck(config, logging = true) {
  const url = getLocalUrl(config);
  try {
    // First try static HTML check
    const response = await fetch(url);
    const html = await response.text();
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html);
    const window = dom.window;
    const document = window.document;

    // Configure axe with JSDOM globals
    global.window = window;
    global.document = document;

    const axe = (await import('axe-core')).default;
    const results = await axe.run(document);

    if (logging) {
      const { generateReport } = await import('./utils/reporter.js');
      console.log(generateReport(results, {
        verbose: true,
        includeHtml: true,
        includePassing: false
      }));
    }

    // Try dynamic check if available
    try {
      await checkAccessibility(url, {
        verbose: true,
        dynamicTesting: {
          enabled: true,
          waitForHydration: true,
          routeChanges: false,
          ajaxTimeout: 3000
        },
        astroTesting: {
          enabled: true,
          testIslands: true,
          frameworks: ['react', 'vue', 'svelte'],
          autoDetect: true
        }
      });
    } catch (dynamicError) {
      console.log('Dynamic testing failed:', dynamicError.message);
    }
  } catch (error) {
    if (logging) {
      console.error('Accessibility check failed:', error);
    }
  }
}

function astroAccessibility(options = {}) {
  const defaultOptions = {
    enableDevChecks: true,     // Run during development
    enableBuildChecks: true,   // Run during build
    failOnErrors: false,       // Don't fail build by default
    forceBuild: false,        // DANGER: Set to true to build even with violations (NOT RECOMMENDED)
    checkInterval: 5000,       // Check every 5 seconds during dev
  };

  const finalOptions = { ...defaultOptions, ...options };
  let checkTimeout;

  return {
    name: 'astro-accessibility',
    hooks: {
      'astro:server:setup': async ({ server, config }) => {
        if (!finalOptions.enableDevChecks) return;

        // Initial check when server starts
        await runAccessibilityCheck(config);

        // Set up periodic checks during development
        server.watcher.on('change', async () => {
          // Clear existing timeout to avoid multiple simultaneous checks
          if (checkTimeout) clearTimeout(checkTimeout);
          
          // Set new timeout for the check
          checkTimeout = setTimeout(async () => {
            await runAccessibilityCheck(config);
          }, finalOptions.checkInterval);
        });
      },

      'astro:build:done': async ({ config, pages }) => {
        if (!finalOptions.enableBuildChecks) return;

        console.log('\nRunning accessibility checks on built site...');
        let hasViolations = false;
        try {
          const { checkStaticHTML } = await import('./index.js');
          const { join } = await import('path');
          
          // Check each built page
          for (const page of pages) {
            const filePath = join('dist', page.pathname === '' ? 'index.html' : page.pathname + '/index.html');
            console.log(`\nChecking ${page.pathname || 'index.html'}...`);
            
            const violations = await checkStaticHTML(filePath, {
              verbose: true,
              astroTesting: {
                enabled: true,
                frameworks: ['react', 'vue', 'svelte'],
                autoDetect: true
              }
            });
            
            if (violations.length > 0) {
              hasViolations = true;
            }
          }

        } catch (error) {
          console.error('Build-time accessibility check failed:', error);
          hasViolations = true;
          if (finalOptions.failOnErrors && !finalOptions.forceBuild) {
            throw new Error('Accessibility checks failed. Use forceBuild: true to bypass (NOT RECOMMENDED)');
          } else if (finalOptions.forceBuild) {
            console.warn(chalk.yellow.bold('\n⚠️  WARNING: Building with accessibility violations!'));
            console.warn(chalk.yellow('This is strongly discouraged as it may make your site unusable for some visitors.'));
            console.warn(chalk.yellow('Please fix the accessibility issues as soon as possible.\n'));
          }
        }
      }
    }
  };
}

export default astroAccessibility;
