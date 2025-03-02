import { describe, it, expect, vi } from 'vitest';
import { generateReport } from '../../src/utils/reporter.js';
import chalk from 'chalk';

describe('reporter', () => {
  // Mock console.log to capture output
  let consoleOutput = [];
  const mockLog = vi.fn((...args) => {
    const output = args.join(' ').replace(/\u001b\[.*?m/g, ''); // Remove ANSI color codes
    consoleOutput.push(output);
  });
  console.log = mockLog;

  beforeEach(() => {
    consoleOutput = [];
    mockLog.mockClear();
    chalk.level = 0; // Disable colors for testing
  });

  it('should report no violations correctly', async () => {
    const results = { violations: [] };
    await generateReport(results);
    expect(consoleOutput[0]).toContain('No accessibility violations found');
  });

  it('should format violations with correct colors', async () => {
    const results = {
      violations: [{
        id: 'image-alt',
        impact: 'critical',
        help: 'Images must have alternate text',
        nodes: [{
          html: '<img src="test.jpg">',
          failureSummary: 'Fix any of the following: Element does not have an alt attribute'
        }],
        tags: ['wcag2a'],
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt'
      }]
    };

    await generateReport(results);
    
    expect(consoleOutput.some(output => 
      output.includes('1 accessibility violations found')
    )).toBe(true);
    
    expect(consoleOutput.some(output => 
      output.includes('Images must have alternate text')
    )).toBe(true);
  });

  it('should include documentation links in verbose mode', async () => {
    const results = {
      violations: [{
        id: 'image-alt',
        impact: 'critical',
        help: 'Images must have alternate text',
        nodes: [{
          html: '<img src="test.jpg">',
          failureSummary: 'Fix any of the following: Element does not have an alt attribute'
        }],
        tags: ['wcag2a'],
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt'
      }]
    };

    await generateReport(results, { verbose: true });
    
    expect(consoleOutput.some(output => 
      output.includes('Detailed Documentation')
    )).toBe(true);
  });
});
