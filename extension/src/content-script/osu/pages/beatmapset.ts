import { addFlagUser, addFlagUsers } from "@src/content-script/osu/flagHtml";
import { TFlagItems } from "@src/utils/html";
import { nextAbortControllerSignal } from "@src/utils/fetchUtils";

// https://osu.ppy.sh/beatmapsets/1508588#fruits/3734628

// This is run after the elements are first injected
const tableBodyClass = "beatmap-scoreboard-table__body";

const initFinishedMutationObserver = new MutationObserver((_) => {
    addFlagsBeatmapsets();
});

const tabsMutationObserver = new MutationObserver(() => {
    addFlagsBeatmapsets();
});

export const addFlagsBeatmapsets = async () => {
    const url = location.href;
    if (!url.includes("osu.ppy.sh/beatmapsets/")) return;
    const signal = nextAbortControllerSignal();

    const linkItem = document.querySelector(".beatmapset-scoreboard__main");
    if (linkItem) {
        initFinishedMutationObserver.observe(linkItem, {
            childList: true,
        });
    } else {
        initFinishedMutationObserver.observe(document.querySelector(".js-react--beatmapset-page")!, {
            childList: true,
        });
    }

    const diffs = document.querySelector(".beatmapset-beatmap-picker");
    if (diffs) {
        for (let i = 0; i < diffs.children.length; i++) {
            tabsMutationObserver.observe(diffs.children[i], { attributes: true });
        }
    }

    const playMods = document.querySelector(".game-mode--beatmapset");
    if (playMods) {
        for (let i = 0; i < playMods.children.length; i++) {
            const playmod = playMods.children[i];
            const anchor = playmod.querySelector("a");
            if (!anchor) continue;
            tabsMutationObserver.observe(anchor, { attributes: true });
        }
    }

    const tabs = linkItem?.parentElement!.querySelector(".page-tabs");
    if (tabs) {
        for (let i = 0; i < tabs.children.length; i++) {
            tabsMutationObserver.observe(tabs.children[i], { attributes: true });
        }
    }

    const mods = linkItem?.parentElement!.querySelector(".beatmapset-scoreboard__mods");
    if (mods) {
        for (let i = 0; i < mods.children.length; i++) {
            tabsMutationObserver.observe(mods.children[i], { attributes: true });
        }
    }

    const leaderboardParent = document.querySelector(".beatmapset-scoreboard__main")?.firstChild as HTMLElement;
    if (!leaderboardParent || leaderboardParent.classList.contains("beatmapset-scoreboard__notice")) return;

    initFinishedMutationObserver.disconnect();

    const rankingTable = leaderboardParent.querySelector(".beatmap-scoreboard-table") as HTMLElement;
    if (rankingTable) rankingTableObverver.observe(rankingTable, { childList: true });

    const tableBody = rankingTable.querySelector(`.${tableBodyClass}`) as HTMLElement;
    await updateTableRanks(tableBody, signal);

    updateTopLeaderboard(leaderboardParent, signal);
};

const updateTopLeaderboard = async (leaderboardParent: HTMLElement, signal: AbortSignal) => {
    //beatmap-scoreboard-top

    const topScoreElements = leaderboardParent.querySelectorAll(".beatmap-score-top__user-box");
    if (!topScoreElements) {
        return;
    }

    for (const topScoreElement of topScoreElements) {
        const topScoreUserElement = topScoreElement.querySelector(".beatmap-score-top__username");
        const topScoreUserId = (topScoreUserElement as HTMLElement).getAttribute("data-user-id");
        if (topScoreUserId) {
            await addFlagUser(topScoreElement as HTMLElement, topScoreUserId, {
                addDiv: true,
                addMargin: true,
                signal: signal,
            });
        }
    }
};

// For osu plus add-on or other add-ons
let osuPlusBody;

const rankingTableObverver = new MutationObserver((mutations) => {
    osuPlusBody = mutations.find((m) => {
        const addedNode = m.addedNodes?.[0] as HTMLElement;
        const classList = addedNode.classList;
        return classList.contains("osuplus-table") && classList.contains("beatmap-scoreboard-table__table");
    })?.addedNodes[0] as HTMLElement | undefined;
    if (osuPlusBody) {
        const osuPlusTable = osuPlusBody.querySelector(`.${tableBodyClass}`) as HTMLElement;
        osuPlusBodyObserver(osuPlusTable).observe(osuPlusTable, {
            childList: true,
        });
    }
});

const osuPlusBodyObserver = (osuPlusBody: HTMLElement) =>
    new MutationObserver(() => {
        const signal = nextAbortControllerSignal();
        updateTableRanks(osuPlusBody, signal);
    });

const updateTableRanks = async (tableBody: HTMLElement, signal: AbortSignal) => {
    // Children
    const items = tableBody.children;

    const flagItems: TFlagItems = [];
    for (const item of items) {
        const playerNameElement = item.querySelector(".beatmap-scoreboard-table__cell-content--user-link");
        const playerId = playerNameElement?.getAttribute("data-user-id");
        if (playerId) {
            flagItems.push({ item: item as HTMLElement, id: playerId });
        }
    }
    await addFlagUsers(flagItems, {
        addDiv: false,
        addMargin: true,
        addSuperParentClone: false,
        insertInsideOriginalElement: true,
        signal: signal,
    });
};
