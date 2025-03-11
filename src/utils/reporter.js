import chalk from 'chalk';
import Table from 'cli-table3';

function wrapText(text, width) {
  if (!text) {
    return [''];
  }
  
  // First, split by newlines to preserve intentional line breaks
  return text.split('\n').flatMap(paragraph => {
    const words = paragraph.split(' ');
    const lines = [];
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

function isDarkTheme() {
  // Most terminals set this env var for dark mode
  if (process.env.COLORFGBG) {
    const [fg, bg] = process.env.COLORFGBG.split(';');
    return parseInt(bg) < parseInt(fg);
  }
  // Fallback to checking if common dark mode env vars are set
  return process.env.TERM_PROGRAM_VERSION >= '400' || 
         process.env.COLORTERM === 'truecolor' || 
         process.env.FORCE_COLOR === '3';
}

function getImpactColor(impact) {
  const isDark = isDarkTheme();
  const colors = {
    critical: chalk.hex('#ff4444'),  // Bright red for both themes
    serious: isDark ? chalk.hex('#ffd700') : chalk.hex('#b58900'),  // Gold/Yellow
    moderate: isDark ? chalk.hex('#00ffff') : chalk.hex('#0087bd'),  // Cyan/Blue
    minor: isDark ? chalk.hex('#98fb98') : chalk.hex('#2aa198')   // Light green/Teal
  };
  return colors[impact] || chalk.white;
}

const DOCS_URLS = {
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

function enhanceFailureSummary(summary, violation) {
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

function cleanHtmlString(html) {
  return html
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\s*([<>])\s*/g, '$1')  // Remove spaces around < and >
    .replace(/\s+\/>/g, '/>')  // Clean up self-closing tags
    .trim();
}

function formatViolation(violation, node) {
  let summary = node.failureSummary || '';
  summary = enhanceFailureSummary(summary, violation);
  summary = summary
    .replace(/^Fix (any|all) of the following:\s*/m, '')
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.trim())
    .join('\n');

  return {
    impact: violation.impact,
    help: violation.help,
    element: cleanHtmlString(node.html),
    fixes: summary || getUserFriendlyDescription(violation)
  };
}

async function generateReport(results, options = {}) {
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
  const impactCounts = violations.reduce((acc, v) => {
    acc[v.impact] = (acc[v.impact] || 0) + v.nodes.length;
    return acc;
  }, {});

  console.log('\nSummary');
  console.log('━'.repeat(40));
  
  Object.entries(impactCounts)
    .sort((a, b) => {
      const priority = { critical: 4, serious: 3, moderate: 2, minor: 1 };
      return priority[b[0]] - priority[a[0]];
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
      const printLine = (content, indent = 0) => {
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
      
      printLine(chalk.cyan('Try these fixes:'), 1);
      fixes.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^(Try these fixes:|Required fixes:)\s*/, '').trim())
        .forEach(fix => printLine(fix, 3));
      
      console.log('─'.repeat(boxWidth));
    });
  });

  console.log();

  if (options.verbose) {
    // Group violations by type and count occurrences
    const issueGroups = violations.reduce((acc, violation) => {
      if (!acc[violation.help]) {
        acc[violation.help] = {
          count: 0,
          elements: 0,
          tags: new Set(),
          helpUrl: violation.helpUrl,
          docs: getRelevantDocs(violation)
        };
      }
      acc[violation.help].count++;
      acc[violation.help].elements += violation.nodes.length;
      violation.tags.forEach(tag => acc[violation.help].tags.add(tag));
      return acc;
    }, {});

    // Documentation Table
    const docsTable = new Table({
      head: [
        chalk.white('Issue Type'),
        chalk.white('Resources')
      ],
      colWidths: [30, 90],
      wordWrap: true,
      wrapOnWordBoundary: true,
      style: {
        head: [],
        border: [],
        'padding-left': 1,
        'padding-right': 1
      }
    });

    Object.entries(issueGroups).forEach(([issue, data]) => {
      const instanceText = data.count === 1 ? 'instance' : 'instances';
      const elementText = data.elements === 1 ? 'element' : 'elements';
      const issueWithCount = `${chalk.bold(issue)}\n\n${chalk.cyan('→')} ${chalk.cyan(`${data.count} ${instanceText}`)}\n${chalk.cyan('→')} ${chalk.cyan(`${data.elements} affected ${elementText}`)}`;
      
      const docs = [
        `WCAG: ${Array.from(data.tags).filter(tag => tag.startsWith('wcag')).join(', ')}`,
        `Docs: ${data.helpUrl}`,
        ...data.docs.map(doc => `${doc.description}: ${DOCS_URLS[doc.key]}`)
      ].join('\n');

      docsTable.push([issueWithCount, docs]);
    });

    console.log(chalk.cyan('\nDetailed Documentation:'));
    console.log(docsTable.toString() + '\n');
  }
}

