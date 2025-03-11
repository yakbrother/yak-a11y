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

You can use this package in several ways:

### 1. Command Line Interface

Run accessibility checks directly from the command line:

```bash
# Basic check
yak-a11y http://localhost:3000

# Show detailed information
yak-a11y --verbose http://localhost:3000

# Skip dynamic content testing
yak-a11y --skip-dynamic http://localhost:3000

# Set hydration timeout
yak-a11y --hydration-timeout 8000 http://localhost:3000

# Test specific frameworks
yak-a11y --frameworks react,vue http://localhost:3000

# Auto-detect frameworks (default)
yak-a11y --auto-detect http://localhost:3000
```

### 2. Astro Integration

For Astro projects, you can add automatic accessibility checking during development and build. This is particularly useful in CI/CD pipelines to ensure no accessibility issues make it to production.

#### Basic Integration

```javascript
import { defineConfig } from 'astro/config';
import accessibility from 'yak-a11y/astro';

export default defineConfig({
  integrations: [
    accessibility({
      // Options (all optional)
      enableDevChecks: true,     // Run checks during development
      enableBuildChecks: true,   // Run checks during build
      failOnErrors: true,        // Fail build if issues are found
      checkInterval: 5000,       // Check interval during development (ms)
      frameworks: ['react', 'vue'], // Frameworks to check (auto-detect if not specified)
      skipDynamic: false,        // Skip dynamic content testing
      hydrationTimeout: 8000,    // Timeout for hydration (ms)
    }),
  ],
});
```

#### Build Hook Integration

To ensure your site meets accessibility standards before deployment, the integration automatically hooks into Astro's build process:

1. **Pre-build Checks**: Before the build starts, it verifies your configuration and prepares the testing environment.

2. **During Build**: As pages are generated, it runs accessibility checks on each page.

3. **Post-build Validation**: After the build completes, it performs a final check on the entire site.

You can configure the build behavior:

```javascript
import { defineConfig } from 'astro/config';
import accessibility from 'yak-a11y/astro';

export default defineConfig({
  integrations: [
    accessibility({
      // Build-specific options
      enableBuildChecks: true,    // Enable build-time checking
      failOnErrors: true,         // Stop the build if issues are found
      failOnWarnings: false,      // Optionally fail on warnings too
      
      // What to check during build
      checkTypes: {
        critical: true,           // Must-fix accessibility issues
        serious: true,            // Should-fix accessibility issues
        moderate: false,          // Consider-fixing accessibility issues
      },
      
      // Output options
      outputFormat: 'detailed',   // 'simple' | 'detailed' | 'json'
      generateReport: true,       // Create an accessibility report file
      reportFile: 'a11y-report.json',  // Path to save the report
    }),
  ],
});
```

This integration provides:
- Automatic checks during development
- Pre-deployment validation
- CI/CD pipeline integration
- Detailed accessibility reports
- Framework-specific testing
- Immediate feedback in your terminal

#### CI/CD Integration

You can integrate accessibility checks into your CI/CD pipeline using the `yak-a11y` command. If you're using Astro, the checks will run automatically during build when configured in `astro.config.mjs` (see [Astro Integration](#2-astro-integration)).

Here are detailed setup instructions for popular CI platforms:

##### GitHub Actions

