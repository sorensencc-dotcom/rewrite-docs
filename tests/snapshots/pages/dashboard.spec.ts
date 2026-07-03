import { test, expect } from '@playwright/test';

test.describe('Dashboard Page Snapshots', () => {
  test('agents panel', async ({ page }) => {
    // This test assumes AgentsPanel is mounted on /dashboard/agents or similar
    await page.goto('/dashboard/agents');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('agents-panel.png');
  });

  test('ingestion panel', async ({ page }) => {
    await page.goto('/dashboard/ingestion');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('ingestion-panel.png');
  });

  test('drift detection panel', async ({ page }) => {
    await page.goto('/dashboard/drift');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('drift-panel.png');
  });

  test('memory panel', async ({ page }) => {
    await page.goto('/dashboard/memory');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('memory-panel.png');
  });

  test('settings panel', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    expect(await page.screenshot()).toMatchSnapshot('settings-panel.png');
  });
});
