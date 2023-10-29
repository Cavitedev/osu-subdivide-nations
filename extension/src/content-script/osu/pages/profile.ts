import { addFlagUser } from "@src/content-script/osu/flagHtml";
// https://osu.ppy.sh/users/4871211/fruits

import { isNumber } from "@src/utils/utils";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { IFetchError } from "@src/utils/fetchUtils";
import { osuScoreRanking } from "@src/utils/respektive";
import {
    getActiveLanguageCode,
    getActiveLanguageCodeForKey,
    getLocMsg,
    waitLastLanguageIsLoaded,
} from "@src/utils/languagesChrome";
import osuNameToCode from "../osuNameToCode";
import { getCountryName } from "@src/utils/flagsJsonUtils";
import { TosuWorldIdSuccess, osuWorldUser } from "@src/utils/osuWorld";

// Executed when opening a tab or going back and forth so this runs too early
export const profileMutationObserverInit = new MutationObserver((_) => {
    profileMutationObserverInit.disconnect();
    enhanceProfile();
});

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
    if (currentMod) {
        addScoreRank(playerId, currentMod, signal);
        addRegionalRank(playerId, currentMod, signal);
    }
    addRegionalFlagProfile(flagElement as HTMLElement, playerId);
};

const addRegionalFlagProfile = async (flagElement: HTMLElement, playerId: string, signal?: AbortSignal) => {
    const flagResult = await addFlagUser(flagElement as HTMLElement, playerId, { addMargin: true, signal: signal });

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

    countryNameElement.textContent = replaceText;
};

const tagRanks = {
    scoreRank: "respektiveScore",
    regionalRank: "cavitedevRegionalRank",
};

const tagsOrder = [tagRanks.regionalRank, tagRanks.scoreRank];

async function addRegionalRank(playerId: string, mode: string, signal?: AbortSignal) {
    const tagRank = tagRanks.regionalRank;

    const ranksElement = document.querySelector(".profile-detail__values") as HTMLElement;

    let previousScoreSet = ranksElement.querySelector("." + tagRank);
    if (previousScoreSet) return;

    const osuWorldInfo = await osuWorldUser(playerId, mode);
    const playerData = osuWorldInfo.data;
    if (!playerData || (playerData as IFetchError).error || signal?.aborted) return;

    const rankValue = (playerData as TosuWorldIdSuccess).placement;
    if (!rankValue) return;

    const label = getLocMsg("region_ranking");

    addRank(ranksElement, rankValue, label, tagRank);
}

async function addScoreRank(playerId: string, mode: string, signal?: AbortSignal) {
    const tagRank = tagRanks.scoreRank;

    const ranksElement = document.querySelector(".profile-detail__values") as HTMLElement;
    const previousScoreSet = ranksElement.querySelector("." + tagRank);
    if (previousScoreSet) return;

    const scoreRankInfo = await osuScoreRanking(playerId, mode);
    // Abort after fetch to ensure it's cached
    if (!scoreRankInfo || signal?.aborted) return;

    const label = getLocMsg("score_ranking");

    const rankHighest = scoreRankInfo[0]["rank_highest"];
    const highestRank = rankHighest.rank;
    const date = new Date(rankHighest["updated_at"]);
    const tooltip = highestRankTip(highestRank, date);

    const scoreRank = scoreRankInfo[0].rank;
    if (scoreRank === 0) {
        return;
    }
    await addRank(ranksElement, scoreRank, label, tagRank, tooltip);
}

const addRank = async (
    ranksElement: HTMLElement,
    rankValue: number,
    labelText: string,
    classTag: string,
    tooltip?: string,
) => {
    const scoreRankElement = document.createElement("div");
    scoreRankElement.classList.add(classTag);
    scoreRankElement.classList.add("value-display", "value-display--rank");
    const scoreRankLabel = document.createElement("div");
    scoreRankLabel.classList.add("value-display__label");
    await waitLastLanguageIsLoaded();

    scoreRankLabel.innerText = labelText;
    scoreRankElement.append(scoreRankLabel);

    const scoreRankValue = document.createElement("div");
    scoreRankValue.classList.add("value-display__value");
    scoreRankElement.append(scoreRankValue);
    const rank = document.createElement("div");

    if (tooltip) {
        rank.setAttribute("data-html-title", tooltip);
    }
    rank.setAttribute("title", "");

    rank.textContent = `#${rankValue.toLocaleString(getActiveLanguageCode())}`;
    scoreRankValue.append(rank);

    const previousRank = ranksElement.querySelector("." + classTag);
    if (previousRank) return;

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

    const formattedDate = new Intl.DateTimeFormat(countryCode, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);

    const rawText = getLocMsg(highestRankKey);
    const replacedText = rawText
        .replace("{{rankHighest.rank}}", highestRank.toLocaleString(getActiveLanguageCode()))
        .replace("{{formattedDate}}", formattedDate);

    return `<div>${replacedText}</div>`;
};
