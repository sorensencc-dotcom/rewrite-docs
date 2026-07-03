import { test, expect } from "@playwright/test";

test.describe("CicPanel Snapshots", () => {
  test("default state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-panel--default");
    expect(await page.screenshot()).toMatchSnapshot("panel-default.png");
  });

  test("with header", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-panel--with-header");
    expect(await page.screenshot()).toMatchSnapshot("panel-with-header.png");
  });

  test("with footer", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-panel--with-footer");
    expect(await page.screenshot()).toMatchSnapshot("panel-with-footer.png");
  });

  test("loading state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-panel--loading");
    expect(await page.screenshot()).toMatchSnapshot("panel-loading.png");
  });
});
