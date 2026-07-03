import { test, expect } from "@playwright/test";

test.describe("{{Name}} Visual Tests", () => {
  test("default state", async ({ page }) => {
    await page.goto("/?path=/story/cic-{{name}}--default");
    expect(await page.screenshot()).toMatchSnapshot("{{name}}-default.png");
  });

  test("hover state", async ({ page }) => {
    await page.goto("/?path=/story/cic-{{name}}--hover");
    await page.hover(".cic-{{name}}");
    expect(await page.screenshot()).toMatchSnapshot("{{name}}-hover.png");
  });

  test("disabled state", async ({ page }) => {
    await page.goto("/?path=/story/cic-{{name}}--disabled");
    expect(await page.screenshot()).toMatchSnapshot("{{name}}-disabled.png");
  });
});
