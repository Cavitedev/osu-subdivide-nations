import { TFlagItems } from "@src/utils/html";
import { getContent } from "../content";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";

export const enhanceDraftPage = async () => {
    const pathname = location.pathname;
    if (pathname !== "/draft") return;

    const playersContainers = getContent()?.querySelector(".draft");
    if (!playersContainers) return;

    const players = playersContainers.querySelectorAll(".players .player") ?? [];

    await addFlagsDraft(players);
};

const addFlagsDraft = async (players: NodeListOf<Element>) => {
    const flagItems: TFlagItems = [];

    for (const player of players) {
        const usernameElement = (player as HTMLElement).querySelector(".minimized-username") as HTMLElement;
        const playerId = idFromOsuProfileUrl(usernameElement.getAttribute("href")!);
        if (!playerId) continue;
        flagItems.push({ id: playerId, item: player as HTMLElement });
    }

    await addFlagUsers(flagItems, {
        inlineInsteadOfFlex: true,
    });
};
