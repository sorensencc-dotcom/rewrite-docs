import { test, expect } from '@playwright/test';

test.describe('Button Snapshots', () => {
  test('default', async ({ page }) => {
    await page.goto('/?path=/story/cic-button--primary');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('button-default.png');
  });

  test('hover state', async ({ page }) => {
    await page.goto('/?path=/story/cic-button--primary');
    await page.waitForLoadState('networkidle');
    await page.locator('button').first().hover();
    expect(await page.screenshot()).toMatchSnapshot('button-hover.png');
  });

  test('disabled', async ({ page }) => {
    await page.goto('/?path=/story/cic-button--disabled');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('button-disabled.png');
  });

  test('loading', async ({ page }) => {
    await page.goto('/?path=/story/cic-button--loading');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('button-loading.png');
  });
});
