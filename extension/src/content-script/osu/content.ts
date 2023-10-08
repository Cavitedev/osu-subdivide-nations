import { addFlagUser } from "@src/content-script/osu/flagHtml";
import { initConfigure } from "./init";
import { updateFlagsRankings } from "./ranking";
import { updateFlagsBeatmapsets } from "./beatmapset";
import { updateFlagsFriends } from "./friends";
import { updateFlagsMatches } from "./match";
import { updateFlagsProfile } from "./profile";
import { updateFlagsTopics } from "./topics";
import { updateLanguageToOsuLanguage } from "./osuLanguage";

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
    updateUserCardFlag(mutations[0].target as HTMLElement);
  }
});

const bodyObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const addedNode of mutation.addedNodes) {
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

const updateUserCardFlag = async (card: HTMLElement) => {
  const nameElement = card.querySelector(".user-card__username")!;
  const userId = idFromProfileUrl(nameElement.getAttribute("href")!);
  await addFlagUser(card, userId, true, true);
};

export const refreshOverlays = async () => {
  const url = location.href;
  if (!url.includes("osu.ppy.sh/scores")) return;
  const overlays = document.querySelectorAll(".user-card .user-card__details");
  for (const overlay of overlays) {
    await updateUserCardFlag(overlay as HTMLElement);
  }
};

const refreshSearch = async (mutations: MutationRecord[]) => {
  for (const mutation of mutations) {
    for (const addedNode of mutation.addedNodes) {
      if (addedNode instanceof HTMLElement) {
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

const updateSearchCard = async (card: HTMLElement) => {
  const userId = idFromProfileUrl(
    card
      .querySelector(".user-search-card__col--username")!
      .getAttribute("href")!
  );
  await addFlagUser(card, userId, true);
};

const reloadMutationObserver = new MutationObserver((_) => {
  exec();
});


let userCardObservedElement: HTMLElement | undefined = undefined;
const userCardMobileMutationObserver = new MutationObserver((m) => {
  updateUserCardMobileView(userCardObservedElement);
});

// Card displayed in mobile view everywhere
const updateUserCardMobileView = async (parent: HTMLElement | undefined = undefined) => {
  const userCard = (parent ?? document).querySelector(".user-card .user-card__details");
  if (!userCard) {
    const reactUserCard = document.querySelector(".js-react--user-card") as HTMLElement;
    userCardObservedElement = reactUserCard;
    userCardMobileMutationObserver.observe(reactUserCard!, {childList: true});
    return;
  };
  updateUserCardFlag(userCard as HTMLElement);
};

export const exec = async () => {
  reloadMutationObserver.observe(document.querySelector("title")!, {
    childList: true,
  });
  updateLanguageToOsuLanguage();
  //Invalidate previous executions
  nextFunctionId();

  updateUserCardMobileView();
  // All these updates are conditional to the url
  updateFlagsRankings();
  updateFlagsProfile();

  updateFlagsFriends();
  updateFlagsMatches();
  updateFlagsTopics();
  updateFlagsBeatmapsets();
  // The flag appears in a card same as overlays
  refreshOverlays();
};

(async () => {
  await exec();
})();
