import { addFlagUsers } from "@src/content-script/osu/flagHtml";
import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { nextAbortControllerSignal } from "@src/utils/fetchUtils";

// https://osu.ppy.sh/home/search?mode=user&query=Deif&page=1
const initPageObserver = new MutationObserver(() => {
    updateFlagsSearch();
    initPageObserver.disconnect();
});



export const updateFlagsSearch = async () => {
    const url = location.href;
    if (!url.includes("osu.ppy.sh/home/search")) return;

    const queryParameters = url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const view = urlParameters.get("mode");
    if (view !== "user") {
        return;
    }

    const signal = nextAbortControllerSignal();

    const allcardsElement = document.querySelector(".search-result .user-cards");
    if (allcardsElement) {

    } else {
        initPageObserver.observe(document.querySelector(".js-react--user-cards")!, {
            childList: true,
        });
        return;
    }


    const friendsList = allcardsElement.querySelectorAll(".user-card");

    const flagItems: TFlagItems = [];
    for (const item of friendsList) {
        const playerNameElement = item.querySelector(".user-card__background-container") as HTMLElement;
        const playerId = idFromOsuProfileUrl(playerNameElement.getAttribute("href")!);
        flagItems.push({ id: playerId, item: item as HTMLElement });
    }
    await addFlagUsers(flagItems, { addDiv: true, addMargin: true, signal: signal });

};
