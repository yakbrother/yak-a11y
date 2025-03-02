import { generateReport } from './utils/reporter.js';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function checkStaticHTML(filePath, options = {}) {
  try {
    const html = await readFile(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const window = dom.window;
    const document = window.document;

    // Configure axe
    axe.configure({
      allowedOrigins: ['<unsafe_all_origins>'],
      branding: {
        application: 'astro-accessibility'
      }
    });

    // Run axe
    const results = await axe.run(document.documentElement, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
      }
    });

    // Generate report
    await generateReport(results, options);

    // Clean up
    window.close();

    return { violations: results.violations };
  } catch (error) {
    console.error('Error during static HTML analysis:', error);
    throw error; // Propagate the error instead of catching it
  }
}

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
  let browser;
  let page;
  
  try {
    const { default: puppeteer } = await import('puppeteer');
    const { AxePuppeteer } = await import('@axe-core/puppeteer');
    
    console.log('Starting accessibility check for:', url);
    
    // Launch new browser instance
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    
    // Store the browser endpoint for potential reuse
    process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint();
    page = await browser.newPage();
    
    // Configure page settings
    await page.setBypassCSP(true);
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);
    
    // Navigate with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(url, { 
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout: 30000
        });
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
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
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

export { checkAccessibility, checkStaticHTML };
