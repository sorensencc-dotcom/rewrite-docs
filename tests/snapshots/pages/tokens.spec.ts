import { test, expect } from '@playwright/test';

test.describe('Token Drift Detection', () => {
  test('design tokens dashboard', async ({ page }) => {
    // Token drift is detected when baseline snapshot differs from current render
    // Any change in color, spacing, typography, or interaction will trigger failure
    await page.goto('/design-system/dashboard/tokens');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('tokens-dashboard.png');
  });

  test('color tokens', async ({ page }) => {
    await page.goto('/design-system/tokens/colors');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('tokens-colors.png');
  });

  test('spacing tokens', async ({ page }) => {
    await page.goto('/design-system/tokens/spacing');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('tokens-spacing.png');
  });

  test('typography tokens', async ({ page }) => {
    await page.goto('/design-system/tokens/typography');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('tokens-typography.png');
  });
});
