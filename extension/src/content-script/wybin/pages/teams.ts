import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";
import { getContent } from "../content";



const onLoadedMutation = new MutationObserver(() => {
    updateFlagsTeams(true);
});

export const updateFlagsTeams = async (update = false) => {
    const url = location.href;
    if (!url.includes("/teams") ) return;

    const navigationElement = document.querySelector("body > app-root > app-tournament-view > div.navigation-bar > div.navigation")!;
    onLoadedMutation.observe(navigationElement, {childList: true});
    if(!update) return;


    const players = getContent()?.querySelectorAll(".players .player") ?? []

    const flagItems: TFlagItems = [];    
    
    for(const player of players){
        const usernameElement = player.querySelector(".username>a") as HTMLElement;
        const playerId = idFromOsuProfileUrl(usernameElement.getAttribute("href")!);
        flagItems.push({ id: playerId, item: player as HTMLElement });
    }

    await addFlagUsers(flagItems);

    fixTeamsHtml(players);

}

const fixTeamsHtml = (players: NodeListOf<Element> | never[]) => {
    for(const player of players){
        player.setAttribute("style", "grid-template-columns: 32px 52px 4fr 1fr;");
        const flagParent = player.querySelector(".flag") as HTMLElement | undefined;
        flagParent?.setAttribute("style", "justify-content: left;");

    }
}