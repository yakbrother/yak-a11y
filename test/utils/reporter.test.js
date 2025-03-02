import { describe, it, expect, vi } from 'vitest';
import { generateReport } from '../../src/utils/reporter.js';
import chalk from 'chalk';

describe('reporter', () => {
  let consoleOutput = [];
  const mockLog = vi.fn((...args) => consoleOutput.push(args.join(' ')));
  
  beforeAll(() => {
    console.log = mockLog;
    chalk.level = 0; // Disable colors for testing
  });

  beforeEach(() => {
    consoleOutput = [];
    mockLog.mockClear();
  });

  afterAll(() => {
    console.log = console.log; // Restore original console.log
  });

  it('should report no violations correctly', async () => {
    const results = { violations: [] };
    await generateReport(results);
    expect(consoleOutput[0]).toContain('No accessibility violations found');
  });

  const mockViolation = {
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
    
    expect(consoleOutput.some(output => 
      output.includes('1 accessibility violations found')
    )).toBe(true);
    
    expect(consoleOutput.some(output => 
      output.includes('Images must have alternate text')
    )).toBe(true);
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
});
