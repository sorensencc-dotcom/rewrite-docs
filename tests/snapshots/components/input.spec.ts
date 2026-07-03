import { test, expect } from '@playwright/test';

test.describe('Input Snapshots', () => {
  test('default', async ({ page }) => {
    await page.goto('/?path=/story/cic-input--default');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('input-default.png');
  });

  test('focus', async ({ page }) => {
    await page.goto('/?path=/story/cic-input--default');
    await page.waitForLoadState('networkidle');
    await page.locator('input').first().focus();
    expect(await page.screenshot()).toMatchSnapshot('input-focus.png');
  });

  test('filled', async ({ page }) => {
    await page.goto('/?path=/story/cic-input--default');
    await page.waitForLoadState('networkidle');
    await page.locator('input').first().fill('Sample text');
    expect(await page.screenshot()).toMatchSnapshot('input-filled.png');
  });

  test('disabled', async ({ page }) => {
    await page.goto('/?path=/story/cic-input--disabled');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('input-disabled.png');
  });
});
