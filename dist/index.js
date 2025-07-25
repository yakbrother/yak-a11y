import { generateReport } from "./utils/reporter.js";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { readFile } from "fs/promises";
// Global browser instance for connection pooling
let globalBrowser = null;
let browserReuseCount = 0;
const MAX_BROWSER_REUSE = 10; // Restart browser after 10 uses to prevent memory leaks
// These will be initialized in an async context
let puppeteer;
let AxePuppeteer;
// Cache for compiled axe configuration
let axeConfigCache = null;
// Initialize dependencies with caching
async function initDependencies() {
    if (!puppeteer) {
        const [puppeteerModule, axePuppeteerModule] = await Promise.all([
            import("puppeteer"),
            import("@axe-core/puppeteer"),
        ]);
        puppeteer = puppeteerModule.default;
        AxePuppeteer = axePuppeteerModule.AxePuppeteer;
    }
}
// Get or create browser instance with connection pooling
async function getBrowser() {
    await initDependencies();
    if (globalBrowser && browserReuseCount < MAX_BROWSER_REUSE) {
        browserReuseCount++;
        return globalBrowser;
    }
    // Close existing browser if reuse limit reached
    if (globalBrowser) {
        await globalBrowser.close().catch(() => { }); // Ignore errors
    }
    globalBrowser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage", // Reduces memory usage
            "--disable-gpu",
            "--no-first-run",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
        ],
    });
    browserReuseCount = 1;
    return globalBrowser;
}
// Cleanup function for browser
async function cleanupBrowser() {
    if (globalBrowser) {
        await globalBrowser.close().catch(() => { });
        globalBrowser = null;
        browserReuseCount = 0;
    }
}
// Get cached axe configuration
function getAxeConfig() {
    if (!axeConfigCache) {
        axeConfigCache = {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
            },
            reporter: "v2",
        };
    }
    return axeConfigCache;
}
async function checkStaticHTML(filePath, options = {}) {
    try {
        const html = await readFile(filePath, "utf-8");
        const dom = new JSDOM(html, {
            resources: "usable",
            runScripts: "dangerously",
            // Disable canvas to prevent JSDOM warnings
            pretendToBeVisual: false,
            virtualConsole: new JSDOM().window.console,
        });
        const { window } = dom;
        const { document } = window;
        // Stub canvas methods to prevent errors
        if (window.HTMLCanvasElement) {
            window.HTMLCanvasElement.prototype.getContext = () => null;
        }
        // Configure axe
        axe.configure({
            allowedOrigins: ["<unsafe_all_origins>"],
            branding: {
                application: "yak-a11y",
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
    }
    catch (error) {
        console.error("Error during static HTML analysis:", error);
        throw error; // Propagate the error instead of catching it
    }
}
async function waitForHydration(page, timeout) {
    try {
        // Wait for Astro's hydration event with reduced timeout
        await page.waitForFunction(() => document.documentElement.dataset.hydrated === "true", { timeout });
        // Reduced delay for faster processing
        await new Promise((resolve) => setTimeout(resolve, 100));
        return true;
    }
    catch (error) {
        console.warn("Warning: Hydration timeout - some components may not be fully interactive");
        return false;
    }
}
async function detectFrameworks(page) {
    // Wait for page to be fully loaded and scripts to execute
    await page.waitForFunction(() => document.readyState === "complete" &&
        performance.timing.domContentLoadedEventEnd > 0, { timeout: 10000 });
    // Add a small delay to ensure async scripts have time to initialize
    await new Promise((resolve) => setTimeout(resolve, 500));
    return await page.evaluate(() => {
        const frameworks = new Set();
        // Check for React with more robust detection
        if (document.querySelector('[data-astro-client="react"]') ||
            window.React ||
            document.querySelector("[data-reactroot]") ||
            Array.from(document.scripts).some((script) => script.src &&
                (script.src.includes("react") ||
                    script.textContent?.includes("React"))) ||
            // Additional checks for React-specific DOM attributes
            document.querySelector("[data-reactid]") ||
            document.querySelector("[data-react-checksum]")) {
            frameworks.add("react");
        }
        // Add checks for other frameworks as needed
        return Array.from(frameworks);
    });
}
async function findAstroIslands(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll("[data-astro-cid]")).map((el) => ({
            cid: el.dataset.astroCid || "",
            framework: el.dataset.astroClient || "",
            html: el.outerHTML,
        }));
    });
}
async function testDynamicContent(page, options) {
    const violations = [];
    // Ensure dependencies are initialized
    await initDependencies();
    if (options.waitForHydration) {
        const hydrated = await waitForHydration(page, options.ajaxTimeout || 5000);
        if (!hydrated && options.strict) {
            throw new Error("Hydration failed and strict mode is enabled");
        }
    }
    // Test after simulated user interactions with proper sequencing
    await page.evaluate(async () => {
        const interactionPromises = [];
        // Create a promise for each button click
        document.querySelectorAll("button").forEach((btn) => {
            const promise = new Promise((resolve) => {
                // Use requestAnimationFrame to ensure the DOM has time to update
                btn.addEventListener("click", () => {
                    requestAnimationFrame(() => setTimeout(resolve, 50));
                }, { once: true });
                btn.click();
            });
            interactionPromises.push(promise);
        });
        // Create a promise for each input event
        document.querySelectorAll("input").forEach((input) => {
            const promise = new Promise((resolve) => {
                input.addEventListener("change", () => {
                    requestAnimationFrame(() => setTimeout(resolve, 50));
                }, { once: true });
                input.dispatchEvent(new Event("input"));
                input.dispatchEvent(new Event("change"));
            });
            interactionPromises.push(promise);
        });
        // Wait for all interactions to complete
        await Promise.all(interactionPromises);
    });
    // Wait for any AJAX updates with a reasonable timeout
    await Promise.race([
        page.waitForNetworkIdle(),
        new Promise((resolve) => setTimeout(resolve, options.ajaxTimeout || 5000)),
    ]);
    // Add a small delay to ensure any final DOM updates
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Run accessibility check after interactions
    // Create the AxePuppeteer instance
    const axePuppeteerInstance = new AxePuppeteer(page);
    const results = await axePuppeteerInstance.analyze();
    violations.push(...results.violations);
    if (options.routeChanges) {
        // Test client-side navigation
        const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href^="/"]')).map((a) => a.href));
        for (const link of links) {
            try {
                await page.click(`a[href="${new URL(link).pathname}"]`);
                // Wait for navigation to complete with a timeout
                await Promise.race([
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                    new Promise((resolve) => setTimeout(resolve, options.ajaxTimeout || 5000)),
                ]);
                // Wait for any additional network activity to settle
                await page.waitForNetworkIdle();
                // Add a small delay to ensure DOM is stable
                await new Promise((resolve) => setTimeout(resolve, 100));
                const navResults = await new AxePuppeteer(page).analyze();
                violations.push(...navResults.violations);
            }
            catch (error) {
                console.warn(`Navigation error for link ${link}:`, error);
            }
        }
    }
    return violations;
}
async function testAstroComponents(page, options) {
    const violations = [];
    // Ensure dependencies are initialized
    await initDependencies();
    if (options.testIslands) {
        const islands = await findAstroIslands(page);
        for (const island of islands) {
            if (options.frameworks?.includes(island.framework)) {
                // Test the island in isolation
                const containerId = `island-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                await page.evaluate((html, id) => {
                    const container = document.createElement("div");
                    container.id = id;
                    container.innerHTML = html;
                    document.body.appendChild(container);
                    return container;
                }, island.html, containerId);
                // Wait for the island to be fully rendered and initialized
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Wait for any potential hydration or initialization
                try {
                    await page.waitForFunction((id) => {
                        const container = document.getElementById(id);
                        return (container && !container.querySelector('[aria-busy="true"]'));
                    }, { timeout: options.ajaxTimeout || 3000 }, containerId);
                }
                catch (error) {
                    console.warn(`Timeout waiting for island ${island.cid} to initialize`);
                }
                // Create the AxePuppeteer instance
                const axePuppeteerInstance = new AxePuppeteer(page);
                const results = await axePuppeteerInstance.analyze();
                violations.push(...results.violations.map((v) => ({
                    ...v,
                    component: `Astro Island (${island.framework}): ${island.cid}`,
                })));
                // Clean up - remove the container to avoid affecting subsequent tests
                await page.evaluate((id) => {
                    const container = document.getElementById(id);
                    if (container) {
                        container.remove();
                    }
                }, containerId);
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
        }
        catch (urlError) {
            throw new Error(`Invalid URL provided: "${url}"

To fix this:
1. Make sure your URL starts with http:// or https://
2. Check for any typos in the URL
3. If testing locally, use http://localhost:port
4. For file URLs, use http-server or a local development server
`);
        }
        // Initialize dependencies before using them
        await initDependencies();
        console.log("Starting accessibility check for:", url);
        // Get browser instance (don't store as we'll manage lifecycle elsewhere)
        const sharedBrowser = await getBrowser();
        browser = sharedBrowser;
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
        }
        catch (navigationError) {
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
            }
            else {
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
        // Create the AxePuppeteer instance
        const axePuppeteerInstance = new AxePuppeteer(page);
        // Configure axe-core options if the API supports it
        // Some versions use configure() instead of options()
        if (typeof axePuppeteerInstance.configure === "function") {
            axePuppeteerInstance.configure({
                runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
                },
                reporter: "v2",
            });
        }
        else if (typeof axePuppeteerInstance.options === "function") {
            axePuppeteerInstance.options({
                runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
                },
                reporter: "v2",
            });
        }
        // Run the analysis
        const results = await axePuppeteerInstance.analyze();
        await generateReport(results, options);
        return results;
    }
    catch (error) {
        // Only show the error message once
        const err = error;
        if (!err.message.includes("⚠️  Accessibility Check Error ⚠️")) {
            err.message = "⚠️  Accessibility Check Error ⚠️\n\n" + err.message;
        }
        if (!err.message.includes("To fix this:")) {
            err.message +=
                "\nTo get help:\n1. Check our troubleshooting guide in the README\n2. Open an issue on GitHub if the problem persists\n3. Make sure you have the latest version installed\n";
        }
        throw err;
    }
    finally {
        if (page) {
            await page.close();
        }
        // Don't close shared browser here - it's managed globally
    }
}
export { checkAccessibility, checkStaticHTML };
//# sourceMappingURL=index.js.map