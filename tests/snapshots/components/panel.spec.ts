import { test, expect } from '@playwright/test';

test.describe('Panel Snapshots', () => {
  test('default', async ({ page }) => {
    await page.goto('/?path=/story/cic-panel--default');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('panel-default.png');
  });

  test('with elevation', async ({ page }) => {
    await page.goto('/?path=/story/cic-panel--elevated');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('panel-elevated.png');
  });

  test('compact density', async ({ page }) => {
    await page.goto('/?path=/story/cic-panel--compact');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('panel-compact.png');
  });
});
