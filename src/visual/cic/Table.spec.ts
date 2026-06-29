import { test, expect } from "@playwright/test";

test.describe("Table Visual Tests", () => {
  test("default state", async ({ page }) => {
    await page.goto("/?path=/story/cic-table--default");
    expect(await page.screenshot()).toMatchSnapshot("table-default.png");
  });

  test("hover state", async ({ page }) => {
    await page.goto("/?path=/story/cic-table--hover");
    await page.hover(".cic-table");
    expect(await page.screenshot()).toMatchSnapshot("table-hover.png");
  });

  test("disabled state", async ({ page }) => {
    await page.goto("/?path=/story/cic-table--disabled");
    expect(await page.screenshot()).toMatchSnapshot("table-disabled.png");
  });
});
