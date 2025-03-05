import { describe, it, expect, vi, beforeEach } from 'vitest';

import { readFile } from 'fs/promises';

vi.mock('fs/promises', async () => ({
  default: {
    readFile: vi.fn()
  },
  readFile: vi.fn()
}));

import { checkAccessibility, checkStaticHTML } from '../src/index.js';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

// Mock modules
vi.mock('axe-core', () => ({
  default: {
    configure: vi.fn(),
    run: vi.fn().mockResolvedValue({
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
  }
}));

const mockPage = {
  goto: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  setDefaultNavigationTimeout: vi.fn().mockResolvedValue(undefined),
  setDefaultTimeout: vi.fn().mockResolvedValue(undefined)
};

const mockBrowser = {
  newPage: vi.fn().mockResolvedValue(mockPage),
  close: vi.fn().mockResolvedValue(undefined)
};

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue(mockBrowser)
  }
}));

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

describe('index', () => {
describe('checkStaticHTML', () => {
    const mockHtml = '<!DOCTYPE html><html><head><title>Test</title></head><body><img src="test.jpg"><button></button></body></html>';

    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
      
      // Mock axe results
      axe.run.mockResolvedValue({
        violations: [{
          impact: 'critical',
          help: 'Images must have alternate text',
          nodes: [{
            html: '<img src="test.jpg">',
            failureSummary: 'Fix any of the following: Element does not have an alt attribute'
          }],
          tags: ['wcag2a'],
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt'
        }]
      });
    });

    it('should check static HTML content', async () => {
      readFile.mockResolvedValue(mockHtml);
      axe.run.mockResolvedValue({ violations: [] });
      
      const result = await checkStaticHTML('test.html');
      expect(axe.configure).toHaveBeenCalled();
      expect(axe.run).toHaveBeenCalled();
      expect(result).toEqual({ violations: [] });
    });

    it('should handle errors gracefully', async () => {
      readFile.mockResolvedValue(mockHtml);
      axe.run.mockRejectedValue(new Error('Test error'));
      
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
      
      expect(mockPage.goto).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      }));
      expect(mockBrowser.close).toHaveBeenCalled();
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
          `Invalid URL provided: "${invalidUrl}"`
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
