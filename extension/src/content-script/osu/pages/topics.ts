// https://osu.ppy.sh/community/forums/topics/1686524?n=3

import { addFlagUsers as addFlagUsers } from "@src/content-script/osu/flagHtml";
import { TFlagItems } from "@src/utils/html";
import { nextAbortControllerSignal } from "@src/utils/fetchUtils";

const topicsLoadedObserver = new MutationObserver((mutations) => {
    const newPosts = [...mutations[0].addedNodes].filter(a => a.nodeType === 1).map(a => (a as Element).querySelector(".forum-post-info")).filter(post => post !== null) as Element[];
    return addFlagsPostsTopics(newPosts);
});

export const updateFlagsTopics = async () => {
    const url = location.href;
    if (!url.includes("osu.ppy.sh/community/forums/topics/")) return;
    const signal = nextAbortControllerSignal();

    const page = document.querySelector(".osu-page--forum-topic");
    if(!page) return;


    topicsLoadedObserver.observe(page, {childList: true});

    const posts = page.querySelectorAll(".forum-post-info");
    return addFlagsPostsTopics(posts, signal);
};

const addFlagsPostsTopics = async (posts: Iterable<Element>, signal?: AbortSignal) => {
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
}
