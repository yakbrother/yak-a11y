# Astro Accessibility Documentation

## When to Run

For comprehensive accessibility testing, we recommend running the checker at these key stages:

### 1. During Development

```bash
npx astro-a11y http://localhost:3000 --verbose
```

Benefits:
- Immediate feedback while coding
- Catches issues early in development
- Full dynamic testing available
- Best used with hot module reloading

### 2. Pre-commit Hooks

Add to your `package.json`:

```json
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

Benefits:
- Prevents accessibility issues from being committed
- Quick static analysis
- Skip dynamic tests for faster checks
- Focus on component-level issues

### 3. CI Pipeline

Example GitHub Action:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm install
      - name: Build site
        run: npm run build
      - name: Start preview server
        run: npm run preview &
      - name: Run accessibility tests
        run: npx astro-a11y http://localhost:4321 --skip-dynamic
```

Benefits:
- Tests the production build
- Runs after site is built but before deployment
- Can block deployments if critical issues are found
- Good for catching build-specific issues

### 4. Production Monitoring

```bash
# Test the live site
astro-a11y https://your-site.com --verbose
```

Benefits:
- Verifies accessibility in production environment
- Catches issues that only appear in deployed state
- Can be scheduled to run periodically
- Tests real user conditions

## Best Practices

### 1. Development Stage

- Run with all checks enabled (`--verbose`)
- Enable dynamic testing for full coverage
- Use auto-detection to skip irrelevant framework tests
- Set up your editor to show accessibility warnings in real-time

### 2. CI/CD Pipeline

- Skip dynamic tests for faster builds (`--skip-dynamic`)
- Focus on critical and serious issues
- Set appropriate error thresholds
- Consider parallel testing for multiple pages
- Cache node_modules to speed up CI runs

### 3. Production Checks

- Run comprehensive checks but be mindful of server load
- Schedule during low-traffic periods
- Monitor trends over time
- Set up alerts for new issues
- Keep historical data for regression testing

### 4. Configuration Tips

- Use `--auto-detect` (default) to optimize testing
- Adjust hydration timeout based on app complexity
- Configure framework-specific tests as needed
- Create custom configurations for different environments

## Advanced Usage

### Custom Rules

You can extend the default ruleset with your own custom rules:

```javascript
import { defineConfig } from "astro/config";
import accessibility from "@yakbrother/astro-accessibility/integration";

export default defineConfig({
  integrations: [
    accessibility({
      rules: {
        // Add custom rules
        "custom-rule": {
          test: (element) => {
            // Your test logic here
            return true;
          },
          message: "Custom rule message",
          impact: "serious",
          help: "How to fix this issue"
        }
      }
    })
  ]
});
```

### Framework-Specific Testing

When testing framework components, you can specify additional options:

```javascript
await checkAccessibility("http://localhost:3000", {
  frameworkTesting: {
    react: {
      testHooks: true,
      testContext: true,
      testEvents: true
    },
    vue: {
      testComposition: true,
      testLifecycle: true
    },
    svelte: {
      testReactivity: true
    }
  }
});
```

### Performance Optimization

To optimize performance in CI/CD pipelines:

1. Use the `--skip-dynamic` flag for faster checks
2. Implement parallel testing for multiple pages
3. Cache test results when possible
4. Use selective testing based on changed files

Example parallel testing configuration:

```javascript
// test-parallel.js
import { checkAccessibility } from "@yakbrother/astro-accessibility";

const urls = [
  "http://localhost:3000",
  "http://localhost:3000/about",
  "http://localhost:3000/contact"
];

Promise.all(
  urls.map(url => 
    checkAccessibility(url, {
      skipDynamic: true,
      cacheResults: true
    })
  )
).then(results => {
  // Combine and analyze results
});
```

### Error Handling

Implement robust error handling in your CI pipeline:

```javascript
try {
  const results = await checkAccessibility(url);
  if (results.violations.length > 0) {
    const critical = results.violations.filter(v => v.impact === "critical");
    if (critical.length > 0) {
      process.exit(1); // Fail the build
    }
    // Log non-critical issues but don't fail the build
    console.warn("Non-critical accessibility issues found");
  }
} catch (error) {
  console.error("Accessibility check failed:", error);
  process.exit(1);
}
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase `hydrationTimeout` value
   - Check server response times
   - Verify network connectivity

2. **False Positives**
   - Review and update rule configurations
   - Add specific element exclusions
   - Use custom rule implementations

3. **CI Pipeline Failures**
   - Check server startup timing
   - Verify port availability
   - Ensure proper environment variables

4. **Performance Issues**
   - Implement selective testing
   - Use caching strategies
   - Optimize parallel testing

### Getting Help

- Open an issue on GitHub
- Join our Discord community
- Check the FAQ in our wiki
- Review existing issues and solutions
