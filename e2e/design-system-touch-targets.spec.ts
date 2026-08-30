import { test, expect } from './helpers/test-fixtures';

/**
 * Design System Foundation: 48×48px Touch Target Tests
 *
 * These tests assert that all interactive elements (buttons, links, inputs)
 * meet the minimum 48×48px bounding box recommended by WCAG 2.5.8 / Material
 * Design touch target guidelines. The 48px value aligns with our 8pt grid
 * (48 = 6 × 8).
 *
 * These tests are marked with `test()` — they define the target state
 * for the design system, not the current state. As components are migrated to
 * use the 8pt grid spacing tokens (e.g., `p-grid-6`, `min-h-grid-6`), remove
 * the `.fixme` annotation to activate each test.
 *
 * Container queries are supported natively by Tailwind CSS v4 — no plugin or
 * additional configuration is needed.
 */

const MIN_TOUCH_TARGET_PX = 48;

/**
 * Measures the bounding box of visible interactive elements and returns
 * those that fail the minimum touch target size. Excludes inline text links
 * (WCAG 2.5.8 explicitly exempts inline links within text blocks).
 */
async function getInteractiveElementSizes(page: import('@playwright/test').Page) {
  return page.evaluate((minSize: number) => {
    const selectors = [
      'button:not([aria-hidden="true"])',
      'input:not([type="hidden"]):not([aria-hidden="true"])',
      'select:not([aria-hidden="true"])',
      'textarea:not([aria-hidden="true"])',
      '[role="button"]:not([aria-hidden="true"])',
      '[role="tab"]:not([aria-hidden="true"])',
      '[role="menuitem"]:not([aria-hidden="true"])',
    ];

    // Standalone links only — exclude inline text links (WCAG 2.5.8 exemption)
    const standaloneLinks = document.querySelectorAll(
      'a[href]:not([aria-hidden="true"])'
    );

    const elements = [
      ...document.querySelectorAll(selectors.join(', ')),
      ...Array.from(standaloneLinks).filter((el) => {
        // Inline links are those whose parent is a block of text (p, li, span, etc.)
        const parent = el.parentElement;
        if (!parent) return true;
        const parentTag = parent.tagName.toLowerCase();
        return !['p', 'li', 'span', 'td', 'th', 'label', 'blockquote'].includes(
          parentTag
        );
      }),
    ];

    const violations: Array<{
      tag: string;
      text: string;
      width: number;
      height: number;
      selector: string;
    }> = [];

    for (const el of elements) {
      const rect = el.getBoundingClientRect();

      // Skip invisible / off-screen elements
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.bottom < 0 || rect.right < 0) continue;

      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      if (width < minSize || height < minSize) {
        const tagName = el.tagName.toLowerCase();
        const text = (el.textContent ?? '').trim().slice(0, 40);
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className
          ? `.${String(el.className).split(' ').slice(0, 3).join('.')}`
          : '';

        violations.push({
          tag: tagName,
          text,
          width,
          height,
          selector: `${tagName}${id}${classes}`,
        });
      }
    }

    return violations;
  }, MIN_TOUCH_TARGET_PX);
}

/**
 * Shared assertion: scan the current page for touch target violations and
 * fail with a descriptive message listing every offending element.
 */
async function assertNoTouchTargetViolations(
  page: import('@playwright/test').Page,
  label: string
) {
  const violations = await getInteractiveElementSizes(page);

  if (violations.length > 0) {
    console.log(
      `[Touch Target Violations] ${violations.length} elements below 48×48px on ${label}:\n` +
        violations
          .map(
            (v) => `  ${v.selector} "${v.text}" — ${v.width}×${v.height}px`
          )
          .join('\n')
    );
  }

  expect(
    violations,
    `${violations.length} interactive element(s) are smaller than ${MIN_TOUCH_TARGET_PX}×${MIN_TOUCH_TARGET_PX}px on ${label}`
  ).toHaveLength(0);
}

test.describe('Design System: 48×48px Touch Targets', () => {
  test(
    'landing page interactive elements meet 48×48px minimum bounding box',
    async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await assertNoTouchTargetViolations(page, 'landing page');
    }
  );

  test(
    'login page interactive elements meet 48×48px minimum bounding box',
    async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await assertNoTouchTargetViolations(page, 'login page');
    }
  );

  test(
    'landing page interactive elements meet 48×48px on mobile viewport',
    async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await assertNoTouchTargetViolations(page, 'mobile landing page');
    }
  );
});
