import { test, expect } from '@playwright/test';

test.describe('Alert Snapshots', () => {
  test('info alert', async ({ page }) => {
    await page.goto('/?path=/story/cic-alert--info');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('alert-info.png');
  });

  test('warning alert', async ({ page }) => {
    await page.goto('/?path=/story/cic-alert--warning');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('alert-warning.png');
  });

  test('error alert', async ({ page }) => {
    await page.goto('/?path=/story/cic-alert--error');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('alert-error.png');
  });

  test('success alert', async ({ page }) => {
    await page.goto('/?path=/story/cic-alert--success');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('alert-success.png');
  });

  test('dismissible', async ({ page }) => {
    await page.goto('/?path=/story/cic-alert--dismissible');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('alert-dismissible.png');
  });
});
