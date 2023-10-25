import { test, expect, selectLanguage } from '../fixtures';

test('Osu! user test', async ({ page }) => {
  await page.goto('https://osu.ppy.sh/users/4871211');
  page.waitForSelector('.profile-info__info .profile-info__flag a .flag-country');
  await expect(page.locator('.profile-info__info .profile-info__flag-text')).toHaveText('Spain / Castile-La Mancha');
});


test('Osu! user test Spanish', async ({ page }) => {
  await selectLanguage(page, 'NAT');
  await page.goto('https://osu.ppy.sh/users/4871211');
  page.waitForSelector('.profile-info__info .profile-info__flag a .flag-country');
  await expect(page.locator('.profile-info__info .profile-info__flag-text')).toHaveText('Españita / Castilla-La Mancha');
});