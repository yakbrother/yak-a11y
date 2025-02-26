import { checkAccessibility } from './index.js';

function getLocalUrl(config) {
  const host = config.server?.host ?? 'localhost';
  const port = config.server?.port ?? 4321;
  return `http://${host}:${port}`;
}

async function runAccessibilityCheck(config, logging = true) {
  const url = getLocalUrl(config);
  try {
    await checkAccessibility(url, {
      verbose: true,
      dynamicTesting: {
        enabled: true,
        waitForHydration: true,
        routeChanges: false, // Disable route changes during dev to avoid conflicts
        ajaxTimeout: 3000
      },
      astroTesting: {
        enabled: true,
        testIslands: true,
        frameworks: ['react', 'vue', 'svelte'],
        autoDetect: true
      }
    });
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
          // Start static server using sirv
          const { default: sirv } = await import('sirv');
          const { createServer } = await import('http');
          
          const PORT = 5555; // Use a different port to avoid conflicts
          const serve = sirv('dist', {
            single: true,
            dev: true,
            onNoMatch: (req, res) => {
              console.warn(`404: ${req.url}`);
              res.statusCode = 404;
              res.end('Not found');
            }
          });
          
          const server = createServer((req, res) => {
            try {
              serve(req, res);
            } catch (err) {
              console.error('Server error:', err);
              res.statusCode = 500;
              res.end('Internal server error');
            }
          });

          server.on('error', (err) => {
            console.error('Server error:', err);
          });

          await new Promise((resolve, reject) => {
            server.listen(PORT, (err) => {
              if (err) {
                console.error('Failed to start server:', err);
                reject(err);
                return;
              }
              console.log(`Static server running on port ${PORT}`);
              resolve();
            });
          });

          // Run checks
          // Wait for hydration
          await new Promise(resolve => setTimeout(resolve, 2000));

          await checkAccessibility('http://localhost:5555', {
            verbose: true,
            dynamicTesting: {
              enabled: true,
              waitForHydration: true,
              routeChanges: true,
              ajaxTimeout: 10000,
              hydrationTimeout: 10000
            },
            astroTesting: {
              enabled: true,
              testIslands: true,
              frameworks: ['react', 'vue', 'svelte'],
              autoDetect: true
            }
          });

          // Stop server
          await new Promise(resolve => server.close(resolve));

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
