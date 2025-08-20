import chalk from 'chalk';
import Table from 'cli-table3';
import { AxeResults, Result } from 'axe-core';

interface ReportOptions {
  verbose?: boolean;
}

interface FormattedViolation {
  impact: string;
  help: string;
  element: string;
  fixes: string;
}

function wrapText(text: string | undefined, width: number): string[] {
  if (!text) {
    return [''];
  }
  
  // First, split by newlines to preserve intentional line breaks
  return text.split('\n').flatMap(paragraph => {
    const words = paragraph.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      // If the word itself is longer than the width, split it
      if (word.length > width) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        for (let i = 0; i < word.length; i += width) {
          lines.push(word.slice(i, i + width));
        }
        continue;
      }

      // Check if adding this word would exceed the width
      const withWord = currentLine ? currentLine + ' ' + word : word;
      if (withWord.length <= width) {
        currentLine = withWord;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  });
}

function isDarkTheme(): boolean {
  // Most terminals set this env var for dark mode
  if (process.env.COLORFGBG) {
    const [fg, bg] = process.env.COLORFGBG.split(';');
    return parseInt(bg) < parseInt(fg);
  }
  // Fallback to checking if common dark mode env vars are set
  const termVersion = process.env.TERM_PROGRAM_VERSION || '0';
  return termVersion >= '400' || 
         process.env.COLORTERM === 'truecolor' || 
         process.env.FORCE_COLOR === '3';
}

import { Chalk } from 'chalk';

function getImpactColor(impact: string): typeof chalk {
  const isDark = isDarkTheme();
  const colors: Record<string, typeof chalk> = {
    critical: chalk.hex('#ff4444'),  // Bright red for both themes
    serious: isDark ? chalk.hex('#ffd700') : chalk.hex('#b58900'),  // Gold/Yellow
    moderate: isDark ? chalk.hex('#00ffff') : chalk.hex('#0087bd'),  // Cyan/Blue
    minor: isDark ? chalk.hex('#98fb98') : chalk.hex('#2aa198')   // Light green/Teal
  };
  return colors[impact] || chalk.white;
}

const DOCS_URLS: Record<string, string> = {
  // WCAG Documentation
  'wcag2a': 'https://www.w3.org/WAI/WCAG21/quickref/?versions=2.0#principle1',
  'wcag2aa': 'https://www.w3.org/WAI/WCAG21/quickref/?versions=2.0#principle1',
  'wcag21a': 'https://www.w3.org/WAI/WCAG21/quickref/#principle1',
  'wcag21aa': 'https://www.w3.org/WAI/WCAG21/quickref/#principle1',

  // MDN Web Docs
  'mdn-alt-text': 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#alt',
  'mdn-headings': 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements',
  'mdn-aria': 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA',
  'mdn-forms': 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/forms',
  
  // A11Y Project
  'a11y-contrast': 'https://www.a11yproject.com/posts/what-is-color-contrast/',
  'a11y-aria': 'https://www.a11yproject.com/posts/aria-landmark-roles/',
  'a11y-forms': 'https://www.a11yproject.com/posts/how-to-write-better-alt-text/',
  
  // WebAIM
  'webaim-contrast': 'https://webaim.org/articles/contrast/',
  'webaim-aria': 'https://webaim.org/techniques/aria/',
  'webaim-forms': 'https://webaim.org/techniques/forms/',
  
  // Deque University
  'deque-aria': 'https://dequeuniversity.com/rules/axe/4.6/aria-required-attr',
  'deque-contrast': 'https://dequeuniversity.com/rules/axe/4.6/color-contrast',
  'deque-forms': 'https://dequeuniversity.com/rules/axe/4.6/label'
};

function enhanceFailureSummary(summary: string, violation: Result): string {
  if (violation.id === 'region') {
    return summary.replace(
      'Some page content is not contained by landmarks',
      'Content must be inside a landmark region (use <main>, <nav>, etc. or elements with role="main", role="navigation", etc.)'
    );
  }
  if (violation.id === 'landmark-one-main') {
    return summary.replace(
      'Document does not have a main landmark',
      'Document must have exactly one <main> element or an element with role="main"'
    );
  }
  return summary;
}

function cleanHtmlString(html?: string): string {
  if (!html) {
    return 'Unknown element';
  }
  return html
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\s*([<>])\s*/g, '$1')  // Remove spaces around < and >
    .replace(/\s+\/>/g, '/>')  // Clean up self-closing tags
    .trim();
}

function formatViolation(violation: Result, node: any): FormattedViolation {
  let summary = node.failureSummary || '';
  summary = enhanceFailureSummary(summary, violation);
  summary = summary
    .replace(/^Fix (any|all) of the following:\s*/m, '')
    .split('\n')
    .filter((line: string) => line.trim())
    .map((line: string) => line.trim())
    .join('\n');

  return {
    impact: violation.impact || 'unknown',
    help: violation.help || '',
    element: cleanHtmlString(node.html),
    fixes: summary || getUserFriendlyDescription(violation)
  };
}

