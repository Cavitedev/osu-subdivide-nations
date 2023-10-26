import { goPopUp, expect, test } from "../../fixtures";

test("Popup Clean cache", async ({ page, extensionId }) => {

    await goPopUp(page, extensionId);
    
    let read = await page.evaluate(async () => {
        await chrome.storage.local.set({ x: "A" });
        return await chrome.storage.local.get("x");
    });

    
    expect(read!.x).toBe("A");

    await page.click("button#cache-button");

    read = await page.evaluate(async () => {
        return await chrome.storage.local.get("x");
      });
      expect(read.x).toBeUndefined();
});
