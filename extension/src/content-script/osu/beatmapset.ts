import { addFlagUser } from "@src/content-script/osu/flagHtml";
import { nextFunctionId, runningId } from "./content";

// https://osu.ppy.sh/beatmapsets/1508588#fruits/3734628
let initFlagsBeatmapsetMutationObserver = new MutationObserver((_) => {
    updateFlagsBeatmapsets();
    initFlagsBeatmapsetMutationObserver.disconnect();
  });
  let beatmapsetMutationObserver = new MutationObserver((_) => {
    updateFlagsBeatmapsets();
  });
  
  export const updateFlagsBeatmapsets = async () => {
    const url = location.href;
    if(!url.includes("osu.ppy.sh/beatmapsets/")) return;
    const functionId = nextFunctionId();
  
    const linkItem = document.querySelector(".beatmapset-scoreboard__main");
    if (linkItem) {
      beatmapsetMutationObserver.observe(linkItem, {
        childList: true,
      });
    } else{
      beatmapsetMutationObserver.observe(document.querySelector(".js-react--beatmapset-page")!, {
        childList: true,
      });
    }
  
    const topScoreElements = document.querySelectorAll(
      ".beatmap-score-top__user-box"
    );
    if (!topScoreElements) {
      return;
    }
  
    for (const topScoreElement of topScoreElements) {
      const topScoreUserElement = topScoreElement.querySelector(
        ".beatmap-score-top__username"
      );
      const topScoreUserId = (topScoreUserElement as HTMLElement).getAttribute("data-user-id");
      if (topScoreUserId) {
        await addFlagUser(topScoreElement as HTMLElement, topScoreUserId, true, true);
      }
    }
  
    const rankingTable = document.querySelector(
      ".beatmap-scoreboard-table__body"
    );
    if (!rankingTable) {
      return;
    }
  
    const items = rankingTable.children;
  
    for (let item of items) {
      if (functionId != runningId) {
        return;
      }
      const playerNameElement = item.querySelector(
        ".beatmap-scoreboard-table__cell-content--user-link"
      );
      const playerId = playerNameElement?.getAttribute("data-user-id")!;
      await addFlagUser(item  as HTMLElement, playerId, false, false, false, true  );
    }
  };