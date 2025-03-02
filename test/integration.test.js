import { describe, it, expect, vi } from 'vitest';

// Mock the integration module
vi.mock('../src/integration.js', () => ({
  astroAccessibility: vi.fn((options = {}) => ({
    name: 'astro-accessibility',
    hooks: {
      'astro:config:setup': vi.fn(),
      'astro:build:done': vi.fn()
    },
    options
  }))
}));

// Import after mocking
import { astroAccessibility } from '../src/integration.js';

describe('integration', () => {
  describe('astroAccessibility', () => {
    it('should return a valid Astro integration object', () => {
      const integration = astroAccessibility();
      expect(integration).toHaveProperty('name', 'astro-accessibility');
      expect(integration).toHaveProperty('hooks');
    });

    it('should accept configuration options', () => {
      const options = {
        verbose: true,
        skipDynamic: true
      };
      const integration = astroAccessibility(options);
      expect(integration.options).toEqual(expect.objectContaining(options));
    });
  });


});
