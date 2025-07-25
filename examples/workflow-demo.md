# Development Workflow Demo

This demo shows how to integrate `yak-a11y` into your daily development workflow.

## 🚀 Quick Start

### 1. Install in Your Project

```bash
# In your website project directory
npm install --save-dev yak-a11y
```

### 2. Add Scripts to package.json

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

### 3. Development Workflow

```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Check accessibility
npm run a11y
```

## 📋 Complete Example

### Project Structure

```
my-website/
├── package.json
├── index.html
├── src/
│   ├── main.js
│   └── style.css
└── dist/          # Built files
```

### package.json

```json
{
  "name": "my-website",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "a11y": "yak-a11y --url http://localhost:5173 --verbose",
    "a11y:build": "npm run build && npm run preview & sleep 3 && yak-a11y --url http://localhost:4173 --verbose",
    "a11y:files": "yak-a11y --file dist/*.html --verbose",
    "test": "npm run a11y"
  },
  "devDependencies": {
    "yak-a11y": "^1.0.0",
    "vite": "^5.0.0"
  }
}
```

### index.html (with accessibility issues for testing)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Website</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 40px;
      }
      .low-contrast {
        color: #999;
      } /* Poor contrast */
      .button {
        padding: 10px 20px;
        background: #ddd;
        border: none;
        cursor: pointer;
      }
      .image {
        width: 300px;
        height: 200px;
        background: #f0f0f0;
      }
    </style>
  </head>
  <body>
    <h1>Welcome to My Website</h1>

    <!-- Accessibility issues for testing -->
    <img src="hero.jpg" class="image" />
    <!-- Missing alt text -->

    <p class="low-contrast">This text has poor contrast</p>

    <form>
      <input type="email" placeholder="Enter email" />
      <!-- Missing label -->
      <button class="button">Submit</button>
    </form>

    <div onclick="alert('clicked')" style="cursor: pointer;">Click me</div>
    <!-- Should be button -->
  </body>
</html>
```

## 🔄 Daily Workflow

### During Development

```bash
# 1. Start development server
npm run dev

# 2. Make changes to your code

# 3. Check accessibility (in another terminal)
npm run a11y

# 4. Fix issues found

# 5. Recheck
npm run a11y
```

### Before Deployment

```bash
# 1. Build your site
npm run build

# 2. Check built files
npm run a11y:files

# 3. Or check preview server
npm run a11y:build
```

## 🚨 Example Output

When you run `npm run a11y`, you'll see:

```bash
Starting accessibility check for: http://localhost:5173

4 accessibility violations found:

Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ Critical - Must Fix: 1 issue
■ Serious - Should Fix: 1 issue
■ Moderate - Consider Fixing: 6 issues

Issue 1
────────────────────────────────────────
 Priority: Critical - Must Fix
 Issue: Images must have alternative text
 Element: <img src="hero.jpg" class="image">

 Try these fixes:
   Add an alt attribute describing the image content

 Documentation:
   https://www.w3.org/WAI/WCAG21/quickref/#images-of-text

Issue 2
────────────────────────────────────────
 Priority: Serious - Should Fix
 Issue: Elements must meet minimum color contrast ratio thresholds
 Element: <p class="low-contrast">This text has poor contrast</p>

 Try these fixes:
   Increase the contrast between the text and its background

 Documentation:
   https://www.w3.org/WAI/WCAG21/quickref/?versions=2.0#principle1
```

## 🔧 Fixing Issues

### 1. Fix Missing Alt Text

```html
<!-- Before -->
<img src="hero.jpg" class="image" />

<!-- After -->
<img src="hero.jpg" class="image" alt="Hero image showing our product" />
```

### 2. Fix Color Contrast

```css
/* Before */
.low-contrast {
  color: #999;
}

/* After */
.low-contrast {
  color: #666;
} /* Better contrast */
```

### 3. Fix Missing Labels

```html
<!-- Before -->
<input type="email" placeholder="Enter email" />

<!-- After -->
<label for="email">Email:</label>
<input type="email" id="email" placeholder="Enter email" />
```

### 4. Fix Clickable Div

```html
<!-- Before -->
<div onclick="alert('clicked')" style="cursor: pointer;">Click me</div>

<!-- After -->
<button onclick="alert('clicked')">Click me</button>
```

## 🎯 CI/CD Integration

### GitHub Actions

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

### GitLab CI

```yaml
# .gitlab-ci.yml
image: node:18

stages:
  - build
  - test

build:
  stage: build
  script:
    - npm ci
    - npm run build

a11y:
  stage: test
  script:
    - npm run preview &
    - sleep 3
    - npx yak-a11y --url http://localhost:4173 --verbose
```

## 🎉 Success!

After fixing all issues, you'll see:

```bash
✓ No accessibility violations found
```

Your site is now accessible and ready for deployment! 🚀
