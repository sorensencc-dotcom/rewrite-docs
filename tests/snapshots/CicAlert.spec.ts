import { test, expect } from "@playwright/test";

test.describe("CicAlert Snapshots", () => {
  test("info variant", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-alert--info");
    expect(await page.screenshot()).toMatchSnapshot("alert-info.png");
  });

  test("success variant", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-alert--success");
    expect(await page.screenshot()).toMatchSnapshot("alert-success.png");
  });

  test("warning variant", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-alert--warning");
    expect(await page.screenshot()).toMatchSnapshot("alert-warning.png");
  });

  test("danger variant", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-alert--danger");
    expect(await page.screenshot()).toMatchSnapshot("alert-danger.png");
  });

  test("with close button", async ({ page }) => {
    await page.goto("/storybook/?path=/story/cic-alert--with-close");
    expect(await page.screenshot()).toMatchSnapshot("alert-with-close.png");
  });
});
