# Astro Accessibility Checker

A comprehensive accessibility checker for Astro projects that provides detailed explanations and documentation links for any accessibility issues found.

## Installation

```bash
npm install astro-accessibility
```

## Usage

You can use this package in three ways:

### 1. Automatic Integration (Recommended)

Add the integration to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import accessibility from 'astro-accessibility/integration';

export default defineConfig({
  integrations: [
    accessibility({
      // Options (all optional)
      enableDevChecks: true,     // Run during development
      enableBuildChecks: true,   // Run during build
      failOnErrors: true,        // Whether to fail the build if issues are found
      checkInterval: 5000,       // How often to check during development (ms)
      // DANGER: Only use in emergencies - NOT RECOMMENDED
      // forceBuild: false,      // Set to true to build even with violations
    })
  ]
});
```

This will:
- Run accessibility checks automatically during development
- Check pages after file changes (with debouncing)
- Run a final check during the build process
- Provide immediate feedback in the console

> ⚠️ **Emergency Builds with Violations**
>
> While strongly discouraged, you can force a build even when accessibility violations are present:
> ```javascript
> accessibility({
>   failOnErrors: true,
>   forceBuild: true  // DANGER: This will allow builds with accessibility violations
> })
> ```
> **WARNING**: This should only be used in emergency situations where a deploy is critical.
> Building with accessibility violations may make your site unusable for some visitors.
> Always fix accessibility issues as soon as possible.

You can also use it with other integrations:

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import accessibility from 'astro-accessibility/integration';

export default defineConfig({
  integrations: [
    react(),  // Add React support
    accessibility({
      // Enable all checks during development
      enableDevChecks: true,
      // But only run static checks during build to keep CI fast
      enableBuildChecks: true,
      failOnErrors: true,
      // Configuration will auto-detect React and only run React-specific tests
      // when React components are present
    })
  ]
});
```

### 2. Command Line Interface

```bash
npx astro-a11y http://localhost:3000
```

Options:
- `-v, --verbose`: Show more detailed information about each violation
- `--skip-dynamic`: Skip dynamic content testing
- `--skip-astro`: Skip Astro-specific component testing
- `--hydration-timeout <ms>`: Set maximum wait time for hydration (default: 5000ms)
- `--frameworks <list>`: Specify frameworks to test as comma-separated list (default: react,vue)
- `--auto-detect`: Auto-detect frameworks and skip tests for unused ones (default: true)

### 2. Programmatic Usage

```javascript
const { checkAccessibility } = require('astro-accessibility');

await checkAccessibility('http://localhost:3000', {
  verbose: true,
  // Optional advanced testing configuration
  dynamicTesting: {
    enabled: true,           // Enable/disable dynamic content testing
    waitForHydration: true,  // Wait for Astro islands to hydrate
    routeChanges: true,      // Test accessibility after route changes
    ajaxTimeout: 5000,       // Timeout for AJAX updates (ms)
  },
  astroTesting: {
    enabled: true,           // Enable/disable Astro-specific testing
    testIslands: true,       // Test individual Astro islands
    frameworks: ['react', 'vue'],  // Test specific framework components
    ignoreHydrating: false,  // Whether to ignore elements during hydration
  }
});
```

## Features

### Standards and Guidelines Checked

The tool checks against the following accessibility standards and guidelines:

#### Core Standards
- **WCAG 2.1 Level A** - Basic web accessibility requirements
- **WCAG 2.1 Level AA** - Standard level of accessibility for most websites
- **WAI-ARIA 1.2** - Rich Internet Applications accessibility guidelines
- **Section 508** - US federal accessibility requirements

#### Additional Guidelines
- **EN 301 549** - European accessibility requirements for ICT products and services
- **AODA** - Accessibility for Ontarians with Disabilities Act
- **ADA** - Americans with Disabilities Act web accessibility requirements

#### Framework-Specific Guidelines
- **React Accessibility Guidelines**
- **Vue Accessibility Guidelines**
- **Astro Component Accessibility Best Practices**

#### Mobile Accessibility
- **WCAG 2.1 Mobile Success Criteria**
- **iOS Accessibility Guidelines**
- **Android Accessibility Guidelines**

### Comprehensive Accessibility Checks

