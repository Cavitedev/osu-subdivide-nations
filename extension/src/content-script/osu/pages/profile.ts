import { addFlagUser } from "@src/content-script/osu/flagHtml";
// https://osu.ppy.sh/users/4871211/fruits

import { isNumber } from "@src/utils/utils";
import { idFromProfileUrl } from "../content";
import { nextAbortControllerSignal } from "@src/utils/fetchUtils";
import { osuScoreRanking } from "@src/utils/respektive";
import {
    getActiveLanguageCode,
    getActiveLanguageCodeForKey,
    getLocMsg,
    waitLastLanguageIsLoaded,
} from "@src/utils/languagesChrome";
import osuNameToCode from "../osuNameToCode";
import { getCountryName } from "@src/utils/flagsJsonUtils";

export const profileMutationObserverInit = new MutationObserver((_) => {
    updateFlagsProfile();
});

export const updateFlagsProfile = async () => {
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
    const playerId = idFromProfileUrl(url);
    if (!isNumber(playerId)) {
        return;
    }

    const flagElement = document.querySelector(".profile-info");
    if (!flagElement) {
        return;
    }
    addScoreRank(signal);
    const flagResult = await addFlagUser(flagElement as HTMLElement, playerId, { signal: signal, addMargin: true });
    if (!flagResult) return;
    const { countryCode, countryName, regionName } = flagResult;
    const countryNameElement = flagElement.querySelector(".profile-info__flag-text")!;
    
    let countryText = countryNameElement.textContent?.split(" |")[0];
    const originalCountryCode = osuNameToCode(countryText!);

    let replaceText: string;
    if (originalCountryCode === countryCode){
        countryText = countryNameElement.textContent?.split(" / ")[0];
        replaceText = `${countryName ? countryName : countryText}${regionName ? ` / ${regionName}` : ""}`;
    }else{
        const regionCountryName = await getCountryName(countryCode!);
        replaceText = `${countryName} | ${regionCountryName} / ${regionName}`;
    }

    countryNameElement.textContent = replaceText;
};

async function addScoreRank(signal: AbortSignal) {
    const ranksElement = document.querySelector(".profile-detail__values") as HTMLElement;
    const modesElement = document.querySelector(".game-mode-link--active") as HTMLElement;

    if (!modesElement) {
        return;
    }
    const previousScoreSet = ranksElement.querySelector(".respektiveScore");
    if (previousScoreSet) return;

    const path = window.location.pathname.split("/");
    const userId = path[2];
    const mode = modesElement.dataset.mode;
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

        rank.innerHTML = `#${scoreRank.toLocaleString(getActiveLanguageCode())}`;
        scoreRankValue.append(rank);

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
