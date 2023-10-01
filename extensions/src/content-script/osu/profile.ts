
// https://osu.ppy.sh/users/4871211/fruits

import { addFlagUser } from "@src/utils/flagHtml";
import { isNumber } from "@src/utils/utils";
import { idFromProfileUrl } from "./content";

export const profileMutationObserverInit = new MutationObserver((_) => {
    updateFlagsProfile();
  });
  
export const updateFlagsProfile = async () => {

    const linkItem = document.querySelector(
        "body > div.osu-layout__section.osu-layout__section--full > div"
      ) as HTMLElement;
      profileMutationObserverInit.observe(linkItem, {
        attributes: false,
        childList: true,
        subtree: false,
      });

    const url = location.href;
    const playerId = idFromProfileUrl(url);
    if (!isNumber(playerId)) {
      return;
    }
  
    const flagElement = document.querySelector(".profile-info");
    if (!flagElement) {
      return;
    }
    const regionName = await addFlagUser(flagElement as HTMLElement, playerId);
      const countryNameElement = flagElement.querySelector(
        ".profile-info__flag-text"
      )!;
      countryNameElement.textContent =
        countryNameElement.textContent?.split(" / ")[0] + ` / ${regionName}` ?? regionName;
  
  };