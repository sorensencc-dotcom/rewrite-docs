import { test, expect } from "@playwright/test";
test.describe("Alert Visual Tests", () => {
    test("default state", async ({ page }) => {
        await page.goto("/?path=/story/cic-alert--default");
        expect(await page.screenshot()).toMatchSnapshot("alert-default.png");
    });
    test("hover state", async ({ page }) => {
        await page.goto("/?path=/story/cic-alert--hover");
        await page.hover(".cic-alert");
        expect(await page.screenshot()).toMatchSnapshot("alert-hover.png");
    });
    test("disabled state", async ({ page }) => {
        await page.goto("/?path=/story/cic-alert--disabled");
        expect(await page.screenshot()).toMatchSnapshot("alert-disabled.png");
    });
});
//# sourceMappingURL=Alert.spec.js.map