import { test, expect } from '@playwright/test';

test.describe('Table Snapshots', () => {
  test('default with data', async ({ page }) => {
    await page.goto('/?path=/story/cic-table--default');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('table-default.png');
  });

  test('zebra striping', async ({ page }) => {
    await page.goto('/?path=/story/cic-table--striped');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('table-striped.png');
  });

  test('hover row', async ({ page }) => {
    await page.goto('/?path=/story/cic-table--default');
    await page.waitForLoadState('networkidle');
    await page.locator('tbody tr').first().hover();
    expect(await page.screenshot()).toMatchSnapshot('table-hover.png');
  });

  test('with sorting', async ({ page }) => {
    await page.goto('/?path=/story/cic-table--sortable');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('table-sortable.png');
  });
});