- **Page Structure & Navigation**
  - Proper HTML landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`)
  - Heading hierarchy and structure
  - Skip links and keyboard navigation
  - Document title and language

- **Content Accessibility**
  - Image alternative text
  - Color contrast ratios
  - Link and button labels
  - Form control labels and associations
  - Focus management and tab order

- **ARIA Implementation**
  - Valid ARIA attributes
  - Proper role usage
  - Required ARIA properties
  - Dynamic content updates

### User-Friendly Reporting

- **Priority-Based Issues**
  - High Priority - Must Fix
  - Important - Should Fix
  - Medium Priority
  - Low Priority

- **Actionable Feedback**
  - Clear, plain-language explanations
  - Step-by-step fix instructions
  - Code examples for common solutions
  - Best practices and tips

### Comprehensive Documentation

- **Integrated Resource Links**
  - WCAG 2.1 Guidelines
  - MDN Web Docs (Mozilla)
  - WebAIM Articles
  - The A11Y Project
  - Deque University

## Suggested Additional Tests

We're planning to add these additional accessibility checks:

### 1. Dynamic Content Testing
- Single Page Application (SPA) route changes
- AJAX content updates
- Custom web components
- Progressive enhancement verification

### 2. Media Accessibility
- Video captions and transcripts
- Audio descriptions
- Media player controls
- Responsive media support

### 3. Advanced Interaction Patterns
- Drag and drop operations
- Modal dialogs
- Autocomplete components
- Custom form controls
- Toast notifications

### 4. Performance Impact
- Load time for assistive technologies
- Memory usage with screen readers
- Animation performance
- Resource loading priorities

### 5. Mobile Accessibility
- Touch targets
- Gesture alternatives
- Viewport management
- Orientation support

### 6. Internationalization
- RTL layout support
- Language detection
- Character encoding
- Date and number formats

## Framework Auto-Detection

The tool now includes intelligent framework detection:
- Automatically detects which frameworks (React, Vue, etc.) are used in your project
- Only runs framework-specific tests for frameworks that are actually present
- Improves performance by skipping unnecessary tests
- Can be disabled with `--auto-detect=false` if you need to force specific framework tests

## Error Handling and Reporting

Improved error handling and reporting features:
- Detailed error messages with specific line numbers and elements
- Grouped violations by severity and type
- Clear, actionable fix suggestions
- Performance impact considerations
- Links to relevant accessibility guidelines

## License

MIT License

Copyright (c) 2025 YakBrother

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### 7. PDF Accessibility
- Document structure
- Tagged PDF elements
- Reading order
- Form field labels

### 8. Custom Astro Component Tests
- Island hydration accessibility
- Client-side scripting patterns
- Framework-specific components (React, Vue, Svelte)
- SSR vs. CSR behavior

### 9. Advanced Color Tests
- High contrast mode support
- Custom color schemes
- System color preferences
- Color blindness simulation

### 10. Cognitive Accessibility
- Reading level assessment
- Content predictability
- Timing adjustments
- Error prevention

We welcome contributions! If you'd like to help implement any of these features, please check our contributing guidelines.

## When to Run

For comprehensive accessibility testing, we recommend running the checker at these key stages:

### 1. During Development
```bash
npx astro-a11y http://localhost:3000 --verbose
```
- Immediate feedback while coding
- Catches issues early in development
- Full dynamic testing available
- Best used with hot module reloading

### 2. Pre-commit Hooks
```bash
# Add to your package.json scripts
{
  "scripts": {
    "test:a11y": "astro-a11y http://localhost:3000 --skip-dynamic"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:a11y"
    }
  }
}
```
- Prevents accessibility issues from being committed
- Quick static analysis
- Skip dynamic tests for faster checks
- Focus on component-level issues

### 3. CI Pipeline
```yaml
# Example GitHub Action
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Build site
        run: npm run build
      - name: Start preview server
        run: npm run preview &
      - name: Run accessibility tests
        run: npx astro-a11y http://localhost:4321 --skip-dynamic
```
- Tests the production build
- Runs after site is built but before deployment
- Can block deployments if critical issues are found
- Good for catching build-specific issues

### 4. Production Monitoring
```bash
# Test the live site
astro-a11y https://your-site.com --verbose
```
- Verifies accessibility in production environment
- Catches issues that only appear in deployed state
- Can be scheduled to run periodically
- Tests real user conditions

### Best Practices

1. **Development Stage**
   - Run with all checks enabled (`--verbose`)
   - Enable dynamic testing for full coverage
   - Use auto-detection to skip irrelevant framework tests

2. **CI/CD Pipeline**
   - Skip dynamic tests for faster builds (`--skip-dynamic`)
   - Focus on critical and serious issues
   - Set appropriate error thresholds

3. **Production Checks**
   - Run comprehensive checks but be mindful of server load
   - Schedule during low-traffic periods
   - Monitor trends over time

4. **Configuration Tips**
   - Use `--auto-detect` (default) to optimize testing
   - Adjust hydration timeout based on app complexity
   - Configure framework-specific tests as needed

## Requirements

- Node.js 14 or higher
- Astro 3.0 or higher
