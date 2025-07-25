#!/usr/bin/env node
// @ts-check
// @type {module}

import { Command } from "commander";
import { checkAccessibility } from "../dist/index.js";

const program = new Command();

program
  .version("1.0.0")
  .description("Check accessibility of Astro pages")
  .argument("<url>", "URL to check")
  .option("-v, --verbose", "Show detailed information")
  .option("--skip-dynamic", "Skip dynamic content testing")
  .option("--skip-astro", "Skip Astro-specific component testing")
  .option(
    "--hydration-timeout <ms>",
    "Set maximum wait time for hydration",
    "5000",
  )
  .option(
    "--frameworks <list>",
    "Specify frameworks to test (comma-separated)",
    "react,vue",
  )
  .option(
    "--auto-detect",
    "Auto-detect frameworks and skip tests for unused ones",
    true,
  )
  .action((url, options) => {
    // Convert CLI options to configuration object
    const config = {
      verbose: options.verbose,
      dynamicTesting: {
        enabled: !options.skipDynamic,
        waitForHydration: !options.skipDynamic,
        routeChanges: !options.skipDynamic,
        ajaxTimeout: parseInt(options.hydrationTimeout, 10),
      },
      astroTesting: {
        enabled: !options.skipAstro,
        testIslands: !options.skipAstro,
        frameworks: options.frameworks.split(","),
        ignoreHydrating: false,
        autoDetect: options.autoDetect,
      },
    };

    if (options.verbose) {
      console.log("Configuration:", JSON.stringify(config, null, 2));
      if (options.autoDetect) {
        console.log(
          "Framework auto-detection is enabled. Tests will be skipped for frameworks not in use.",
        );
      }
    }

    checkAccessibility(url, config);
  });

program.parse(process.argv);
