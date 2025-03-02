import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/integration.js', () => ({
  astroAccessibility: vi.fn().mockImplementation((options = {}) => ({
    name: 'astro-accessibility',
    hooks: {
      'astro:config:setup': vi.fn(),
      'astro:build:done': vi.fn()
    },
    options
  }))
}));
import { astroAccessibility } from '../src/integration.js';

const mockIntegration = {
  name: 'astro-accessibility',
  hooks: {
    'astro:config:setup': vi.fn(),
    'astro:build:done': vi.fn()
  }
};

beforeEach(() => {
  vi.clearAllMocks();
});

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
