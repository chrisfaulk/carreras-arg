import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/register",
  "/login",
  "/verify",
  "/forgot",
  "/reset",
  "/universities",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/dashboard/profile",
];

for (const route of ROUTES) {
  test(`sin violaciones axe en ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}
