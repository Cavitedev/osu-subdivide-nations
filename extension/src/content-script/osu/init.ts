import browser from "webextension-polyfill";
import { cleanInvalidatedCacheConditionally } from "@src/utils/cache";
import { setFlagClass } from "@src/content-script/osu/flagHtml";
import { refreshOverlays, exec } from "./content";
import { updateRegionsDropdown } from "./pages/ranking";
import { loadPreferences } from "@src/utils/preferences";

export const initConfigure = (flagClass: string) => {
    cleanInvalidatedCacheConditionally();
    loadPreferences();
    setFlagClass(flagClass);

    browser.runtime.onMessage.addListener(async (obj) => {
        const { action } = obj;
        if (action && action === "osu_flag_refresh") {
            await updateRegionsDropdown();
            refreshOverlays();
            exec();
        }
    });
};
