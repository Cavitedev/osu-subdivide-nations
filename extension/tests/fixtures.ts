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

  // No way to get the extension ID from the context, So I set it manuallty.
  extensionId: async ({ context }, use) => {
    console.log(context.serviceWorkers());
    await use("fmadiabbijdijjcidogjenmjeekgmdko");

    // context.

    // let [background] = context.serviceWorkers();
    // console.log(background);
    // if (!background)
    //   background = await context.waitForEvent('serviceworker');

    // const extensionId = background.url().split('/')[2];
    // currentExtensionId = extensionId;
    // await use(extensionId);
  },
});
export const expect = test.expect;

export const goPopUp = async (page: Page, extensionId: string) => {
    await page.goto(`chrome-extension://${extensionId}/src/ui/popup/index.html`);
}

export const selectLanguage = async (page: Page, extensionId: string, option:string) => {

    await goPopUp(page, extensionId);
    await page.selectOption('select#region-languages-select', { value: option });

}