function getRelevantDocs(violation) {
  const docs = [];
  
  // Map common accessibility issues to various documentation sources
  if (violation.id.includes('image-alt') || violation.id.includes('img-alt')) {
    docs.push(
      { key: 'mdn-alt-text', description: 'MDN: Alt Text Documentation' },
      { key: 'a11y-forms', description: 'A11Y Project: Writing Better Alt Text' }
    );
  }
  
  if (violation.id.includes('heading') || violation.id.includes('h1')) {
    docs.push(
      { key: 'mdn-headings', description: 'MDN: HTML Headings Guide' }
    );
  }
  
  if (violation.id.includes('link-name') || violation.id.includes('link-text')) {
    docs.push(
      { key: 'webaim-forms', description: 'WebAIM: Link Accessibility' }
    );
  }
  
  if (violation.id.includes('button')) {
    docs.push(
      { key: 'webaim-forms', description: 'WebAIM: Accessible Forms' }
    );
  }
  
  if (violation.id.includes('color-contrast')) {
    docs.push(
      { key: 'webaim-contrast', description: 'WebAIM: Contrast Checker Guide' },
      { key: 'a11y-contrast', description: 'A11Y Project: Understanding Color Contrast' },
      { key: 'deque-contrast', description: 'Deque: Color Contrast Requirements' }
    );
  }
  
  if (violation.id.includes('keyboard') || violation.id.includes('focus')) {
    docs.push(
      { key: 'webaim-aria', description: 'WebAIM: Keyboard Accessibility' }
    );
  }
  
  if (violation.id.includes('aria')) {
    docs.push(
      { key: 'mdn-aria', description: 'MDN: ARIA Documentation' },
      { key: 'webaim-aria', description: 'WebAIM: ARIA Techniques' },
      { key: 'a11y-aria', description: 'A11Y Project: ARIA Landmark Roles' },
      { key: 'deque-aria', description: 'Deque: ARIA Requirements' }
    );
  }
  
  return docs;
}

function getUserFriendlyDescription(violation) {
  const descriptions = {
    // Landmark issues
    'region': 'Your page content needs to be organized into clear sections using HTML landmarks. ' +
             'These help screen readers navigate your page. Add these elements around your content:\n' +
             '  • <header> or role="banner" - for your site header\n' +
             '  • <nav> or role="navigation" - for navigation menus\n' +
             '  • <main> or role="main" - for your main content (required!)\n' +
             '  • <aside> or role="complementary" - for sidebar content\n' +
             '  • <footer> or role="contentinfo" - for your page footer\n' +
             '  • <section> with aria-label - for content sections\n' +
             '  • <search> or role="search" - for search functionality',
    'landmark-one-main': 'Every page must have exactly one <main> element or role="main" landmark to indicate the primary content. ' +
                        'This helps screen reader users quickly navigate to your main content.',
    
    // Image issues
    'image-alt': 'Images need alternative text to be accessible to screen reader users. Add alt="" for decorative images ' +
                 'or meaningful descriptions for informative images. Good alt text:\n' +
                 '  • Is concise but descriptive\n' +
                 '  • Conveys the image\'s purpose\n' +
                 '  • Doesn\'t start with "image of" or "picture of"',
    
    // Heading issues
    'heading-order': 'Headings must follow a logical order (h1 → h2 → h3). Don\'t skip levels.\n' +
                     '  • Use one <h1> for the main page title\n' +
                     '  • Use <h2> for major sections\n' +
                     '  • Use <h3> and beyond for subsections\n' +
                     'This creates a clear document outline for screen reader users.',
    
    // Color and contrast issues
    'color-contrast': 'Text must have sufficient contrast with its background to be readable:\n' +
                      '  • Normal text needs a contrast ratio of at least 4.5:1\n' +
                      '  • Large text (18pt+) needs at least 3:1\n' +
                      'Use a contrast checker tool to verify your colors.',
    
    // Form issues
    'label': 'Every form control needs a label that\'s properly associated with the input:\n' +
             '  • Use the <label> element with a for="input-id" attribute\n' +
             '  • Or wrap the input with the label\n' +
             '  • For custom controls, use aria-label or aria-labelledby',
    
    // Link issues
    'link-name': 'Links must have descriptive text that makes sense out of context:\n' +
                 '  • Avoid generic text like "click here" or "learn more"\n' +
                 '  • Make the purpose clear from the link text alone\n' +
                 '  • If using an icon/image, add descriptive alt text or aria-label',
    
    // Button issues
    'button-name': 'Buttons must have clear, descriptive labels:\n' +
                   '  • Use meaningful text inside button elements\n' +
                   '  • For icon buttons, add aria-label describing the action\n' +
                   '  • Avoid generic labels like "button" or "click me"',
    
    // ARIA issues
    'aria-valid-attr': 'ARIA attributes must be valid and correctly used:\n' +
                       '  • Check for typos in attribute names\n' +
                       '  • Use correct values for each attribute\n' +
                       '  • Only use ARIA when HTML semantics won\'t work',
    
    // Document structure
    'document-title': 'Every page needs a descriptive <title> that identifies its content:\n' +
                      '  • Make it unique and descriptive\n' +
                      '  • Include the site name\n' +
                      '  • Put the specific page name first',
    
    // Focus management
    'focus-order': 'Keyboard focus must follow a logical order:\n' +
                   '  • Match the visual layout\n' +
                   '  • Ensure all interactive elements are focusable\n' +
                   '  • Use tabindex="0" only when HTML semantics won\'t work'
  };

  // First try to match the exact violation ID
  if (descriptions[violation.id]) {
    return descriptions[violation.id];
  }

  // Then try to match partial IDs (e.g., 'image-alt' matches 'image-alt-text')
  for (const [key, description] of Object.entries(descriptions)) {
    if (violation.id.includes(key)) {
      return description;
    }
  }

  // Fall back to the default description if no match found
  return violation.description;
}

function getUserFriendlyImpact(impact) {
  const impacts = {
    'critical': 'Critical - Must Fix',
    'serious': 'High Priority - Should Fix',
    'moderate': 'Medium Priority - Consider',
    'minor': 'Low Priority - Optional'
  };
  return impacts[impact] || impact;
}

export { generateReport };
