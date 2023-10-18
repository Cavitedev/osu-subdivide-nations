// https://osu.ppy.sh/community/forums/topics/1686524?n=3

import { TFlagItems, addFlagUsers as addFlagUsers } from "@src/content-script/osu/flagHtml";
import { nextAbortControllerSignal } from "../content";

export const updateFlagsTopics = async () => {
    const url = location.href;
    if (!url.includes("osu.ppy.sh/community/forums/topics/")) return;
    const signal = nextAbortControllerSignal();
    const posts = document.querySelectorAll(".forum-post-info");

    const flagItems: TFlagItems = [];

    for (const item of posts) {
        const playerNameElement = item.querySelector(".forum-post-info__row--username") as HTMLElement;
        const playerId = playerNameElement.getAttribute("data-user-id")!;
        flagItems.push({ id: playerId, item: item as HTMLElement });
    }
    
    await addFlagUsers(flagItems, {
        addDiv: false,
        addMargin: false,
        addSuperParentClone: true,
        signal: signal,
    });
};
