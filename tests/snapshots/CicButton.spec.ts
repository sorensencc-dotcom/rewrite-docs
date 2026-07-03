import { test, expect } from "@playwright/test";

test.describe("CicButton Snapshots", () => {
  test("default state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-button--default");
    expect(await page.screenshot()).toMatchSnapshot("button-default.png");
  });

  test("hover state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-button--default");
    await page.hover(".cic-button");
    expect(await page.screenshot()).toMatchSnapshot("button-hover.png");
  });

  test("disabled state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-button--disabled");
    expect(await page.screenshot()).toMatchSnapshot("button-disabled.png");
  });

  test("loading state", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-button--loading");
    expect(await page.screenshot()).toMatchSnapshot("button-loading.png");
  });
});
