// https://osu.ppy.sh/community/forums/topics/1686524?n=3

import { addFlagUser } from "@src/utils/flagHtml";
import { nextFunctionId, runningId } from "./content";

export const updateFlagsTopics = async () => {
    const functionId = nextFunctionId();
   const  posts = document.querySelectorAll(".forum-post-info");
  
    for (let item of posts) {
      if (functionId != runningId) {
        return;
      }
      const playerNameElement = item.querySelector(".forum-post-info__row--username") as HTMLElement;
      const playerId = playerNameElement.getAttribute("data-user-id")!;
      addFlagUser(item as HTMLElement, playerId, false, false, true);
    }
  };