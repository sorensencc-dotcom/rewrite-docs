import { test, expect } from "@playwright/test";

test.describe("Button Visual Tests", () => {
  test("default state", async ({ page }) => {
    await page.goto("/?path=/story/cic-button--default");
    expect(await page.screenshot()).toMatchSnapshot("button-default.png");
  });

  test("hover state", async ({ page }) => {
    await page.goto("/?path=/story/cic-button--hover");
    await page.hover(".cic-button");
    expect(await page.screenshot()).toMatchSnapshot("button-hover.png");
  });

  test("disabled state", async ({ page }) => {
    await page.goto("/?path=/story/cic-button--disabled");
    expect(await page.screenshot()).toMatchSnapshot("button-disabled.png");
  });
});
