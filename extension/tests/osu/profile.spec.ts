import { test, expect, selectLanguage } from '../fixtures';

test('Osu! user test', async ({ page }) => {
  await page.goto('https://osu.ppy.sh/users/4871211');
  await page.waitForSelector('.profile-info__info .profile-info__flag a .flag-country');
  await expect(page.locator('.profile-info__info .profile-info__flag-text')).toHaveText('Spain / Castile-La Mancha');
});


test('Osu! user test native language', async ({ page }) => {
  await selectLanguage(page, 'NAT');
  await page.goto('https://osu.ppy.sh/users/4871211');
  await page.waitForSelector('.profile-info__info .profile-info__flag a .flag-country');
  await expect(page.locator('.profile-info__info .profile-info__flag-text')).toHaveText('Españita / Castilla-La Mancha');
  await page.click(".game-mode-link");
  await expect(page.locator('.profile-info__info .profile-info__flag-text')).toHaveText('Españita / Castilla-La Mancha');
});

