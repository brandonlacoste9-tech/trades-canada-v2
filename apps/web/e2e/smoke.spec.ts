import { test, expect } from "@playwright/test";

test.describe("Trades-Canada smoke", () => {
  test("health API returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { status?: string };
    expect(body.status).toBe("ok");
  });

  test("root redirects to /en", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "commit" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("marketing home loads", async ({ page }) => {
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  });

  test("French home loads", async ({ page }) => {
    await page.goto("/fr", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  });
});
