const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const { generateReport } = require('./utils/reporter');

async function waitForHydration(page, timeout) {
  try {
    // Wait for Astro's hydration event
    await page.waitForFunction(
      () => document.documentElement.dataset.hydrated === 'true',
      { timeout }
    );
  } catch (error) {
    console.warn('Warning: Hydration timeout - some components may not be fully interactive');
  }
}

async function detectFrameworks(page) {
  return await page.evaluate(() => {
    const frameworks = new Set();
    
    // Check for React
    if (
      document.querySelector('[data-astro-client="react"]') ||
      window.React ||
      document.querySelector('[data-reactroot]') ||
      Array.from(document.scripts).some(script => 
        script.src && (script.src.includes('react') || script.textContent.includes('React'))
      )
    ) {
      frameworks.add('react');
    }
    
    return Array.from(frameworks);
  });
}

async function findAstroIslands(page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-astro-cid]'))
      .map(el => ({
        cid: el.dataset.astroCid,
        framework: el.dataset.astroClient,
        html: el.outerHTML
      }));
  });
}

async function testDynamicContent(page, options) {
  const violations = [];
  
  if (options.waitForHydration) {
    await waitForHydration(page, options.ajaxTimeout);
  }

  // Test after simulated user interactions
  await page.evaluate(() => {
    // Simulate clicks on buttons
    document.querySelectorAll('button').forEach(btn => btn.click());
    // Trigger input events
    document.querySelectorAll('input').forEach(input => {
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
    });
  });

  // Wait for any AJAX updates
  await page.waitForTimeout(1000);

  // Run accessibility check after interactions
  const results = await new AxePuppeteer(page).analyze();
  violations.push(...results.violations);

  if (options.routeChanges) {
    // Test client-side navigation
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/"]')).map(a => a.href)
    );

    for (const link of links) {
      await page.click(`a[href="${new URL(link).pathname}"]`);
      await page.waitForTimeout(1000);
      const results = await new AxePuppeteer(page).analyze();
      violations.push(...results.violations);
    }
  }

  return violations;
}

async function testAstroComponents(page, options) {
  const violations = [];
  
  if (options.testIslands) {
    const islands = await findAstroIslands(page);
    
    for (const island of islands) {
      if (options.frameworks.includes(island.framework)) {
        // Test the island in isolation
        await page.evaluate((html) => {
          const container = document.createElement('div');
          container.innerHTML = html;
          document.body.appendChild(container);
          return container;
        }, island.html);

        const results = await new AxePuppeteer(page).analyze();
        violations.push(...results.violations.map(v => ({
          ...v,
          component: `Astro Island (${island.framework}): ${island.cid}`
        })));
      }
    }
  }

  return violations;
}

async function checkAccessibility(url, options = {}) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(url);
    let violations = [];

    // Detect frameworks in use
    const detectedFrameworks = await detectFrameworks(page);
    
    // Update testing options based on detected frameworks
    if (options.astroTesting?.enabled) {
      options.astroTesting.frameworks = options.astroTesting.frameworks.filter(fw => 
        detectedFrameworks.includes(fw)
      );
    }

    // Initial static content check
    const initialResults = await new AxePuppeteer(page).analyze();
    violations.push(...initialResults.violations);

    // Dynamic content testing
    if (options.dynamicTesting?.enabled) {
      const dynamicViolations = await testDynamicContent(page, options.dynamicTesting);
      violations.push(...dynamicViolations);
    }

    // Astro-specific testing
    if (options.astroTesting?.enabled && options.astroTesting.frameworks.length > 0) {
      const astroViolations = await testAstroComponents(page, options.astroTesting);
      violations.push(...astroViolations);
    }

    // Deduplicate violations
    violations = violations.filter((v, i, self) =>
      i === self.findIndex(t => t.id === v.id && t.html === v.html)
    );

    await generateReport({ violations }, options);
  } catch (error) {
    console.error('Error during accessibility check:', error);
  } finally {
    await browser.close();
  }
}

module.exports = { checkAccessibility };
