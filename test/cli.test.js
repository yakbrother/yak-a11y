import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { checkAccessibility } from '../src/index.js';

vi.mock('../src/index.js', () => ({
  checkAccessibility: vi.fn()
}));

let program;

beforeEach(() => {
  vi.clearAllMocks();
  // Create a new program instance for each test
  program = new Command();
  program
    .version('1.0.0')
    .description('Check accessibility of Astro pages')
    .argument('<url>', 'URL to check')
    .option('-v, --verbose', 'Show detailed information')
    .option('--skip-dynamic', 'Skip dynamic content testing')
    .option('--skip-astro', 'Skip Astro-specific component testing')
    .option('--hydration-timeout <ms>', 'Set maximum wait time for hydration', '5000')
    .option('--frameworks <list>', 'Specify frameworks to test (comma-separated)', 'react,vue')
    .option('--auto-detect', 'Auto-detect frameworks and skip tests for unused ones', true);
});

describe('CLI', () => {
  it('should have the correct version', () => {
    expect(program.version()).toBe('1.0.0');
  });

  it('should have required options', () => {
    program.parse(['node', 'cli.js', 'http://example.com'], { from: 'user' });
    const options = program.opts();
    expect(options).toHaveProperty('hydrationTimeout', '5000');
    expect(options).toHaveProperty('frameworks', 'react,vue');
    expect(options).toHaveProperty('autoDetect', true);
  });

  it('should handle URL argument', () => {
    const url = 'http://example.com';
    let capturedUrl;
    let capturedOptions;

    // Add the action handler for this test
    program
      .action((urlArg, options) => {
        capturedUrl = urlArg;
        capturedOptions = options;
      });
    
    // Parse with the test arguments
    program.parseAsync([url], { from: 'user' });
    
    // Verify the URL was captured correctly
    expect(capturedUrl).toBe(url);
  });

  it('should handle verbose flag', () => {
    program.parse(['node', 'cli.js', 'http://example.com', '--verbose'], { from: 'user' });
    const options = program.opts();
    expect(options.verbose).toBe(true);
  });

  it('should handle framework options', () => {
    program.parse(['node', 'cli.js', 'http://example.com', '--frameworks', 'react,vue'], { from: 'user' });
    const options = program.opts();
    expect(options.frameworks).toBe('react,vue');
  });

  it('should handle hydration timeout', () => {
    program.parse(['node', 'cli.js', 'http://example.com', '--hydration-timeout', '10000'], { from: 'user' });
    const options = program.opts();
    expect(options.hydrationTimeout).toBe('10000');
  });
});
