import { TFlagItems, addFlagUsers } from "@src/content-script/osu/flagHtml";
import { idFromProfileUrl, nextAbortControllerSignal } from "../content";

// https://osu.ppy.sh/home/friends
const setActualFriendsObserver = new MutationObserver(() => {
    updateFlagsFriends();
    setActualFriendsObserver.disconnect();
});

const updateFlagsFriendsObserver = new MutationObserver(() => {
    updateFlagsFriends();
});

export const updateFlagsFriends = async () => {
    const url = location.href;
    if (!url.includes("osu.ppy.sh/home/friends")) return;

    const queryParameters = url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const view = urlParameters.get("view");
    if (view == "brick") {
        return;
    }

    const signal = nextAbortControllerSignal();

    const allFriendsElement = document.querySelector(".t-changelog-stream--all");
    if (allFriendsElement) {
        updateFlagsFriendsObserver.observe(document.querySelector(".t-changelog-stream--all")!, {
            attributes: true,
            attributeFilter: ["href"],
        });
    } else {
        setActualFriendsObserver.observe(document.querySelector(".js-react--friends-index")!, {
            childList: true,
        });
        return;
    }

    const friendsList = document.querySelector(".user-list")!.querySelectorAll(".user-card__details");

    const flagItems: TFlagItems = [];
    for (const item of friendsList) {

        const playerNameElement = item.querySelector(".user-card__username") as HTMLElement;
        const playerId = idFromProfileUrl(playerNameElement.getAttribute("href")!);
        flagItems.push({ id: playerId, item: item as HTMLElement });
    }
    await addFlagUsers(flagItems, { addDiv: true, addMargin: true, signal: signal });

};
