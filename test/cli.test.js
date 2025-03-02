import { describe, it, expect, vi } from 'vitest';
import { program } from '../bin/cli.js';

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
    program.parse(['node', 'cli.js', url]);
    expect(program.args[0]).toBe(url);
  });

  it('should handle verbose flag', () => {
    program.parse(['node', 'cli.js', 'http://example.com', '--verbose']);
    const options = program.opts();
    expect(options.verbose).toBe(true);
  });

  it('should handle framework options', () => {
    program.parse(['node', 'cli.js', 'http://example.com', '--frameworks', 'react,vue']);
    const options = program.opts();
    expect(options.frameworks).toBe('react,vue');
  });

  it('should handle hydration timeout', () => {
    program.parse(['node', 'cli.js', 'http://example.com', '--hydration-timeout', '10000']);
    const options = program.opts();
    expect(options.hydrationTimeout).toBe('10000');
  });
});
