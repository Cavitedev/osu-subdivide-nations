import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";

const initObserver = new MutationObserver(() => {
    addFlagsTournamentManagement();
    initObserver.disconnect();
});

const tabObserver = new MutationObserver(() => {
    addFlagsTournamentManagement();
});

export const addFlagsTournamentManagement = async () => {
    const url = location.href;
    if (!url.includes("/tournament-manager/")) return;

    const container = document.querySelector("app-tournament-edit");
    if (!container) return;

    const bodyContainer = container.querySelector(".active-setting");
    if (!bodyContainer) {
        initObserver.observe(container, { childList: true });
        return;
    }

    const tabs = container.querySelectorAll(".settings .setting");
    for (const tab of tabs) {
        tabObserver.observe(tab, { attributes: true });
    }

    addFlagsStaff(bodyContainer as HTMLElement);
    addFlagsParticipants(bodyContainer as HTMLElement);
};

const addFlagsStaff = async (parent: HTMLElement) => {
    const url = location.href;
    if (!url.includes("#staff")) return;

    const elements = parent.querySelectorAll(".all-staff .staff") ?? [];

    const flagItems: TFlagItems = [];

    for (const element of elements) {
        const playerElement = element.querySelector(".username");
        const href = playerElement?.getAttribute("href");
        if (!href) continue;
        const playerId = idFromOsuProfileUrl(href);
        if(!playerId) continue;
        flagItems.push({ id: playerId, item: playerElement as HTMLElement });
    }

    await addFlagUsers(flagItems);
};

const addFlagsParticipants = async (parent: HTMLElement) => {
    const url = location.href;
    if (!url.includes("#participants") && !url.includes("#draft")) return;

    const allPlayers = parent.querySelector(".all-players");
    if (!allPlayers) return;

    const playersPageObserver = new MutationObserver(() => {
        addFlagsParticipants(parent);
    });
    playersPageObserver.observe(allPlayers, { childList: true });

    const elements = allPlayers.querySelectorAll(".all-players .player") ?? [];

    const flagItems: TFlagItems = [];

    for (const element of elements) {
        const playerElement = element.querySelector(".username");
        const href = playerElement?.getAttribute("href");
        const playerId = idFromOsuProfileUrl(href);
        if(!playerId) continue;
        flagItems.push({ id: playerId, item: playerElement as HTMLElement });
    }

    await addFlagUsers(flagItems);
};
