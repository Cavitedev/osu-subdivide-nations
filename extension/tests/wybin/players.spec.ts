import { test, expect } from '../fixtures';


test('wybin players test', async ({ page }) => {
  await page.goto('https://wybin.xyz/tournaments/polish-catch-tournament-2k23/players');
  await page.waitForSelector('.players .player .data .username div', { timeout: 10000 });

    const playersWith2FlagsLength = await page.$$eval('.players .player .data .username div', 
    (elements) => 
    elements.map((el) => el.querySelectorAll('.fi').length)
    );
    for (const playerFlagsLength of playersWith2FlagsLength) {
        expect(playerFlagsLength).toBe(2);

    }

});
