import { addFlagUser } from "@src/content-script/osu/flagHtml";
import { nextFunctionId, runningId } from "./content";

// https://osu.ppy.sh/beatmapsets/1508588#fruits/3734628

// This is run after the elements are first injected
let initFinishedMutationObserver = new MutationObserver((_) => {
  updateFlagsBeatmapsets();
});

const beatmapsetMutationObserver = new MutationObserver((mutations) => {
  updateFlagsBeatmapsets();
});

export const updateFlagsBeatmapsets = async () => {
  const url = location.href;
  if (!url.includes("osu.ppy.sh/beatmapsets/")) return;
  const functionId = nextFunctionId();

  const linkItem = document.querySelector(".beatmapset-scoreboard__main");
  if (linkItem) {
    initFinishedMutationObserver.observe(linkItem, {
      childList: true,
    });
  } else {
    initFinishedMutationObserver.observe(
      document.querySelector(".js-react--beatmapset-page")!,
      {
        childList: true,
      }
    );
  }

  const leaderboardParent = document.querySelector(
    ".beatmapset-scoreboard__main"
  )?.firstChild as HTMLElement;
  if (
    !leaderboardParent ||
    leaderboardParent.classList.contains("beatmapset-scoreboard__notice")
  )
    return;

  beatmapsetMutationObserver.observe(leaderboardParent, { childList: true });
  initFinishedMutationObserver.disconnect();

  updateTopLeaderboard(leaderboardParent);
  updateTableRanks(leaderboardParent, functionId);
};

const updateTopLeaderboard = async (leaderboardParent: HTMLElement) => {
  //beatmap-scoreboard-top

  const topScoreElements = leaderboardParent.querySelectorAll(
    ".beatmap-score-top__user-box"
  );
  if (!topScoreElements) {
    return;
  }

  for (const topScoreElement of topScoreElements) {
    const topScoreUserElement = topScoreElement.querySelector(
      ".beatmap-score-top__username"
    );
    const topScoreUserId = (topScoreUserElement as HTMLElement).getAttribute(
      "data-user-id"
    );
    if (topScoreUserId) {
      await addFlagUser(
        topScoreElement as HTMLElement,
        topScoreUserId,
        true,
        true
      );
    }
  }
};

const updateTableRanks = async (
  leaderboardParent: HTMLElement,
  functionId: number
) => {
  // Children
  const rankingTable = leaderboardParent.querySelector(
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
    await addFlagUser(item as HTMLElement, playerId, false, true, false, true);
  }
};
