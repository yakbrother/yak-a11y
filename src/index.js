import { generateReport } from "./utils/reporter.js";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { readFile } from "fs/promises";
import { join } from "path";

async function checkStaticHTML(filePath, options = {}) {
  try {
    const html = await readFile(filePath, "utf-8");
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;

    // Configure axe
    axe.configure({
      allowedOrigins: ["<unsafe_all_origins>"],
      branding: {
        application: "astro-accessibility",
      },
    });

    // Run axe
    const results = await axe.run(document.documentElement, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
    });

    // Generate report
    await generateReport(results, options);

    // Clean up
    window.close();

    return { violations: results.violations };
  } catch (error) {
    console.error("Error during static HTML analysis:", error);
    throw error; // Propagate the error instead of catching it
  }
}

async function waitForHydration(page, timeout) {
  try {
    // Wait for Astro's hydration event
    await page.waitForFunction(
      () => document.documentElement.dataset.hydrated === "true",
      { timeout },
    );
  } catch (error) {
    console.warn(
      "Warning: Hydration timeout - some components may not be fully interactive",
    );
  }
}

async function detectFrameworks(page) {
  return await page.evaluate(() => {
    const frameworks = new Set();

    // Check for React
    if (
      document.querySelector('[data-astro-client="react"]') ||
      window.React ||
      document.querySelector("[data-reactroot]") ||
      Array.from(document.scripts).some(
        (script) =>
          script.src &&
          (script.src.includes("react") ||
            script.textContent.includes("React")),
      )
    ) {
      frameworks.add("react");
    }

    return Array.from(frameworks);
  });
}

async function findAstroIslands(page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("[data-astro-cid]")).map(
      (el) => ({
        cid: el.dataset.astroCid,
        framework: el.dataset.astroClient,
        html: el.outerHTML,
      }),
    );
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
    document.querySelectorAll("button").forEach((btn) => btn.click());
    // Trigger input events
    document.querySelectorAll("input").forEach((input) => {
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(new Event("change"));
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
      Array.from(document.querySelectorAll('a[href^="/"]')).map((a) => a.href),
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
          const container = document.createElement("div");
          container.innerHTML = html;
          document.body.appendChild(container);
          return container;
        }, island.html);

        const results = await new AxePuppeteer(page).analyze();
        violations.push(
          ...results.violations.map((v) => ({
            ...v,
            component: `Astro Island (${island.framework}): ${island.cid}`,
          })),
        );
      }
    }
  }

  return violations;
}

async function checkAccessibility(url, options = {}) {
  let browser;
  let page;

  try {
    // Validate URL before proceeding
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch (urlError) {
      throw new Error(`Invalid URL provided: "${url}"

To fix this:
1. Make sure your URL starts with http:// or https://
2. Check for any typos in the URL
3. If testing locally, use http://localhost:port
4. For file URLs, use http-server or a local development server
`);
    }

    const { default: puppeteer } = await import("puppeteer");
    const { AxePuppeteer } = await import("@axe-core/puppeteer");

    console.log("Starting accessibility check for:", url);

    // Launch new browser instance
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });

    // Create new page and set timeouts
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);

    // Navigate to URL
    try {
      await page.goto(url, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });
    } catch (navigationError) {
      let errorMessage = `\n⚠️  Accessibility Check Error ⚠️\n\nCould not access "${url}"\n`;

      if (url.startsWith("http://localhost")) {
        errorMessage += "\nPossible reasons:\n";
        errorMessage += "1. The development server is not running\n";
        errorMessage += "2. The port number is incorrect\n";
        errorMessage += "3. The server is running but not responding\n\n";
        errorMessage += "To fix this:\n";
        errorMessage +=
          "1. Start your development server (e.g., npm run dev)\n";
        errorMessage +=
          "2. Ensure the port matches your server configuration\n";
        errorMessage += "3. Wait a few seconds for the server to be ready\n";
      } else {
        errorMessage += "\nPossible reasons:\n";
        errorMessage += "1. The website is offline or unreachable\n";
        errorMessage += "2. The URL is incorrect\n";
        errorMessage += "3. Your internet connection is not working\n";
        errorMessage += "4. The site is blocking automated access\n\n";
        errorMessage += "To fix this:\n";
        errorMessage += "1. Check if you can access the site in your browser\n";
        errorMessage += "2. Verify the URL is correct\n";
        errorMessage += "3. Check your internet connection\n";
      }

      throw new Error(errorMessage);
    }

    // Run accessibility tests
    const results = await new AxePuppeteer(page).analyze();
    await generateReport(results, options);
    return results;
  } catch (error) {
    // Only show the error message once
    if (!error.message.includes("⚠️  Accessibility Check Error ⚠️")) {
      console.error("⚠️  Accessibility Check Error ⚠️\n");
    }
    console.error(error.message);

    if (!error.message.includes("To fix this:")) {
      console.error(
        "\nTo get help:\n1. Check our troubleshooting guide in the README\n2. Open an issue on GitHub if the problem persists\n3. Make sure you have the latest version installed\n",
      );
    }
    process.exit(1);
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

export { checkAccessibility, checkStaticHTML };
