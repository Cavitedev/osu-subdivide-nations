import { TFlagItems } from "@src/utils/html";
import { getContent } from "../content";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUser, addFlagUsers } from "../flagHtml";
import { nextAbortControllerSignal } from "@src/utils/fetchUtils";

const initObserver = new MutationObserver(() => {
    updateFlagsHome();
    initObserver.disconnect();
});

const tabObserver = new MutationObserver(() => {
    updateFlagsHome();
});

export const updateFlagsHome = async () => {
    const url = location.href;
    if (!url.includes("/home")) return;
    
    const registerBox = getContent()?.querySelector(".tournament-box.register");
    if(!registerBox) return;
    if(registerBox.children.length < 3){
        initObserver.observe(registerBox, {childList: true});
        return;
    }
    const signal = nextAbortControllerSignal();

    updateTeamFlags(registerBox, signal);
    updatePlayerFlag(registerBox, signal);

}

const updatePlayerFlag = async(registerBox: Element, signal: AbortSignal) => {
    const userForm = registerBox.querySelector(".user-form");
    if(!userForm) return;
    const formTabs = userForm.querySelectorAll(".user-form-header .user-form-header-button");
    for(const tab of formTabs){
        tabObserver.observe(tab, {attributes: true});
    }


    const playersContainers = userForm.querySelector(".body");
    if(!playersContainers) return;
    const player = playersContainers.querySelector(".data .username")
    if(!player) return;

    const playerId = idFromOsuProfileUrl(player.getAttribute("href")!);
    addFlagUser(player as HTMLElement, playerId, {signal: signal});
}

const updateTeamFlags = async(registerBox: Element, signal: AbortSignal) => {
    const teamForm = registerBox.querySelector(".team-form");
    if(!teamForm) return;
    const formTabs = teamForm.querySelectorAll(".team-form-header .team-form-header-button");
    for(const tab of formTabs){
        tabObserver.observe(tab, {attributes: true});
    }


    const playersContainers = teamForm.querySelector(".body");
    if(!playersContainers) return;
    const players = playersContainers.querySelectorAll(".team-players .username") ?? []

    const flagItems: TFlagItems = [];    
    
    for(const player of players){
        const playerId = idFromOsuProfileUrl(player.getAttribute("href")!);
        flagItems.push({ id: playerId, item: player as HTMLElement });
    }

    await addFlagUsers(flagItems, {signal:signal});
}