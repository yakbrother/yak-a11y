# 🦌 Yak A11y

A fast, comprehensive accessibility checker that provides detailed explanations and actionable fixes. Get beautiful, educational reports to improve your website's accessibility compliance.

## ✨ Features

- 🔍 **Comprehensive scanning** - Checks WCAG 2.1 AA, Section 508, and best practices
- 📊 **Beautiful reports** - Color-coded output with detailed explanations
- ⚡ **Blazing fast** - Optimized for performance with connection pooling
- 🎯 **Actionable feedback** - Direct links to documentation and fixes
- 📁 **Batch processing** - Check multiple files in parallel
- 🌐 **Live site testing** - Test URLs with dynamic content support

## 🚀 Quick Start

```bash
# Install globally
npm install -g yak-a11y

# Check a live site
yak-a11y --url http://localhost:3000

# Check static HTML files
yak-a11y --file index.html about.html

# Get detailed output
yak-a11y --url http://localhost:3000 --verbose
```

## 📦 Installation

```bash
# npm
npm install -g yak-a11y

# pnpm
pnpm add -g yak-a11y

# yarn
yarn global add yak-a11y
```

## 🛠️ Usage

### Command Line Interface

```bash
# Basic usage
yak-a11y --url <url>              # Check a live website
yak-a11y --file <files...>        # Check static HTML files

# Options
--url <url>                       # URL to check
--file <file1> <file2>...         # HTML files to check
--verbose                         # Show detailed violation info
--help, -h                        # Show help message

# Examples
yak-a11y --url http://localhost:3000/page.html
yak-a11y --file dist/index.html dist/about.html --verbose
yak-a11y --url https://example.com --verbose
```

### Try the Examples

Test with the included example pages:

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
 Element: <img src="product.jpg" width="300">

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

- WCAG 2.1 Level A & AA
- Section 508
- Best practices from axe-core

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

# Run examples
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

---

**Made with ♿ by developers who care about accessibility**
