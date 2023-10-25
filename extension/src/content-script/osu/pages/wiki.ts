import { nextAbortControllerSignal } from "@src/utils/fetchUtils";
import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";

export const addFlagsWiki = async () => {
    const url = location.href;
    if (!url.includes("/wiki")) return;
    const signal = nextAbortControllerSignal();
    const posts = document.querySelectorAll(".wiki-page__content .osu-md__link");

    const flagItems: TFlagItems = [];

    for (const item of posts) {
        const href = item.getAttribute("href");
        if (!href) continue;
        const playerId = idFromOsuProfileUrl(href);
        if (playerId === null) continue;
        flagItems.push({ id: playerId, item: item as HTMLElement });
    }

    await addFlagUsers(flagItems, {
        wikiPage: true,
        signal: signal,
    });
};
