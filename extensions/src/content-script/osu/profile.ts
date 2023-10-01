
// https://osu.ppy.sh/users/4871211/fruits

import { addFlagUser } from "@src/utils/flagHtml";
import { isNumber } from "@src/utils/utils";
import { idFromProfileUrl } from "./content";

export const profileMutationObserverInit = new MutationObserver((_) => {
    updateFlagsProfile();
  });
  
export const updateFlagsProfile = async () => {

    const linkItem = document.querySelector(
        "body > div.osu-layout__section.osu-layout__section--full > div"
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
    addScoreRank();
    const regionName = await addFlagUser(flagElement as HTMLElement, playerId);
      const countryNameElement = flagElement.querySelector(
        ".profile-info__flag-text"
      )!;
      countryNameElement.textContent =
        countryNameElement.textContent?.split(" / ")[0] + ` / ${regionName}` ?? regionName;
  
  };

  let scoreRankVisible = false
  async function addScoreRank() {
    const ranksElement = document.querySelector(".profile-detail__values");
    const modesElement = document.querySelector(".game-mode-link--active") as HTMLElement;

    if (!modesElement) {
        return;
    }

    if (ranksElement) {
        const path = window.location.pathname.split("/")
        const userId = path[2]
        const mode = modesElement.dataset.mode
        const scoreRankInfo = await (await fetch(`https://score.respektive.pw/u/${userId}?mode=${mode}`)).json();
        const scoreRank = scoreRankInfo[0].rank

        if (scoreRank != 0) {
            let scoreRankElement = document.createElement("div");
            scoreRankElement.classList.add("value-display", "value-display--rank");
            let scoreRankLabel = document.createElement("div");
            scoreRankLabel.classList.add("value-display__label");
            scoreRankLabel.innerHTML = "Score Ranking"
            scoreRankElement.append(scoreRankLabel);

            let scoreRankValue = document.createElement("div");
            scoreRankValue.classList.add("value-display__value");
            scoreRankElement.append(scoreRankValue);
            let rank = document.createElement("div");
            const tooltipTitle = highestRankTip(scoreRankInfo);
            rank.setAttribute("data-html-title", tooltipTitle);
            rank.setAttribute("title", "");

            rank.innerHTML = `#${scoreRank.toLocaleString()}`
            scoreRankValue.append(rank);

            if (!scoreRankVisible) {
                ranksElement.append(scoreRankElement);
                scoreRankVisible = true
            }
        }
    }
}

const highestRankTip = (scoreRankInfo:any) => {
  const rankHighest = scoreRankInfo[0]["rank_highest"]
  const date = new Date(rankHighest["updated_at"]);

  const options : Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  } ;
  
  // Get the formatted date string
  const formattedDate = date.toLocaleDateString(undefined, options);
  return `<div>Highest rank: #${rankHighest.rank} on ${formattedDate}</div>`;
}