async function generateReport(results: AxeResults | null, options: ReportOptions = {}): Promise<void> {
  if (!results) {
    console.log(chalk.red('\n❌ No results to report - the page could not be analyzed\n'));
    return;
  }

  const { violations } = results;
  
  if (violations.length === 0) {
    console.log(chalk.green('\n✓ No accessibility violations found\n'));
    return;
  }

  const violationWord = violations.length === 1 ? 'violation' : 'violations';
  console.log(chalk.bold(`\n${violations.length} accessibility ${violationWord} found:`));

  // Summary Section
  const impactCounts: Record<string, number> = violations.reduce((acc, v) => {
    acc[v.impact || 'unknown'] = (acc[v.impact || 'unknown'] || 0) + v.nodes.length;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nSummary');
  console.log('━'.repeat(40));
  
  Object.entries(impactCounts)
    .sort((a, b) => {
      const priority: Record<string, number> = { critical: 4, serious: 3, moderate: 2, minor: 1 };
      return (priority[b[0]] || 0) - (priority[a[0]] || 0);
    })
    .forEach(([impact, count]) => {
      console.log(
        `${getImpactColor(impact)('■')} ${getUserFriendlyImpact(impact)}: ${count} ${count === 1 ? 'issue' : 'issues'}`
      );
    });

  // Detailed Violations
  console.log('\nDetailed Issues');
  console.log('━'.repeat(40));

  violations.forEach((violation, index) => {
    violation.nodes.forEach((node, nodeIndex) => {
      const { impact, help, element, fixes } = formatViolation(violation, node);
      
      const boxWidth = 76;
      
      console.log(`\n${chalk.bold(`Issue ${index + 1}${nodeIndex > 0 ? `.${nodeIndex + 1}` : ''}`)}`);
      console.log('─'.repeat(boxWidth));
      
      // Helper function to print a line with proper padding
      const printLine = (content: string, indent = 0) => {
        const lines = wrapText(content, boxWidth - indent);
        lines.forEach(line => {
          console.log(`${' '.repeat(indent)}${line}`);
        });
      };

      // Print each section
      printLine(`${chalk.bold('Priority:')} ${getImpactColor(impact)(getUserFriendlyImpact(impact))}`, 1);
      console.log();
      
      printLine(`${chalk.bold('Issue:')} ${help}`, 1);
      console.log();
      
      printLine(`${chalk.bold('Element:')} ${element}`, 1);
      console.log();
      
      printLine(`${chalk.bold('Try these fixes:')}`, 1);
      printLine(fixes, 3);

      // Add documentation links in verbose mode
      if (options.verbose) {
        const docs = getRelevantDocs(violation);
        if (docs.length > 0) {
          console.log();
          printLine(`${chalk.bold('Detailed Documentation:')}`, 1);
          docs.forEach(url => printLine(url, 3));
        }
      }
    });
  });
}

function getRelevantDocs(violation: Result): string[] {
  const docs: string[] = [];

  // Add WCAG documentation based on tags
  if (violation.tags) {
    violation.tags.forEach(tag => {
      if (DOCS_URLS[tag]) {
        docs.push(DOCS_URLS[tag]);
      }
    });
  }

  // Add specific documentation based on violation type
  switch (violation.id) {
    case 'image-alt':
      docs.push(DOCS_URLS['mdn-alt-text']);
      docs.push(DOCS_URLS['a11y-forms']);
      break;
    case 'aria-required-attr':
    case 'aria-roles':
      docs.push(DOCS_URLS['mdn-aria']);
      docs.push(DOCS_URLS['webaim-aria']);
      docs.push(DOCS_URLS['deque-aria']);
      break;
    case 'color-contrast':
      docs.push(DOCS_URLS['a11y-contrast']);
      docs.push(DOCS_URLS['webaim-contrast']);
      docs.push(DOCS_URLS['deque-contrast']);
      break;
    case 'label':
    case 'form-field-multiple-labels':
      docs.push(DOCS_URLS['mdn-forms']);
      docs.push(DOCS_URLS['webaim-forms']);
      docs.push(DOCS_URLS['deque-forms']);
      break;
  }

  return [...new Set(docs)].filter(Boolean);
}

function getUserFriendlyDescription(violation: Result): string {
  const descriptions: Record<string, string> = {
    'image-alt': 'Add an alt attribute to the image describing its content or purpose. If the image is decorative, use alt="".',
    'button-name': 'Add text content to the button or use aria-label/aria-labelledby to provide an accessible name.',
    'color-contrast': 'Increase the contrast between the text and its background. Use a color contrast checker to verify.',
    'landmark-one-main': 'Add exactly one <main> element or element with role="main" to identify the main content.',
    'page-has-heading-one': 'Add an <h1> element at the beginning of your main content.',
    'region': 'Wrap content in appropriate landmark regions like <main>, <nav>, <aside>, etc.',
    'document-title': 'Add a descriptive <title> element in the <head> of your document.',
    'html-has-lang': 'Add a lang attribute to the <html> element specifying the page language.',
    'label': 'Associate form controls with labels using the for attribute or by nesting.',
    'link-name': 'Ensure links have accessible names through text content or aria-label.',
    'list': 'Use appropriate list markup: <ul> for unordered lists, <ol> for ordered lists.',
    'listitem': 'List items (<li>) must be contained within <ul> or <ol> elements.',
    'aria-required-attr': 'Add the required ARIA attributes for this role.',
    'aria-roles': 'Use only valid ARIA roles and ensure they are appropriate for the element.'
  };

  return descriptions[violation.id || ''] || 
         'Review the element and ensure it follows accessibility best practices.';
}

function getUserFriendlyImpact(impact: string): string {
  const impacts: Record<string, string> = {
    critical: 'Critical - Must Fix',
    serious: 'Serious - Should Fix',
    moderate: 'Moderate - Consider Fixing',
    minor: 'Minor - Consider Fixing'
  };
  return impacts[impact] || 'Unknown Impact';
}

export { generateReport, type ReportOptions };
