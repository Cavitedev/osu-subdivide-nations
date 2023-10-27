import { Page } from "@playwright/test";
import { test, expect, selectLanguage } from "../fixtures";

test("Osu! user test", async ({ page }) => {
    await page.goto("https://osu.ppy.sh/users/4871211");
    await page.waitForSelector(".profile-info__info .profile-info__flag a .flag-country");
    await expect(page.locator(".profile-info__info .profile-info__flag-text")).toHaveText("Spain / Castile-La Mancha");
    await testRankingsProfile(page);
  });

const testRankingsProfile = async (page: Page) => {
    await page.waitForSelector(".respektiveScore");
    await expect(page.locator(".respektiveScore")).toBeVisible();
    await page.waitForSelector(".cavitedevRegionalRank");
    await expect(page.locator(".cavitedevRegionalRank")).toBeVisible();
};
test("Osu! user test native language", async ({ page, extensionId }) => {
    await selectLanguage(page, extensionId, "NAT");
    await page.goto("https://osu.ppy.sh/users/4871211");
    await page.waitForSelector(".profile-info__info .profile-info__flag a .flag-country");
    await expect(page.locator(".profile-info__info .profile-info__flag-text")).toHaveText(
        "Españita / Castilla-La Mancha",
    );
    await page.click(".game-mode-link");
    await expect(page.locator(".profile-info__info .profile-info__flag-text")).toHaveText(
        "Españita / Castilla-La Mancha",
    );
});
