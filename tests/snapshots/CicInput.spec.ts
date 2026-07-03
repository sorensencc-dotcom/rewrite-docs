import { test, expect } from "@playwright/test";

test.describe("CicInput Snapshots", () => {
  test("default state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-input--default");
    expect(await page.screenshot()).toMatchSnapshot("input-default.png");
  });

  test("focused state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-input--default");
    await page.focus(".cic-input");
    expect(await page.screenshot()).toMatchSnapshot("input-focused.png");
  });

  test("disabled state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-input--disabled");
    expect(await page.screenshot()).toMatchSnapshot("input-disabled.png");
  });

  test("with error", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-input--error");
    expect(await page.screenshot()).toMatchSnapshot("input-error.png");
  });
});
