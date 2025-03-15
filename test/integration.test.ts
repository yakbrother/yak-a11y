import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define mocks at the top level but don't initialize them yet
let mockReadFile: any;
let mockAxeResults: any;

// Setup all mocks before any tests run
beforeEach(() => {
  // Reset all mocks
  vi.resetAllMocks();
  
  // Setup mock HTML content
  const mockHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <main>
          <h1>Welcome</h1>
          <img src="test.jpg" alt="Test image">
          <button>Click me</button>
        </main>
      </body>
    </html>
  `;
  
  // Initialize mock functions
  mockReadFile = vi.fn().mockResolvedValue(mockHtml);
  
  // Initialize mock results
  mockAxeResults = {
    violations: [{
      id: 'button-name',
      impact: 'critical',
      description: 'Ensures buttons have discernible text',
      help: 'Buttons must have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/button-name',
      tags: ['wcag2a'],
      nodes: [{
        html: '<button>Click me</button>',
        target: ['button'],
        any: [{
          id: 'button-has-visible-text',
          data: null,
          relatedNodes: [],
          impact: 'critical',
          message: 'Button has text that is visible to screen readers'
        }],
        all: [],
        none: []
      }]
    }],
    passes: [],
    timestamp: new Date().toISOString(),
    url: 'test.html'
  };
});

// Setup module mocks
vi.mock('fs/promises', () => ({
  readFile: () => mockReadFile(),
  default: {
    readFile: () => mockReadFile()
  }
}));

vi.mock('axe-core', () => ({
  __esModule: true,
  default: {
    configure: vi.fn(),
    run: vi.fn().mockImplementation(() => Promise.resolve(mockAxeResults))
  }
}));

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockImplementation(() => ({
      newPage: vi.fn().mockImplementation(() => ({
        goto: vi.fn(),
        setDefaultNavigationTimeout: vi.fn(),
        setDefaultTimeout: vi.fn(),
        close: vi.fn()
      })),
      close: vi.fn()
    }))
  }
}));

vi.mock('@axe-core/puppeteer', () => ({
  AxePuppeteer: vi.fn().mockImplementation(() => ({
    configure: vi.fn().mockReturnThis(),
    options: vi.fn().mockReturnThis(),
    analyze: vi.fn().mockImplementation(() => mockAxeResults)
  }))
}));

// Import the functions after setting up all mocks
import { checkAccessibility, checkStaticHTML } from '../src/index';

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should analyze static HTML files', async () => {
    // Create a specific mock result for this test
    const staticTestResult = {
      violations: [
        {
          id: 'test-violation',
          impact: 'critical',
          nodes: []
        }
      ]
    };
    
    // Override the mock for this specific test
    // Get the mock implementation
    const axeMock = (await import('axe-core')).default;
    // Cast to any to bypass TypeScript errors since we're mocking
    (axeMock as any).run = vi.fn().mockResolvedValueOnce(staticTestResult);
    
    const result = await checkStaticHTML('test.html');
    expect(result).toBeDefined();
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it('should analyze live URLs', async () => {
    const result = await checkAccessibility('http://example.com');
    expect(result).toBeDefined();
    expect(Array.isArray(result.violations)).toBe(true);
  });
});
