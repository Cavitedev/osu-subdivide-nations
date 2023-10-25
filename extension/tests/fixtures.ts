import { test as base, chromium, type BrowserContext, Page } from '@playwright/test';
import path from 'path';



export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../build/chromium');
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--headless=new`,
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});
export const expect = test.expect;

export const selectLanguage = async (page: Page, option:string) => {

    await page.goto('chrome-extension://fmadiabbijdijjcidogjenmjeekgmdko/ui/popup/popup.html');
    await page.selectOption('select#region-languages-select', { value: option });

}