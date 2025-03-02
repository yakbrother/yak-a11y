import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        evaluate: vi.fn()
      }),
      close: vi.fn()
    })
  }
}));

describe('index', () => {
  describe('checkStaticHTML', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <img src="test.jpg"> <!-- Missing alt tag -->
          <button></button> <!-- Missing label -->
        </body>
      </html>
    `;

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
      // Create a temporary file with the HTML content
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      
      const tempFile = path.join(os.tmpdir(), 'test.html');
      await fs.writeFile(tempFile, mockHtml);
      
      try {
        const result = await checkStaticHTML(tempFile);
        expect(axe.configure).toHaveBeenCalled();
        expect(axe.run).toHaveBeenCalled();
      } finally {
        await fs.unlink(tempFile);
      }
    });

    it('should handle errors gracefully', async () => {
      const axe = await import('axe-core');
      axe.default.run.mockRejectedValue(new Error('Test error'));
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      
      const tempFile = path.join(os.tmpdir(), 'test.html');
      await fs.writeFile(tempFile, mockHtml);
      
      try {
        await expect(checkStaticHTML(tempFile)).rejects.toThrow('Test error');
      } finally {
        await fs.unlink(tempFile);
      }
    });
  });

  describe('checkAccessibility', () => {
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
    });

    it('should check accessibility of a URL', async () => {
      const mockUrl = 'http://example.com';
      const mockResults = {
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

      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch();
      const page = await browser.newPage();
      page.evaluate.mockResolvedValue(mockResults);

      const result = await checkAccessibility(mockUrl);
      expect(page.goto).toHaveBeenCalledWith(mockUrl);
      expect(page.evaluate).toHaveBeenCalled();
      await browser.close();
    });

    it('should handle invalid URLs', async () => {
      const invalidUrl = 'not-a-url';
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch();
      const page = await browser.newPage();
      page.goto.mockRejectedValue(new Error('Invalid URL'));

      await expect(checkAccessibility(invalidUrl)).rejects.toThrow('Invalid URL');
      await browser.close();
    });

    it('should respect timeout options', async () => {
      const mockUrl = 'http://example.com';
      const options = { timeout: 1000 };
      
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch();
      const page = await browser.newPage();
      
      await checkAccessibility(mockUrl, options);
      expect(page.goto).toHaveBeenCalledWith(mockUrl, expect.objectContaining({ timeout: 1000 }));
      await browser.close();
    });
  });
});
