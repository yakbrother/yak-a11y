import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { generateReport } from '../../src/utils/reporter.js';
import chalk from 'chalk';
import type { Result } from 'axe-core';

describe('reporter', () => {
  let consoleOutput: string[] = [];
  const mockLog = vi.fn((...args: any[]) => consoleOutput.push(args.join(' ')));
  const originalLog = console.log;
  
  beforeAll(() => {
    originalLog = console.log;
    console.log = mockLog;
    chalk.level = 0; // Disable colors for testing
  });

  beforeEach(() => {
    consoleOutput = [];
    mockLog.mockClear();
  });

  afterAll(() => {
    console.log = originalLog; // Restore original console.log
  });

  it('should report no violations correctly', async () => {
    const results = { violations: [] };
    await generateReport(results);
    expect(consoleOutput[0]).toContain('No accessibility violations found');
  });

  const mockViolation: Result = {
    id: 'image-alt',
    impact: 'critical',
    help: 'Images must have alternate text',
    nodes: [{
      html: '<img src="test.jpg">',
      failureSummary: 'Fix any of the following: Element does not have an alt attribute'
    }],
    tags: ['wcag2a'],
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt'
  };

  it('should format violations with correct colors', async () => {
    const results = {
      violations: [mockViolation]
    };

    await generateReport(results);
    
    // Check for the presence of key content without relying on colors
    const outputString = consoleOutput.join('\n');
    expect(outputString).toContain('1 accessibility violation found');
    expect(outputString).toContain('Images must have alternate text');
    expect(outputString).toContain('Priority:');
    expect(outputString).toContain('Critical - Must Fix');
  });

  it('should include documentation links in verbose mode', async () => {
    const results = {
      violations: [mockViolation]
    };

    await generateReport(results, { verbose: true });
    
    expect(consoleOutput.some(output =>
      output.includes('Detailed Documentation')
    )).toBe(true);
  });

  it('should handle violations without html snippets', async () => {
    const results = {
      violations: [
        {
          ...mockViolation,
          nodes: [
            {
              failureSummary: 'Fix any of the following: Element does not have an alt attribute'
            }
          ]
        }
      ]
    };

    await generateReport(results);

    const outputString = consoleOutput.join('\n');
    expect(outputString).toContain('Unknown element');
  });
});
