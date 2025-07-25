#!/usr/bin/env node
import { checkAccessibility, checkStaticHTML } from "./index.js";
const args = process.argv.slice(2);
const options = {
    file: [],
    url: "",
    verbose: false,
};
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
        case "--file":
            while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
                options.file.push(args[++i]);
            }
            break;
        case "--url":
            if (i + 1 < args.length) {
                options.url = args[++i];
            }
            break;
        case "--verbose":
            options.verbose = true;
            break;
        case "--help":
        case "-h":
            console.log(`
yak-a11y - Comprehensive accessibility checker

Usage:
  yak-a11y --url <url>           Check accessibility of a live URL
  yak-a11y --file <file...>      Check accessibility of static HTML files
  
Options:
  --url <url>                    URL to check (e.g., http://localhost:3000)
  --file <file...>               One or more HTML files to check
  --verbose                      Show detailed violation information
  --help, -h                     Show this help message

Examples:
  yak-a11y --url http://localhost:3000/page.html
  yak-a11y --file index.html about.html --verbose
  yak-a11y --file dist/*.html

For more information, visit: https://github.com/yakbrother/yak-a11y
`);
            process.exit(0);
            break;
        default:
            if (arg.startsWith("--")) {
                console.error(`Unknown option: ${arg}`);
                console.error("Use --help for usage information");
                process.exit(1);
            }
            break;
    }
}
if (!options.file.length && !options.url) {
    console.error("Please provide either a file path (--file) or URL (--url)");
    process.exit(1);
}
async function main() {
    try {
        if (options.url) {
            await checkAccessibility(options.url, { verbose: options.verbose });
        }
        if (options.file.length) {
            // Process files in parallel for better performance
            const filePromises = options.file.map((file) => checkStaticHTML(file, { verbose: options.verbose }));
            await Promise.all(filePromises);
        }
    }
    catch (error) {
        console.error("Error:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map