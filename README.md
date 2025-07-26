# 🦌 Yak A11y

A fast, comprehensive accessibility checker that provides detailed explanations and actionable fixes. Get beautiful, educational terminal reports to improve your website's accessibility compliance.

[![npm version](https://badge.fury.io/js/yak-a11y.svg)](https://badge.fury.io/js/yak-a11y)
[![npm downloads](https://img.shields.io/npm/dm/yak-a11y.svg)](https://www.npmjs.com/package/yak-a11y)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔍 **Comprehensive scanning** - Checks WCAG 2.1 AA, Section 508, and best practices
- 📊 **Beautiful reports** - Color-coded output with detailed explanations
- ⚡ **Blazing fast** - Optimized for performance with connection pooling
- 🎯 **Actionable feedback** - Direct links to documentation and fixes
- 📁 **Batch processing** - Check multiple files in parallel
- 🌐 **Live site testing** - Test URLs with dynamic content support

## 🚀 Quick Start

### Install

```bash
# Install globally
npm install -g yak-a11y

# Or install as a dev dependency in your project
npm install --save-dev yak-a11y
```

### Use

```bash
# Check your live website
yak-a11y --url http://localhost:3000

# Check your built files
yak-a11y --file dist/*.html

# Get detailed output
yak-a11y --url http://localhost:3000 --verbose
```

## 📦 Installation

### Global Installation

```bash
# npm
npm install -g yak-a11y

# pnpm
pnpm add -g yak-a11y

# yarn
yarn global add yak-a11y
```

### Project Installation

```bash
# npm
npm install --save-dev yak-a11y

# pnpm
pnpm add -D yak-a11y

# yarn
yarn add -D yak-a11y
```

## 🛠️ Usage

### Command Line Interface

```bash
# Check your live development server
yak-a11y --url http://localhost:3000

# Check your built files before deployment
yak-a11y --file dist/*.html

# Get detailed violation information
yak-a11y --url http://localhost:3000 --verbose

# Options
--url <url>                       # URL to check
--file <file1> <file2>...         # HTML files to check
--verbose                         # Show detailed violation info
--help, -h                        # Show help message
```

### Development Workflow Integration

#### 1. Install as a Dev Dependency

```bash
# In your website project
npm install --save-dev yak-a11y
```

#### 2. Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "a11y": "yak-a11y --url http://localhost:5173 --verbose",
    "a11y:build": "npm run build && npm run preview & sleep 3 && yak-a11y --url http://localhost:4173 --verbose",
    "a11y:files": "yak-a11y --file dist/*.html --verbose",
    "test": "npm run a11y"
  }
}
```

#### 3. Development Workflow

```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Check accessibility on live site
npm run a11y

# Or check built files
npm run build
npm run a11y:files
```

#### 4. CI/CD Integration

```yaml
# .github/workflows/a11y.yml
name: Accessibility Check
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - run: npm run preview &
      - run: sleep 3 && npx yak-a11y --url http://localhost:4173 --verbose
```

### Test the Tool (Optional)

If you want to see how it works, try the included example pages:

```bash
# Start example server
npm run examples

# Test different scenarios
yak-a11y --url http://localhost:3000/perfect.html           # Clean page ✅
yak-a11y --url http://localhost:3000/contrast-aria-issues.html --verbose  # Issues 🚨
```

### Programmatic Usage

```javascript
import { checkAccessibility, checkStaticHTML } from "yak-a11y";

// Check a live URL
const results = await checkAccessibility("http://localhost:3000", {
  verbose: true,
});

// Check static HTML
const fileResults = await checkStaticHTML("./dist/index.html", {
  verbose: true,
});

console.log(`Found ${results.violations.length} issues`);
```

### Real-World Usage

#### During Development

```bash
# 1. Start your development server
npm run dev  # or yarn dev, pnpm dev

# 2. In another terminal, check accessibility
yak-a11y --url http://localhost:3000 --verbose

# 3. Fix issues and recheck
yak-a11y --url http://localhost:3000 --verbose
```

#### Before Deployment

```bash
# Check built files before deployment
npm run build
yak-a11y --file dist/*.html --verbose

# Or check the preview server
npm run preview &
sleep 3
yak-a11y --url http://localhost:4173 --verbose
```

#### Production Sites

```bash
# Test your production site
yak-a11y --url https://mywebsite.com --verbose

# Test staging environment
yak-a11y --url https://staging.mywebsite.com --verbose
```

#### Framework-Specific Examples

**Vite/React/Vue:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "a11y": "yak-a11y --url http://localhost:5173 --verbose",
    "a11y:build": "npm run build && npm run preview & sleep 3 && yak-a11y --url http://localhost:4173 --verbose"
  }
}
```

**Next.js:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "a11y": "yak-a11y --url http://localhost:3000 --verbose",
    "a11y:build": "npm run build && npm run start & sleep 3 && yak-a11y --url http://localhost:3000 --verbose"
  }
}
```

**Astro:**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "a11y": "yak-a11y --url http://localhost:4321 --verbose",
    "a11y:build": "npm run build && npm run preview & sleep 3 && yak-a11y --url http://localhost:4321 --verbose"
  }
}
```

## 📊 Sample Output

```bash
✓ No accessibility violations found

# Or with issues:
4 accessibility violations found:

Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ Critical - Must Fix: 2 issues
■ Serious - Should Fix: 1 issue
■ Moderate - Consider Fixing: 1 issue

Issue 1
────────────────────────────────────────
 Priority: Critical - Must Fix
 Issue: Images must have alternative text
 Element: <img src="hero.jpg" width="300">

 Try these fixes:
   Add an alt attribute describing the image content

 Documentation:
   https://www.w3.org/WAI/WCAG21/quickref/#images-of-text
```

## 🎯 What Gets Checked

### Core Accessibility Issues

- **Images**: Missing alt text, decorative images
- **Forms**: Missing labels, unclear instructions
- **Color**: Insufficient contrast ratios
- **Navigation**: Missing landmarks, heading hierarchy
- **Keyboard**: Focus management, tab order
- **ARIA**: Proper usage, valid attributes

### Standards Compliance

- **WCAG 2.1** Level A & AA
- **Section 508** compliance
- **Best practices** from axe-core
- **WAI-ARIA** guidelines

## ⚡ Performance Features

- **Connection pooling** - Reuses browser instances for faster consecutive checks
- **Parallel processing** - Checks multiple files simultaneously
- **Lazy loading** - Dependencies loaded only when needed
- **Optimized timeouts** - Reduced wait times without sacrificing accuracy

## 🔧 Development Setup

```bash
# Clone and install
git clone https://github.com/yakbrother/yak-a11y.git
cd yak-a11y
npm install

# Build
npm run build

# Test
npm test

# Test with examples (optional)
npm run examples
```

## 🏗️ Build Scripts

```bash
npm run build              # Compile TypeScript
npm run dev               # Watch mode
npm run test              # Run test suite
npm run test:coverage     # Coverage report
npm run examples          # Start test server
```

## 🏗️ Build Scripts

```bash
npm run build              # Compile TypeScript
npm run dev               # Watch mode
npm run test              # Run test suite
npm run test:coverage     # Coverage report
npm run examples          # Start test server
```

## 📋 Requirements

- **Node.js** 16 or higher
- **npm** 7 or higher (or yarn/pnpm)

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors**

```bash
npm run build  # Ensure TypeScript is compiled
```

**Connection timeouts**

```bash
# Ensure your server is running
npm run dev  # or your development command
```

**Canvas warnings (non-blocking)**

```
# These are expected for static HTML checking and don't affect results
Error: Not implemented: HTMLCanvasElement.prototype.getContext
```

### Getting Help

1. Check the [examples](./examples/) directory
2. Run with `--verbose` for detailed output
3. Open an issue with your command and error message

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and open an issue first for major changes.

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

## 🔗 Links

- [npm package](https://www.npmjs.com/package/yak-a11y)
- [GitHub repository](https://github.com/yakbrother/yak-a11y)
- [Issues](https://github.com/yakbrother/yak-a11y/issues)

---

**Made with ♿ by developers who care about accessibility**
