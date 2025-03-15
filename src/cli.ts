#!/usr/bin/env node

import { checkAccessibility, checkStaticHTML } from './index';

const args = process.argv.slice(2);
const options = {
  file: [] as string[],
  url: '',
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--file':
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.file.push(args[++i]);
      }
      break;
    case '--url':
      if (i + 1 < args.length) {
        options.url = args[++i];
      }
      break;
    case '--verbose':
      options.verbose = true;
      break;
    default:
      if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
      }
      break;
  }
}

if (!options.file.length && !options.url) {
  console.error('Please provide either a file path (--file) or URL (--url)');
  process.exit(1);
}

async function main() {
  try {
    if (options.url) {
      await checkAccessibility(options.url, { verbose: options.verbose });
    }
    if (options.file.length) {
      for (const file of options.file) {
        await checkStaticHTML(file, { verbose: options.verbose });
      }
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
