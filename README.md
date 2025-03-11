# Astro Accessibility Checker

A comprehensive accessibility checker for Astro projects that provides detailed explanations and documentation links for any accessibility issues found.

## Installation

You can install this package using your preferred package manager:

```bash
# Using npm
npm install astro-accessibility

# Using pnpm
pnpm add astro-accessibility

# Using yarn
yarn add astro-accessibility
```

## Local Usage with Astro

### 1. Add to Your Astro Config

The recommended way to use this package is by adding it to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import accessibility from 'astro-accessibility/integration';

export default defineConfig({
  integrations: [
    accessibility({
      // Options (all optional)
      enableDevChecks: true,     // Run checks during development
      enableBuildChecks: true,   // Run checks during build
      failOnErrors: true,        // Fail build if issues are found
      checkInterval: 5000,       // Check interval during development (ms)
    }),
  ],
});
```

### 2. Add NPM Script (Optional)

Add a script to your `package.json` to run accessibility checks on demand:

```json
{
  "scripts": {
    "a11y": "astro-accessibility",
    "a11y:check": "astro-accessibility http://localhost:4321"
  }
}
```

Now you can run checks using:
```bash
# Check the current development server
npm run a11y:check

# Check a specific URL with verbose output
npm run a11y:check -- https://your-site.com --verbose
```

## Usage

You can use this package in three ways:

### Features

1. **Automatic Development Checks**
   - Runs checks as you develop
   - Provides immediate feedback
   - Monitors file changes

2. **Build-time Validation**
   - Ensures accessibility before deployment
   - Configurable error handling
   - CI/CD friendly

3. **Framework Support**
   - Works with React, Vue, and other frameworks
   - Auto-detects used frameworks
   - Applies framework-specific checks

### Using with Other Integrations

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import accessibility from 'astro-accessibility/integration';

export default defineConfig({
  integrations: [
    react(),
    accessibility({
      enableDevChecks: true,
      enableBuildChecks: true,
      failOnErrors: true,
    }),
  ],
});
```

### Command Line Options

The checker provides two command names for convenience:
- `astro-accessibility` - Full command name
- `astro-a11y` - Shorter alias

Available options:

```bash
# Show detailed information
astro-accessibility --verbose

# Skip dynamic content testing
astro-accessibility --skip-dynamic

# Skip Astro component testing
astro-accessibility --skip-astro

# Set hydration timeout
astro-accessibility --hydration-timeout 8000

# Test specific frameworks
astro-accessibility --frameworks react,vue

# Auto-detect frameworks (default)
astro-accessibility --auto-detect
```

### Programmatic Usage

```javascript
const { checkAccessibility } = require("astro-accessibility");

await checkAccessibility("http://localhost:3000", {
  verbose: true,
  // Optional advanced testing configuration
  dynamicTesting: {
    enabled: true, // Enable/disable dynamic content testing
    waitForHydration: true, // Wait for Astro islands to hydrate
    routeChanges: true, // Test accessibility after route changes
    ajaxTimeout: 5000, // Timeout for AJAX updates (ms)
  },
  astroTesting: {
    enabled: true, // Enable/disable Astro-specific testing
    testIslands: true, // Test individual Astro islands
    frameworks: ["react", "vue"], // Test specific framework components
    ignoreHydrating: false, // Whether to ignore elements during hydration
  },
});
```

## Standards and Guidelines

This tool helps ensure your Astro site meets modern accessibility standards:

### Core Standards
- WCAG 2.1 (Level A & AA)
- WAI-ARIA 1.2
- Section 508
- EN 301 549 (EU)
- AODA & ADA

### Framework Support
- React Accessibility
- Vue Accessibility
- Astro Components
- Mobile Accessibility

## What Gets Checked

### 1. Page Structure
- HTML landmarks (`<header>`, `<nav>`, `<main>`, etc.)
- Heading hierarchy
- Skip links
- Document metadata

### 2. Content
- Alt text for images
- Color contrast
- Link/button labels
- Form controls
- Keyboard navigation

### 3. Dynamic Content
- ARIA attributes
- Client-side routing
- Framework components
- Interactive widgets

## Documentation

For detailed guidelines and best practices, see [DOCS.md](DOCS.md).
## Requirements

- Node.js 14 or higher
- Astro 3.0 or higher

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Ensure development server is running
   - Check port number (default: 4321)
   - Verify URL is accessible

2. **Framework Issues**
   - Confirm framework integration setup
   - Check component imports
   - Review build configuration

3. **Performance**
   - Adjust hydration timeout if needed
   - Use `--skip-dynamic` for faster checks
   - Test specific pages instead of full site

### Command Reference

Two command names are available for convenience:

```bash
# Full command name
astro-accessibility http://localhost:4321

# Shorter alias
astro-a11y http://localhost:4321

# Common options (work with both commands)
--verbose            Show detailed reports
--skip-dynamic       Skip dynamic checks
--skip-astro         Skip Astro checks
--frameworks         Specify frameworks
--hydration-timeout  Set timeout (ms)
```

## License

MIT
