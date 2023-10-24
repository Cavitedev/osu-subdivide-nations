import { TFlagItems } from "@src/utils/html";
import { getContent } from "../content";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";

const initObserver = new MutationObserver(() => {
    updateFlagsHome();
    initObserver.disconnect();
});

const teamTabObserver = new MutationObserver(() => {
    updateFlagsHome();
});

export const updateFlagsHome = async () => {
    const url = location.href;
    if (!url.includes("/home")) return;
    
    const registerBox = getContent()?.querySelector(".tournament-box.register");
    if(!registerBox) return;

    const teamForm = registerBox.querySelector(".team-form");
    if(!teamForm) {
        initObserver.observe(registerBox, {childList: true});
        return;
    };

    const teamFormTabs = teamForm.querySelectorAll(".team-form-header .team-form-header-button");
    for(const tab of teamFormTabs){
        teamTabObserver.observe(tab, {attributes: true});
    }


    const playersContainers = teamForm.querySelector(".team-form .body");
    if(!playersContainers) return;
    const players = getContent()?.querySelectorAll(".team-players .username") ?? []

    const flagItems: TFlagItems = [];    
    
    for(const player of players){
        const playerId = idFromOsuProfileUrl(player.getAttribute("href")!);
        flagItems.push({ id: playerId, item: player as HTMLElement });
    }

    await addFlagUsers(flagItems);

}