1. Create a new workflow file at `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility Checks

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  # Optional: Run on schedule
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Mondays

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build site
        run: npm run build

      - name: Start production server
        run: npx serve dist &

      - name: Run accessibility check
        id: a11y
        run: |
          sleep 3  # Wait for server to start
          npx yak-a11y http://localhost:3000 \
            --verbose \
            --frameworks astro,react \
            --hydration-timeout 10000 \
            --output-format json \
            --report-file a11y-report.json

      - name: Upload accessibility report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: a11y-report.json

      # Optional: Comment results on PR
      - name: Comment PR
        if: github.event_name == 'pull_request' && steps.a11y.outcome != 'success'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('a11y-report.json', 'utf8'));
            const issues = report.violations.length;
            
            const body = `## Accessibility Check Results ♿️
            Found ${issues} accessibility issues. Please check the full report in the artifacts.
            
            ### Quick Fix
            Run locally with:
            \`\`\`bash
            npx yak-a11y http://localhost:3000 --verbose
            \`\`\`
            
            [View detailed report](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

2. Configure options in your repository:
   - Go to Settings > Actions > General
   - Enable "Read and write permissions" under "Workflow permissions"

3. Optional: Add status badge to your README:
```markdown
[![Accessibility Checks](https://github.com/<username>/<repo>/actions/workflows/accessibility.yml/badge.svg)](https://github.com/<username>/<repo>/actions/workflows/accessibility.yml)
```

##### GitLab CI

1. Create or update `.gitlab-ci.yml` in your repository:

```yaml
image: node:18

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .npm/
    - node_modules/

# Define stages
stages:
  - setup
  - build
  - test

# Install dependencies
setup:
  stage: setup
  script:
    - npm ci --cache .npm --prefer-offline
  artifacts:
    paths:
      - node_modules/

# Build the site
build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/

# Run accessibility checks
accessibility:
  stage: test
  script:
    # Install and start server
    - npm install -g serve
    - serve dist & 
    - sleep 3  # Wait for server
    
    # Run checks
    - |
      # Note: If using Astro integration, these checks run automatically during build
      npx yak-a11y http://localhost:3000 \
        --verbose \
        --frameworks astro,react \
        --hydration-timeout 10000 \
        --output-format json \
        --report-file a11y-report.json
  artifacts:
    reports:
      accessibility: a11y-report.json
    expose_as: 'Accessibility Report'
    when: always
  # Optional: Only run on main branch and MRs
  rules:
    - if: $CI_PIPELINE_SOURCE == 'merge_request_event'
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  # Add MR comments
  after_script:
    - |
      if [ -f a11y-report.json ] && [ "$CI_PIPELINE_SOURCE" = "merge_request_event" ]; then
        issues=$(jq '.violations | length' a11y-report.json)
        echo "Found $issues accessibility issues."
        echo "### Quick Fix 🔧" >> report.md
        echo 'Run locally with:' >> report.md
        echo '```bash' >> report.md
        echo 'npx yak-a11y http://localhost:3000 --verbose' >> report.md
        echo '```' >> report.md
      fi
```

2. Configure GitLab CI/CD settings:
   - Go to Settings > CI/CD
   - Expand "General pipelines"
   - Set "Timeout" to 15 minutes
   - Enable "Public pipelines"

3. Optional: Add pipeline status badge to your README:
```markdown
[![Pipeline Status](https://gitlab.com/<username>/<repo>/badges/main/pipeline.svg)](https://gitlab.com/<username>/<repo>/-/commits/main)
```

4. View reports:
   - Go to CI/CD > Pipelines
   - Click on the latest pipeline
   - View the accessibility report under "Artifacts"

For other CI platforms, you can follow similar patterns. All examples use the same core components:

1. **Setup**: Install Node.js and dependencies
2. **Build**: Build your site
3. **Test**: Run accessibility checks
4. **Report**: Save and publish results

##### Common Configuration

For any CI platform, use these settings:

```bash
# Core command
npx yak-a11y <url> \
  --verbose \
  --frameworks astro,react \
  --hydration-timeout 10000 \
  --output-format json \
  --report-file a11y-report.json

# Exit codes
# 0: No issues found
# 1: Accessibility issues found
# 2: Runtime error
```

##### Environment Variables

You can configure the checker using environment variables in your CI platform:

```bash
# Optional environment variables
YAK_FRAMEWORKS=astro,react     # Frameworks to check
YAK_TIMEOUT=10000             # Hydration timeout in ms
YAK_REPORT_FILE=custom.json   # Custom report location
YAK_FAIL_LEVEL=error         # fail on error|warning|all
```

These settings work consistently across all CI platforms while maintaining the single command approach.

### 3. Programmatic Usage

Use the checker in your own scripts or tools:

```javascript
import { checkAccessibility } from 'yak-a11y';

await checkAccessibility('http://localhost:3000', {
  verbose: true,
  // Optional advanced testing configuration
  dynamicTesting: {
    enabled: true,          // Enable/disable dynamic content testing
    waitForHydration: true, // Wait for components to hydrate
    routeChanges: true,     // Test accessibility after route changes
    ajaxTimeout: 5000,      // Timeout for AJAX updates (ms)
  },
  frameworks: {
    enabled: true,          // Enable/disable framework-specific testing
    autoDetect: true,       // Auto-detect frameworks in use
    include: ['react', 'vue'], // Test specific framework components
    ignoreHydrating: false, // Whether to ignore elements during hydration
  },
});
```


```

## Standards and Guidelines

This tool helps ensure your website meets modern accessibility standards:

### Core Standards
- WCAG 2.1 (Level A & AA)
- WAI-ARIA 1.2
- Section 508
- EN 301 549 (EU)
- AODA & ADA

### Framework Support
- React Components
- Vue Components
- Astro Integration
- Static & Dynamic Content
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
- Framework components (React, Vue, Astro)
- Interactive widgets
- Component hydration

## Documentation

For detailed guidelines and best practices, see [DOCS.md](DOCS.md).
## Requirements

- Node.js 14 or higher

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Ensure development server is running
   - Check port number is correct
   - Verify URL is accessible

2. **Framework & Astro Integration**
   - Confirm integration is properly configured in `astro.config.mjs`
   - Check framework dependencies are installed
   - Review build configuration

3. **Performance**
   - Adjust hydration timeout: `yak-a11y --hydration-timeout 10000`
   - Skip dynamic checks: `yak-a11y --skip-dynamic`
   - Test specific pages instead of full site
   - Use `checkInterval` in Astro integration for slower machines

### Command Reference

```bash
yak-a11y [options] <url>

Options:
  --verbose             Show detailed reports
  --skip-dynamic        Skip dynamic content checks
  --frameworks          Specify frameworks to check (e.g., react,vue)
  --hydration-timeout   Set component hydration timeout in ms (default: 5000)
  --auto-detect         Auto-detect frameworks (default: true)
  --help                Show help
  --version             Show version

Examples:
  yak-a11y http://localhost:3000
  yak-a11y --verbose --frameworks react,vue http://localhost:3000
  yak-a11y --skip-dynamic --hydration-timeout 10000 http://localhost:3000
```

## License

MIT
