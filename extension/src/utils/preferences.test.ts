import { describe, test } from "@jest/globals";
import mockBrowser from "../__mocks__/browser";
import { loadPreferences } from "./preferences";
import { expect } from "@playwright/test";

describe("Load preferences", () => {
    test("Load empty preferences. Default preferences prevail", async () => {
        const getStorage = async (): Promise<Record<string, any>> => {
            return {};
        };

        mockBrowser.storage.sync.get.mockImplementation(getStorage);

        const preferences = await loadPreferences();
        expect(preferences.scoreRanking).toEqual(true);
        expect(preferences.kudosuRanking).toEqual(false);
    });
});
