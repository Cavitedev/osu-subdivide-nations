import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";

export const updateFlagsPlayers = async () => {
    const url = location.href;
    if (!url.includes("/players")) return;


    const players = document.querySelectorAll(".players .player")

    const flagItems: TFlagItems = [];    
    
    for(const player of players){
        const usernameElement = player.querySelector(".username") as HTMLElement;
        const playerId = idFromOsuProfileUrl(usernameElement.getAttribute("href")!);
        flagItems.push({ id: playerId, item: player as HTMLElement });
    }

    await addFlagUsers(flagItems);

}