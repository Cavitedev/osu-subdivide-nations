import { addFlagUser } from "@src/content-script/osu/flagHtml";
import { nextAbortControllerSignal } from "./content";

// https://osu.ppy.sh/beatmapsets/1508588#fruits/3734628

// This is run after the elements are first injected
const tableBodyClass = "beatmap-scoreboard-table__body";

let initFinishedMutationObserver = new MutationObserver((_) => {
  updateFlagsBeatmapsets();
});

const beatmapsetMutationObserver = new MutationObserver(() => {
  updateFlagsBeatmapsets();
});

export const updateFlagsBeatmapsets = async () => {
  const url = location.href;
  if (!url.includes("osu.ppy.sh/beatmapsets/")) return;
  const signal = nextAbortControllerSignal();

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

  const rankingTable = leaderboardParent.querySelector(".beatmap-scoreboard-table") as HTMLElement;
  if (rankingTable)
    rankingTableObverver.observe(rankingTable, { childList: true });

  const tableBody = rankingTable.querySelector(`.${tableBodyClass}`) as HTMLElement;
  updateTableRanks(tableBody, signal);
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
        {
          addDiv: true,
          addMargin: true,
        }
      );
    }
  }
};

// For osu plus add-on or other add-ons
let osuPlusBody;

const rankingTableObverver = new MutationObserver((mutations) => {
  osuPlusBody = mutations.find((m) => {
    const addedNode = m.addedNodes?.[0] as HTMLElement;
    const classList = addedNode.classList;
    return (
      classList.contains("osuplus-table") &&
      classList.contains("beatmap-scoreboard-table__table")
    );
  })?.addedNodes[0] as HTMLElement | undefined;
  if (osuPlusBody) {
    const osuPlusTable = osuPlusBody.querySelector(
      `.${tableBodyClass}`
    ) as HTMLElement;
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
  for (let item of items) {
    if (signal.aborted) {
      return;
    }
    const playerNameElement = item.querySelector(
      ".beatmap-scoreboard-table__cell-content--user-link"
    );
    const playerId = playerNameElement?.getAttribute("data-user-id")!;
    await addFlagUser(item as HTMLElement,  playerId,  {addDiv:  false, addMargin:  true, addSuperParentClone:  false, insertInsideOriginalElement: true});
  }
};
