
import {  addFlagUser } from "@src/utils/flagHtml";
import { isNumber } from "@src/utils/utils";
import { initConfigure } from "./init";
import { updateFlagsRankings } from "./ranking";
import { updateFlagsBeatmapsets } from "./beatmapset";
import { updateFlagsFriends } from "./friends";
import { updateFlagsMatches } from "./match";

const flagClass = "flag-country";
initConfigure(flagClass);

export let runningId = 0;

export const nextFunctionId = () => {
  const functionId = runningId + 1;
  runningId++;
  
  bodyObserver.observe(document.querySelector("body")!, {
    attributes: false,
    childList: true,
    subtree: false,
  });

  const mobileMenu = document.querySelector(
    ".mobile-menu__item--search > .quick-search"
  );
  if (mobileMenu) {
    updateFlagMobileSearchObserver.observe(mobileMenu, {
      attributes: false,
      childList: true,
      subtree: false,
    });
  }

  return functionId;
};


export const idFromProfileUrl = (url: string) => {
  return url.split("/")[4];
};

const profileCardOverlayFinishObserver = new MutationObserver((mutations) => {
  const addedNodesCount = mutations.reduce(
    (total, mutation) =>
      mutation.type === "childList"
        ? total + mutation.addedNodes.length
        : total,
    0
  );

  if (addedNodesCount > 2) {
    updateFlagsProfileCardOverlay(mutations[0].target as HTMLElement);
  }
});

const bodyObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const addedNode  of mutation.addedNodes) {
      const card = (addedNode as HTMLElement).querySelector(".user-card");
      if (card) {
        profileCardOverlayFinishObserver.observe(card, {
          attributes: false,
          childList: true,
          subtree: true,
        });
        return;
      }
      const search = (addedNode as HTMLElement).querySelector(".quick-search");
      if (search) {
        firstSearch(search as HTMLElement, false);
        updateFlagSearchObserver.observe(search, {
          attributes: false,
          childList: true,
          subtree: false,
        });
      }
    }
  }
});

const updateFlagsProfileCardOverlay = async (card: HTMLElement) => {
  const nameElement = card.querySelector(".user-card__username")!;
  const userId = idFromProfileUrl(nameElement.getAttribute("href")!);
  await addFlagUser(card, userId, true, true);

};

export const refreshOverlays = async () => {
  const overlays = document.querySelectorAll(
    ".user-card .user-card__details"
  );
  for (const overlay of overlays) {
    await updateFlagsProfileCardOverlay(overlay as HTMLElement);
  }
};

const refreshSearch = async (mutations: MutationRecord[]) => {


  for (const mutation of mutations) {
    for (const addedNode of mutation.addedNodes) {
      if(addedNode instanceof HTMLElement){
      if (addedNode.getAttribute("data-section") === "user") {
        await updateSearchCard(addedNode);
      }
      }
    }
  }
};

const updateFlagSearchRefreshObserver = new MutationObserver(
  async (mutations) => {
    return refreshSearch(mutations);
  }
);
const updateFlagMobileSearchRefreshObserver = new MutationObserver(
  async (mutations) => {
    return refreshSearch(mutations);
  }
);

const firstSearch = async (addedNode: HTMLElement, mobile: boolean) => {
  if (!addedNode) return;

  const userCards = addedNode.querySelectorAll("[data-section=user]");
  if (!userCards || userCards.length === 0) return;

  (mobile
    ? updateFlagMobileSearchRefreshObserver
    : updateFlagSearchRefreshObserver
  ).observe(userCards[0].parentElement!, {
    attributes: false,
    childList: true,
    subtree: false,
  });

  for (const userCard of userCards) {
    await updateSearchCard(userCard as HTMLElement);
  }
};

const updateFlagSearchObserver = new MutationObserver(async (mutations) => {
  return firstSearch(mutations[0].addedNodes[0] as HTMLElement, false);
});

const updateFlagMobileSearchObserver = new MutationObserver(
  async (mutations) => {
    return firstSearch(mutations[0].addedNodes[0] as HTMLElement, true);
  }
);

const updateSearchCard = async (card:HTMLElement) => {
  const userId = idFromProfileUrl(
    card
      .querySelector(".user-search-card__col--username")!.getAttribute("href")!
  );
  await addFlagUser(card, userId, true);
};







let profileMutationObserverInit = new MutationObserver((_) => {
  updateFlagsProfile();
});

const updateFlagsProfile = async () => {
  const url = location.href;
  const playerId = idFromProfileUrl(url);
  if (!isNumber(playerId)) {
    return;
  }

  const flagElement = document.querySelector(".profile-info");
  if (!flagElement) {
    return;
  }
  const regionName = await addFlagUser(flagElement as HTMLElement, playerId);
    const countryNameElement = flagElement.querySelector(
      ".profile-info__flag-text"
    )!;
    countryNameElement.textContent =
      countryNameElement.textContent?.split(" / ")[0] + ` / ${regionName}` ?? regionName;

};




const updateFlagsTopics = async () => {
  const functionId = nextFunctionId();
 const  posts = document.querySelectorAll(".forum-post-info");

  for (let item of posts) {
    if (functionId != runningId) {
      return;
    }
    const playerNameElement = item.querySelector(".forum-post-info__row--username") as HTMLElement;
    const playerId = playerNameElement.getAttribute("data-user-id")!;
    addFlagUser(item as HTMLElement, playerId, false, false, true);
  }
};

const reloadMutationObserver = new MutationObserver((_) => {
  init();
});


export const init = async () => {
  reloadMutationObserver.observe(document.querySelector("title")!, {
    childList: true,
  });
  //Invalidate previous executions
  nextFunctionId();

  const url = location.href;
  
  if (
    url.includes("osu.ppy.sh/rankings") ||
    url.includes("osu.ppy.sh/multiplayer/rooms") ||
    url.includes("osu.ppy.sh/rankings/kudosu")
  ) {
    updateFlagsRankings();
  } else if (url.includes("osu.ppy.sh/users")) {
    const linkItem = document.querySelector(
      "body > div.osu-layout__section.osu-layout__section--full > div"
    ) as HTMLElement;
    profileMutationObserverInit.observe(linkItem, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    updateFlagsProfile();
  } else if (url.includes("osu.ppy.sh/home/friends")) {
    const queryParameters = url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const view = urlParameters.get("view");
    if (view == "brick") {
      return;
    }
    updateFlagsFriends();
  } else if (url.includes("osu.ppy.sh/community/matches/")) {
    updateFlagsMatches();
  } else if (url.includes("osu.ppy.sh/community/forums/topics/")) {
    updateFlagsTopics();
  } else if (url.includes("osu.ppy.sh/beatmapsets/")) {
    updateFlagsBeatmapsets();
  } else if (url.includes("osu.ppy.sh/scores")) {
    // The flag appears in a card same as overlays
    refreshOverlays();
  }
};

(async () => {

  // Import Flags
  
  
  await init();

})();

