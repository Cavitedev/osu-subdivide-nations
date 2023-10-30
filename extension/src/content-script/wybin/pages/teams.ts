import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";

const onLoadedMutation = (parent: HTMLElement) =>
    new MutationObserver(() => {
        updateFlagTeams(parent);
    });

export const addFlagsTeams = async () => {
    const url = location.href;
    if (!url.includes("/teams")) return;

    watchFlagTeams(document.body);
};

export const watchFlagTeams = async (parent: HTMLElement) => {
    const navigationElement = document.querySelector(
        "body > app-root > app-tournament-view > div.navigation-bar > div.navigation",
    )!;
    onLoadedMutation(parent).observe(navigationElement, { childList: true });
};

export const updateFlagTeams = async (parent: HTMLElement) => {
    const players = parent.querySelectorAll(".players .player") ?? [];
    await updateTeamFlagsPlayersList(players);
};

export const updateTeamFlagsPlayersList = async (players: NodeListOf<Element> | never[]) => {
    const flagItems: TFlagItems = [];

    for (const player of players) {
        const usernameElement = (player.querySelector(".username>a") ?? player.querySelector("a.username")) as HTMLElement;
        const playerId = idFromOsuProfileUrl(usernameElement.getAttribute("href")!);
        if (!playerId) continue;
        flagItems.push({ id: playerId, item: player as HTMLElement });
    }

    await addFlagUsers(flagItems);

    fixTeamsHtml(players);
};

const fixTeamsHtml = (players: NodeListOf<Element> | never[]) => {
    for (const player of players) {
        player.setAttribute("style", "grid-template-columns: 32px 52px 4fr 1fr;");
        const flagParent = player.querySelector(".flag") as HTMLElement | undefined;
        flagParent?.setAttribute("style", "justify-content: left;");
    }
};
