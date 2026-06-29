import { test, expect } from "@playwright/test";

test.describe("Panel Visual Tests", () => {
  test("default state", async ({ page }) => {
    await page.goto("/?path=/story/cic-panel--default");
    expect(await page.screenshot()).toMatchSnapshot("panel-default.png");
  });

  test("hover state", async ({ page }) => {
    await page.goto("/?path=/story/cic-panel--hover");
    await page.hover(".cic-panel");
    expect(await page.screenshot()).toMatchSnapshot("panel-hover.png");
  });

  test("disabled state", async ({ page }) => {
    await page.goto("/?path=/story/cic-panel--disabled");
    expect(await page.screenshot()).toMatchSnapshot("panel-disabled.png");
  });
});
