import { test, expect } from './fixtures';

test('Osu! user test', async ({ page }) => {
  await page.goto('https://osu.ppy.sh/users/4871211');
  page.waitForSelector('.profile-info__info .profile-info__flag a');
  await expect(page.locator('.profile-info__info .profile-info__flag-text')).toHaveText('Spain / Castile-La Mancha');
});