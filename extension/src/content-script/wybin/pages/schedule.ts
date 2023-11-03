import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { addFlagUsers } from "../flagHtml";
import { getContent } from "../content";

const loadingObserver = new MutationObserver(() => {
    addFlagsSchedule();
    loadingObserver.disconnect();
});

const onLoadedMutation = new MutationObserver(() => {
    addFlagsSchedule();
});

const onContentChangeObserver = new MutationObserver(() => {
    addFlagsSchedule();
});

export const addFlagsSchedule = async () => {
    const url = location.href;
    if (!url.includes("/schedule") && !url.includes("/staff-schedule")) return;

    const navigationElement = document.querySelector(
        "body > app-root > app-tournament-view > div.navigation-bar > div.navigation",
    )!;
    onLoadedMutation.observe(navigationElement, { childList: true });

    const activeStage = getContent()?.querySelector(".active-stage") ?? null;

    if (!activeStage) return;
    const loading = activeStage.querySelector(".loading") ?? null;
    if (loading) {
        loadingObserver.observe(loading.parentElement!, { childList: true, subtree: true });
        return;
    }

    onContentChangeObserver.observe(activeStage, { attributes: true });

    if (!url.includes("schedule#qualifiers")) return;

    const flagElements = activeStage.querySelectorAll(".lobbies .fi") ?? [];

    const flagItems: TFlagItems = [];

    for (const flagElement of flagElements) {
        const playerElement = flagElement.parentElement;
        const href = playerElement?.getAttribute("href");
        const playerId = idFromOsuProfileUrl(href);
        if (!playerId) continue;
        flagItems.push({ id: playerId, item: playerElement as HTMLElement });
    }

    await addFlagUsers(flagItems, {
        inlineInsteadOfFlex: true,
    });
};
