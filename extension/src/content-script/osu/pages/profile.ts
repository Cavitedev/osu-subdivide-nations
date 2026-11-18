import { addFlagUser } from "@src/content-script/osu/flagHtml";
// https://osu.ppy.sh/users/4871211/fruits

import { isNumber } from "@src/utils/utils";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { IFetchError } from "@src/utils/fetchUtils";
import { osuScoreRanking } from "@src/utils/external/respektive";
import {
    getActiveLanguageCode,
    getActiveLanguageCodeForKey,
    getLocMsg,
    waitLastLanguageIsLoaded,
} from "@src/utils/languageChrome";
import osuNameToCode from "../osuNameToCode";
import { getCountryName } from "@src/utils/flagsJsonUtils";
import { TosuWorldIdSuccess, osuWorldUser } from "@src/utils/external/osuWorld";
import { preferences, waitPreferencesToLoad } from "@src/utils/preferences";

// Executed when opening a tab or going back and forth so this runs too early
export const profileMutationObserverInit = new MutationObserver((_) => {
    profileMutationObserverInit.disconnect();
    enhanceProfile();
});

const profileStatsSelector = ".profile-detail-stats-v2, .profile-detail-stats";
const profileStatsValuesSelector = ".profile-detail-stats__values, .profile-detail-stats-v2__values";
let profileStatsObserver: MutationObserver | undefined;
const ranksBeingAdded = new WeakSet<HTMLElement>();

export const enhanceProfile = async (signal?: AbortSignal) => {
    const url = location.href;
    if (!location.href.includes("osu.ppy.sh/users")) {
        return;
    }
    const linkItem = document.querySelector(
        "body > div.osu-layout__section.osu-layout__section--full > div",
    ) as HTMLElement;
    profileMutationObserverInit.observe(linkItem, {
        childList: true,
    });

    const playerId = idFromOsuProfileUrl(url);
    if (!playerId || !isNumber(playerId)) {
        return;
    }

    const flagElement = document.querySelector(".profile-info");
    if (!flagElement) {
        return;
    }

    const currentMod = getCurrentMod();
    const profileDetail = document.querySelector(".profile-detail");
    profileStatsObserver?.disconnect();

    const addRanksToCurrentStats = () => {
        if (!profileDetail || !currentMod) return Promise.resolve([]);

        const statsV2 = profileDetail.querySelector(".profile-detail-stats-v2");
        const ranksElement =
            statsV2?.querySelector<HTMLElement>(profileStatsValuesSelector) ??
            profileDetail
                .querySelector(".profile-detail-stats")
                ?.querySelector<HTMLElement>(profileStatsValuesSelector);
        if (!ranksElement) return Promise.resolve([]);

        profileDetail
            .querySelectorAll<HTMLElement>(profileStatsValuesSelector)
            .forEach((element) => {
                if (element === ranksElement) return;
                element.querySelectorAll(`.${tagRanks.regionalRank}, .${tagRanks.scoreRank}`).forEach((rank) => {
                    rank.remove();
                });
            });

        return addRanksToElement(ranksElement, playerId, currentMod, signal);
    };

    if (profileDetail) {
        profileStatsObserver = new MutationObserver((mutations) => {
            const statsChanged = mutations.some((mutation) =>
                [...mutation.addedNodes, ...mutation.removedNodes].some(
                    (node) =>
                        node instanceof HTMLElement &&
                        (node.matches(profileStatsSelector) ||
                            node.querySelector(profileStatsSelector) !== null ||
                            node.matches(profileStatsValuesSelector)),
                ),
            );
            if (statsChanged) void addRanksToCurrentStats();
        });
        profileStatsObserver.observe(profileDetail, { childList: true, subtree: true });
    }

    addRegionalFlagProfile(flagElement as HTMLElement, playerId);

    const results = await addRanksToCurrentStats();
    if (results.filter(Boolean).length >= 3) {
        // There's no space so force 2 rows to avoid visual glitches
        forceStatsInAnotherRow();
    }
};

const addRanksToElement = async (
    ranksElement: HTMLElement,
    playerId: string,
    mode: string,
    signal?: AbortSignal,
) => {
    if (ranksBeingAdded.has(ranksElement)) return [];
    ranksBeingAdded.add(ranksElement);

    try {
        return await Promise.all([
            addRegionalRank(ranksElement, playerId, mode, signal),
            addScoreRank(ranksElement, playerId, mode, signal),
        ]);
    } finally {
        ranksBeingAdded.delete(ranksElement);
    }
};

const addRegionalFlagProfile = async (flagElement: HTMLElement, playerId: string, signal?: AbortSignal) => {
    const flagResult = await addFlagUser(flagElement as HTMLElement, playerId, { addMargin: false, signal: signal });
    if (!flagResult) return;
    const { countryCode, countryName, regionName } = flagResult;
    if (!countryCode) return;

    const countryNameElement = flagElement.querySelector(".profile-info__flag-text")!;
    
    let countryText = flagElement.querySelector("span.flag-country")?.getAttribute("original-title");
    const originalCountryCode = osuNameToCode(countryText!);

    let replaceText: string;
    if (originalCountryCode === countryCode) {
        countryText = countryNameElement.textContent?.split(" / ")[0];
        replaceText = `${countryName ? countryName : countryText}${regionName ? ` / ${regionName}` : ""}`;
    } else {
        const regionCountryName = await getCountryName(countryCode!);
        replaceText = `${countryName} | ${regionCountryName} / ${regionName}`;
    }

    //Changes CSS for 3 columns
    let anchorElement = flagElement.querySelector(".profile-info__flag")!
    anchorElement.classList.add("profile-info__flag-region");

    countryNameElement.textContent = replaceText;
};

