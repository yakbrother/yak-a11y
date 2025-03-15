import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Page, Browser } from 'puppeteer';
import type { AxeResults, ImpactValue, CheckResult } from 'axe-core';

// Mock fs/promises
vi.mock('fs/promises');

// Mock axe-core
vi.mock('axe-core', async () => {
  const actual = await vi.importActual<typeof import('axe-core')>('axe-core');
  return {
    ...actual,
    default: {
      configure: vi.fn(),
      run: vi.fn().mockResolvedValue({
        violations: [{
          id: 'image-alt',
          impact: 'critical' as ImpactValue,
          description: 'Ensures <img> elements have alternate text or a role of none or presentation',
          help: 'Images must have alternate text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt',
          tags: ['wcag2a'],
          nodes: [{
            html: '<img src="test.jpg">',
            target: ['img'],
            any: [{
              id: 'has-alt',
              data: null,
              relatedNodes: [],
              impact: 'critical' as ImpactValue,
              message: 'Element does not have an alt attribute'
            }],
            all: [],
            none: []
          }]
        }],
        passes: [],
        timestamp: new Date().toISOString(),
        url: 'test.html'
      })
    }
  };
});

// Mock puppeteer
vi.mock('puppeteer', () => {
  const page = {
    goto: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    setDefaultNavigationTimeout: vi.fn().mockResolvedValue(undefined),
    setDefaultTimeout: vi.fn().mockResolvedValue(undefined)
  };

  const browser = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined)
  };

  return {
    default: {
      launch: vi.fn().mockResolvedValue(browser)
    }
  };
});

// Mock axe-puppeteer
vi.mock('@axe-core/puppeteer', () => ({
  AxePuppeteer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
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
    })
  }))
}));

// Import after mocks
import { checkAccessibility, checkStaticHTML } from '../src/index';
import { JSDOM } from 'jsdom';
import { readFile } from 'fs/promises';
import axe from 'axe-core';

describe('index', () => {
  describe('checkStaticHTML', () => {
    const mockHtml = '<!DOCTYPE html><html><head><title>Test</title></head><body><img src="test.jpg"><button></button></body></html>';

    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
      
      // Reset mocks
      vi.clearAllMocks();
    });

    it('should check static HTML content', async () => {
      vi.mocked(readFile).mockResolvedValue(mockHtml);
      (axe as any).run.mockResolvedValue({
        passes: [],
        violations: [],
        timestamp: new Date().toISOString(),
        url: 'test.html'
      });
      
      const result = await checkStaticHTML('test.html');
      expect((axe as any).configure).toHaveBeenCalled();
      expect((axe as any).run).toHaveBeenCalled();
      expect(result).toEqual({ violations: [] });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(readFile).mockResolvedValue(mockHtml);
      (axe as any).run.mockRejectedValue(new Error('Test error'));
      
      await expect(checkStaticHTML('test.html')).rejects.toThrow('Test error');
    });
  });

  describe('checkAccessibility', () => {
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
    });

    it('should check accessibility of a URL', async () => {
      const mockUrl = 'http://example.com';
      const result = await checkAccessibility(mockUrl);
      
      const puppeteer = await import('puppeteer');
      const page = await puppeteer.default.launch().then(browser => browser.newPage());
      expect(vi.mocked(page).goto).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      }));
      expect(vi.mocked(page).close).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        violations: expect.arrayContaining([expect.objectContaining({
          id: 'image-alt',
          impact: 'critical'
        })])
      }));
    });

    it('should handle invalid URLs', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        'localhost:3000',
        '/relative/path'
      ];
      
      for (const invalidUrl of invalidUrls) {
        await expect(checkAccessibility(invalidUrl)).rejects.toThrow(
          `Invalid URL provided: "${invalidUrl}"

To fix this:
1. Make sure your URL starts with http:// or https://
2. Check for any typos in the URL
3. If testing locally, use http://localhost:port
4. For file URLs, use http-server or a local development server`
        );
      }
    });

    it('should accept valid URLs', async () => {
      const validUrls = [
        'http://example.com',
        'https://test.com',
        'http://localhost:3000'
      ];

      for (const validUrl of validUrls) {
        const result = await checkAccessibility(validUrl);
        expect(result).toBeDefined();
      }
    });
  });
});
