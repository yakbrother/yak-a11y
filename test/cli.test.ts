import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxeResults } from 'axe-core';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  default: { readFile: vi.fn() }
}));

// Mock process.exit
// Use mockImplementation instead of just mocking to prevent test failures
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  // This prevents the actual exit but still allows the test to verify it was called
  return undefined as never;
});

// Create mock functions that we'll use in tests
const mockCheckAccessibility = vi.fn();
const mockCheckStaticHTML = vi.fn();

// Mock index.ts
vi.mock('../src/index', async () => {
  const mockAxeResults = {
    violations: [{
      id: 'image-alt',
      impact: 'critical',
      help: 'Images must have alternate text',
      nodes: [{
        html: '<img src="test.jpg">',
        target: ['img'],
        impact: 'critical',
        any: [{
          id: 'has-alt',
          data: null,
          relatedNodes: [],
          impact: 'critical',
          message: 'Element does not have an alt attribute'
        }],
        all: [],
        none: []
      }],
      tags: ['wcag2a'],
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt',
      description: 'Ensures <img> elements have alternate text or a role of none or presentation'
    }],
    passes: [],
    timestamp: new Date().toISOString(),
    url: 'test.html'
  };

  mockCheckAccessibility.mockResolvedValue(mockAxeResults);
  mockCheckStaticHTML.mockResolvedValue({
    violations: [],
    passes: [],
    timestamp: new Date().toISOString(),
    url: 'test.html'
  });

  return {
    checkAccessibility: mockCheckAccessibility,
    checkStaticHTML: mockCheckStaticHTML
  };
});

// We'll use these mock functions directly in our tests
// This avoids the need to import from '../src/index' which might cause issues
// with the mocking in an ESM environment

describe('CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.argv = ['node', 'cli.js']; // Reset argv
    // Reset the module cache to ensure we get a fresh import each time
    vi.resetModules();
  });

  it('should display help message when no arguments provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error');
    process.argv = ['node', 'cli.js'];
    await import('../src/cli');
    expect(consoleSpy).toHaveBeenCalledWith('Please provide either a file path (--file) or URL (--url)');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle static HTML file analysis', async () => {
    process.argv = ['node', 'cli.js', '--file', 'test.html'];
    await import('../src/cli');
    expect(mockCheckStaticHTML).toHaveBeenCalledWith('test.html', expect.any(Object));
  });

  it('should handle URL analysis', async () => {
    process.argv = ['node', 'cli.js', '--url', 'http://example.com'];
    await import('../src/cli');
    expect(mockCheckAccessibility).toHaveBeenCalledWith('http://example.com', expect.any(Object));
  });

  it('should handle verbose mode', async () => {
    process.argv = ['node', 'cli.js', '--url', 'http://example.com', '--verbose'];
    await import('../src/cli');
    expect(mockCheckAccessibility).toHaveBeenCalledWith('http://example.com', expect.objectContaining({
      verbose: true
    }));
  });

  it('should handle invalid arguments', async () => {
    process.argv = ['node', 'cli.js', '--invalid', 'option'];
    const consoleErrorSpy = vi.spyOn(console, 'error');
    await import('../src/cli');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown option: --invalid'));
  });

  it('should handle multiple files', async () => {
    process.argv = ['node', 'cli.js', '--file', 'test1.html', 'test2.html'];
    await import('../src/cli');
    expect(mockCheckStaticHTML).toHaveBeenCalledTimes(2);
  });
});