const tagRanks = {
    scoreRank: "respektiveScore",
    regionalRank: "cavitedevRegionalRank",
};

const tagsOrder = [tagRanks.regionalRank, tagRanks.scoreRank];

/**
 * 
 * @returns True if the rank is visisble. Same with other methods
 */
async function addRegionalRank(ranksElement: HTMLElement, playerId: string, mode: string, signal?: AbortSignal) {
    const tagRank = tagRanks.regionalRank;

    const previousScoreSet = ranksElement.querySelector("." + tagRank);
    if (previousScoreSet) return true;

    await waitPreferencesToLoad();
    if (!preferences.regionRanking) return false;

    const osuWorldInfo = await osuWorldUser(playerId, mode);
    const playerData = osuWorldInfo.data;
    if (!playerData || (playerData as IFetchError).error || signal?.aborted) return false;

    const rankValue = (playerData as TosuWorldIdSuccess).placement;
    if (!rankValue) return false;
    if (!ranksElement.isConnected) return false;
    return addRank(ranksElement, rankValue, "region_ranking", tagRank);
}

async function addScoreRank(ranksElement: HTMLElement, playerId: string, mode: string, signal?: AbortSignal) {
    const tagRank = tagRanks.scoreRank;

    const previousScoreSet = ranksElement.querySelector("." + tagRank);
    if (previousScoreSet) return true;

    const scoreRankInfo = await osuScoreRanking(playerId, mode);
    await waitPreferencesToLoad();
    if (!preferences.scoreRanking) return false;

    // Abort after fetch to ensure it's cached
    if (!scoreRankInfo || signal?.aborted) return false;
    const scoreRank = scoreRankInfo[0].rank;

    const rankHighest = scoreRankInfo[0]["rank_highest"];
    const highestRank = rankHighest.rank;

    if (!highestRank && scoreRank === 0) {
        return false;
    }
    if (!ranksElement.isConnected) return false;

    const date = new Date(rankHighest["updated_at"]);
    return await addRank(ranksElement, scoreRank, "score_ranking", tagRank, highestRank, date);
}

const addRank = async (
    ranksElement: HTMLElement,
    rankValue: number,
    labelTag: string,
    classTag: string,
    highestRank?: number,
    date?: Date,
) => {
    const scoreRankElement = document.createElement("div");
    scoreRankElement.classList.add(classTag);
    scoreRankElement.classList.add("value-display", "value-display--rank");
    const scoreRankLabel = document.createElement("div");
    scoreRankLabel.classList.add("value-display__label");
    await waitLastLanguageIsLoaded();
    const labelText = getLocMsg(labelTag);
    scoreRankLabel.innerText = labelText;
    scoreRankElement.append(scoreRankLabel);

    const scoreRankValue = document.createElement("div");
    scoreRankValue.classList.add("value-display__value");
    scoreRankElement.append(scoreRankValue);
    const rank = document.createElement("div");

    if (!ranksElement.isConnected) return false;

    if (date) {
        const tooltip = highestRank ? highestRankTip(highestRank, date) : lastUpdateTip(date);
        rank.setAttribute("data-html-title", tooltip);
    }
    rank.setAttribute("title", "");

    rank.textContent = rankValue === 0 ? "-" : `#${rankValue.toLocaleString(getActiveLanguageCode())}`;
    scoreRankValue.append(rank);

    const previousRank = ranksElement.querySelector("." + classTag);
    if (previousRank) return true;

    const positioningIndex = tagsOrder.indexOf(classTag);
    const nextTag = tagsOrder[positioningIndex + 1];
    if (!nextTag) {
        ranksElement.append(scoreRankElement);
    }
    const nextElement = ranksElement.querySelector("." + nextTag);
    if (nextElement) {
        ranksElement.insertBefore(scoreRankElement, nextElement);
    } else {
        ranksElement.append(scoreRankElement);
    }
    return true;
};

const getCurrentMod = () => {
    const modesElement = document.querySelector(".game-mode-link--active") as HTMLElement;
    if (!modesElement) {
        return;
    }
    const mode = modesElement.dataset.mode;
    return mode;
};

const highestRankTip = (highestRank: number, date: Date) => {
    // Get the formatted date string
    const highestRankKey = "highest_rank_profile";
    const countryCode = getActiveLanguageCodeForKey(highestRankKey);

    const formattedDate = date.toLocaleDateString(countryCode, { year: "numeric", month: "long", day: "numeric" });

    const rawText = getLocMsg(highestRankKey);
    const replacedText = rawText
        .replace("{{rankHighest.rank}}", highestRank.toLocaleString(getActiveLanguageCode()))
        .replace("{{formattedDate}}", formattedDate);

    return `<div>${replacedText}</div>`;
};

const lastUpdateTip = (date: Date) => {
    // Get the formatted date string
    const keyTooltip = "last_rank_update";
    const countryCode = getActiveLanguageCodeForKey(keyTooltip);

    const formattedDate = date.toLocaleDateString(countryCode, { year: "numeric", month: "long", day: "numeric" });

    const rawText = getLocMsg(keyTooltip);
    const replacedText = rawText.replace("{{formattedDate}}", formattedDate);

    return `<div>${replacedText}</div>`;
};

const forceStatsInAnotherRow = () => {
    const element = document.querySelector(".osu-page .profile-detail__stats") as HTMLElement;
    element.classList.add("profile-detail__stats--force-row");
};
