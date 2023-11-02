import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUser } from "../flagHtml";

export const enhanceStaffRegistration = async (parent: HTMLElement) => {
    const url = location.href;
    if (!url.includes("/staff-registration")) return;

    const staffActiveRegistrationEl = parent.querySelector(".active-staff-registration");

    if (!staffActiveRegistrationEl) return;
    const playerElement = staffActiveRegistrationEl.querySelector(".username");
    const href = playerElement?.getAttribute("href");
    const playerId = idFromOsuProfileUrl(href);
    if (!playerId) return;
    await addFlagUser(playerElement as HTMLElement, playerId);
};
