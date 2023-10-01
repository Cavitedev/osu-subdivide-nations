import { cleanCacheConditionally } from "@src/utils/cache";
import { setFlagClass } from "@src/utils/flagHtml";
import { refreshOverlays, init } from "./content";
import { updateRegionsDropdown } from "./ranking";


export const initConfigure = (flagClass: string)  => {
    cleanCacheConditionally();


setFlagClass(flagClass);

chrome.runtime.onMessage.addListener(async (obj, sender, respone) => {
  const {  action } = obj;
  if (action && action === "osu_flag_refresh") {
    await updateRegionsDropdown();
    refreshOverlays();
    init();
  }
});
}