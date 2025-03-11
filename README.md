# Yak A11y

A comprehensive accessibility checker that provides detailed explanations and documentation links for any accessibility issues found. Get actionable feedback to improve your website's accessibility.

## Installation

You can install this package using your preferred package manager:

```bash
# Using npm
npm install yak-a11y

# Using pnpm
pnpm add yak-a11y

# Using yarn
yarn add yak-a11y
```

## Getting Started

### 1. Try the Example Pages

After installation, run the example server to test different accessibility scenarios:

```bash
node examples/server.js
```

This will start a server with example pages:
- `perfect.html` - A fully accessible page
- `image-form-issues.html` - Common image and form problems
- `navigation-issues.html` - Navigation and landmark issues
- `contrast-aria-issues.html` - Color contrast and ARIA problems

### 2. Run Accessibility Checks

Run the accessibility checker using:

```bash
# Basic check
yak-a11y http://localhost:3000/perfect.html

# Check with detailed output
yak-a11y http://localhost:3000/image-form-issues.html --verbose
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
