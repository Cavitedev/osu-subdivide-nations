import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUser } from "../flagHtml";

const searchUserDialogObserver = new MutationObserver((mutations) => {
    addFlagSearchUser(mutations[0].target as HTMLElement);
});

export const enhanceSearchUser = async (parent: HTMLElement) => {
    const dialogContent = parent.querySelector(".mat-mdc-dialog-content");
    if (!dialogContent) return;
    searchUserDialogObserver.observe(dialogContent, { childList: true });
};

const addFlagSearchUser = async (parent: HTMLElement) => {

    const playerElement = parent.querySelector(".username");
    const href = playerElement?.getAttribute("href");
    const playerId = idFromOsuProfileUrl(href);
    if (!playerId) return;

    await addFlagUser(playerElement as HTMLElement, playerId);


}
