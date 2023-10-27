import { addFlagUser } from "@src/content-script/osu/flagHtml";
// https://osu.ppy.sh/users/4871211/fruits

import { isNumber } from "@src/utils/utils";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { IFetchError, nextAbortControllerSignal } from "@src/utils/fetchUtils";
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

export const profileMutationObserverInit = new MutationObserver((_) => {
    addFlagsProfile();
});

export const addFlagsProfile = async () => {
    if (!location.href.includes("osu.ppy.sh/users")) {
        profileMutationObserverInit.disconnect();
        return;
    }

    const signal = nextAbortControllerSignal();
    const linkItem = document.querySelector(
        "body > div.osu-layout__section.osu-layout__section--full > div",
    ) as HTMLElement;
    profileMutationObserverInit.observe(linkItem, {
        attributes: false,
        childList: true,
        subtree: false,
    });

    const url = location.href;
    const playerId = idFromOsuProfileUrl(url);
    if (!isNumber(playerId)) {
        return;
    }

    const flagElement = document.querySelector(".profile-info");
    if (!flagElement) {
        return;
    }
    const currentMod = getCurrentMod();
    if (currentMod) {
        addScoreRank(signal, currentMod);
        addRegionalRank(signal, currentMod);
    }
    const flagResult = await addFlagUser(
        flagElement as HTMLElement,
        playerId,
        { signal: signal, addMargin: true },
        currentMod,
    );

    if (!flagResult) return;
    const { countryCode, countryName, regionName } = flagResult;
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

async function addRegionalRank(signal: AbortSignal, mode: string) {
    const ranksElement = document.querySelector(".profile-detail__values") as HTMLElement;

    let previousScoreSet = ranksElement.querySelector(".cavitedevRegionalRank");
    if (previousScoreSet) return;

    const path = window.location.pathname.split("/");
    const userId = path[2];
    const osuWorldInfo = await osuWorldUser(userId, signal, mode);
    const playerData = osuWorldInfo.data;
    if (!playerData || (playerData as IFetchError).error) return;

    if (signal.aborted) return;

    const rankValue = (playerData as TosuWorldIdSuccess).placement;
    if (!rankValue) return;

    const rankElement = document.createElement("div");
    rankElement.classList.add("respektiveScore");
    rankElement.classList.add("value-display", "value-display--rank");
    const rankLabel = document.createElement("div");
    rankLabel.classList.add("value-display__label");
    await waitLastLanguageIsLoaded();
    rankLabel.innerText = getLocMsg("region_ranking");
    rankElement.append(rankLabel);
    const scoreRankValue = document.createElement("div");
    scoreRankValue.classList.add("value-display__value");
    rankElement.append(scoreRankValue);

    const rank = document.createElement("div");
    rank.textContent = `#${rankValue.toLocaleString(getActiveLanguageCode())}`;
    scoreRankValue.append(rank);

    previousScoreSet = ranksElement.querySelector(".cavitedevRegionalRank");
    if (previousScoreSet) return;

    ranksElement.append(rankElement);
}

async function addScoreRank(signal: AbortSignal, mode: string) {
    const ranksElement = document.querySelector(".profile-detail__values") as HTMLElement;
    const previousScoreSet = ranksElement.querySelector(".respektiveScore");
    if (previousScoreSet) return;

    const path = window.location.pathname.split("/");
    const userId = path[2];
    const scoreRankInfo = await osuScoreRanking(userId, mode, signal);
    if (!scoreRankInfo) return;

    if (signal.aborted) return;

    const scoreRank = scoreRankInfo[0].rank;
    if (scoreRank != 0) {
        const scoreRankElement = document.createElement("div");
        scoreRankElement.classList.add("respektiveScore");
        scoreRankElement.classList.add("value-display", "value-display--rank");
        const scoreRankLabel = document.createElement("div");
        scoreRankLabel.classList.add("value-display__label");
        await waitLastLanguageIsLoaded();
        scoreRankLabel.innerText = getLocMsg("score_ranking");
        scoreRankElement.append(scoreRankLabel);

        const scoreRankValue = document.createElement("div");
        scoreRankValue.classList.add("value-display__value");
        scoreRankElement.append(scoreRankValue);
        const rank = document.createElement("div");
        const tooltipTitle = highestRankTip(scoreRankInfo);
        rank.setAttribute("data-html-title", tooltipTitle);
        rank.setAttribute("title", "");

        rank.textContent = `#${scoreRank.toLocaleString(getActiveLanguageCode())}`;
        scoreRankValue.append(rank);

        const previousScoreSet = ranksElement.querySelector(".respektiveScore");
        if (previousScoreSet) return;

        ranksElement.append(scoreRankElement);
    }
}

const highestRankTip = (scoreRankInfo: any) => {
    const rankHighest = scoreRankInfo[0]["rank_highest"];
    const date = new Date(rankHighest["updated_at"]);

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
        .replace("{{rankHighest.rank}}", rankHighest.rank)
        .replace("{{formattedDate}}", formattedDate);

    return `<div>${replacedText}</div>`;
};

const getCurrentMod = () => {
    const modesElement = document.querySelector(".game-mode-link--active") as HTMLElement;
    if (!modesElement) {
        return;
    }
    const mode = modesElement.dataset.mode;
    return mode;
};
