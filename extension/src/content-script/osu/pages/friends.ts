import { addFlagUsers } from "@src/content-script/osu/flagHtml";
import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { nextAbortControllerSignal } from "@src/utils/fetchUtils";

// https://osu.ppy.sh/home/friends
const setActualFriendsObserver = new MutationObserver(() => {
    addFlagsFriends();
    setActualFriendsObserver.disconnect();
});

const updateFlagsFriendsObserver = new MutationObserver(() => {
    addFlagsFriends();
});

export const addFlagsFriends = async () => {
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
        const playerId = idFromOsuProfileUrl(playerNameElement.getAttribute("href")!);
        flagItems.push({ id: playerId, item: item as HTMLElement });
    }
    await addFlagUsers(flagItems, { addDiv: true, addMargin: true, signal: signal });
};
