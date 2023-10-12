// https://osu.ppy.sh/community/forums/topics/1686524?n=3

import { addFlagUser } from "@src/content-script/osu/flagHtml";
import { nextAbortControllerSignal } from "./content";

export const updateFlagsTopics = async () => {
  const url = location.href;
  if (!url.includes("osu.ppy.sh/community/forums/topics/")) return;
  const signal = nextAbortControllerSignal();
  const posts = document.querySelectorAll(".forum-post-info");

  for (let item of posts) {
    if (signal.aborted) {
      return;
    }
    const playerNameElement = item.querySelector(
      ".forum-post-info__row--username"
    ) as HTMLElement;
    const playerId = playerNameElement.getAttribute("data-user-id")!;
    addFlagUser(item as HTMLElement, playerId, {
      addDiv: false,
      addMargin: false,
      addSuperParentClone: true,
      signal: signal,
    });
  }
};
