import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";
import { getContent } from "../content";

export const updateFlagsPlayers = async () => {
    const url = location.href;
    if (!url.includes("/players")) return;


    const players = getContent()?.querySelectorAll(".players .player") ?? []

    await updateFlagsPlayersList(players);

}

export const updateFlagsPlayersList = async (players: NodeListOf<Element> | never[]) => {
    const flagItems: TFlagItems = [];    
    
    for(const player of players){
        let usernameElement = (player as HTMLElement).querySelector(".username") as HTMLElement;
        const playerId = idFromOsuProfileUrl(usernameElement.getAttribute("href")!);
        flagItems.push({ id: playerId, item: player as HTMLElement });
    }

    await addFlagUsers(flagItems);
};