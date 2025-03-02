import { describe, it, expect, vi, beforeEach } from 'vitest';
import { program } from '../bin/cli.js';
import { checkAccessibility } from '../src/index.js';

vi.mock('../src/index.js', () => ({
  checkAccessibility: vi.fn()
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Mock process.exit to prevent Commander from exiting
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
  return () => mockExit.mockRestore();
});

// Mock the action handler
program.action(() => {});

describe('CLI', () => {
  it('should have the correct version', () => {
    expect(program.version()).toBe('1.0.0');
  });

  it('should have required options', () => {
    const options = program.opts();
    expect(options).toHaveProperty('verbose');
    expect(options).toHaveProperty('skipDynamic');
    expect(options).toHaveProperty('skipAstro');
    expect(options).toHaveProperty('hydrationTimeout');
    expect(options).toHaveProperty('frameworks');
    expect(options).toHaveProperty('autoDetect');
  });

  it('should handle URL argument', () => {
    const url = 'http://example.com';
    const args = program.parse(['node', 'cli.js', url], { from: 'user' }).args;
    expect(args[0]).toBe(url);
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
