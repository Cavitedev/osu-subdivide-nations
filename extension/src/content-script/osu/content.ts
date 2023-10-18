import { TFlagItems, addFlagUser, addFlagUsers } from "@src/content-script/osu/flagHtml";
import { initConfigure } from "./init";
import { updateFlagsRankings } from "./pages/ranking";
import { updateFlagsBeatmapsets } from "./pages/beatmapset";
import { updateFlagsFriends } from "./pages/friends";
import { updateFlagsMatches } from "./pages/match";
import { updateFlagsProfile } from "./pages/profile";
import { updateFlagsTopics } from "./pages/topics";
import { updateLanguageToOsuLanguage } from "./osuLanguage";
import { updateFlagsSearch } from "./pages/search";

const flagClass = "flag-country";
initConfigure(flagClass);
let currentAbortController = new AbortController();

export const currentSignal = () => currentAbortController.signal;

export const nextAbortControllerSignal = () => {
    currentAbortController.abort();
    currentAbortController = new AbortController();

    return currentAbortController.signal;
};

export const idFromProfileUrl = (url: string) => {
    return url.split("/")[4];
};

const profileCardOverlayFinishObserver = new MutationObserver((mutations) => {
    const addedNodesCount = mutations.reduce(
        (total, mutation) => (mutation.type === "childList" ? total + mutation.addedNodes.length : total),
        0,
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
    await addFlagUser(card, userId, { addDiv: true, addMargin: true });
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

    const target = (mutations?.[0]?.target as HTMLElement);
    const items = target.querySelectorAll("[data-section=user]");

    updateSearchCards(items as NodeListOf<HTMLElement>);
};

const updateFlagSearchRefreshObserver = new MutationObserver(async (mutations) => {
    return refreshSearch(mutations);
});
const updateFlagMobileSearchRefreshObserver = new MutationObserver(async (mutations) => {
    return refreshSearch(mutations);
});

const firstSearch = async (addedNode: HTMLElement, mobile: boolean) => {
    if (!addedNode) return;

    const userCards = addedNode.querySelectorAll("[data-section=user]");
    if (!userCards || userCards.length === 0) return;

    (mobile ? updateFlagMobileSearchRefreshObserver : updateFlagSearchRefreshObserver).observe(
        userCards[0].parentElement!,
        {
            attributes: false,
            childList: true,
            subtree: false,
        },
    );

    await updateSearchCards(userCards as NodeListOf<HTMLElement>);
};

const updateFlagSearchObserver = new MutationObserver(async (mutations) => {
    return firstSearch(mutations[0].addedNodes[0] as HTMLElement, false);
});

const updateFlagMobileSearchObserver = new MutationObserver(async (mutations) => {
    return firstSearch(mutations[0].addedNodes[0] as HTMLElement, true);
});

const updateSearchCards = async (cards: NodeListOf<HTMLElement>) => {
    const flagItems: TFlagItems = [];
    for(const card of cards){
        const userId = idFromProfileUrl(card.querySelector(".user-search-card__col--username")!.getAttribute("href")!);
        flagItems.push({item: card, id:userId});
    }

    await addFlagUsers(flagItems, { addDiv: true, addMargin: true });
};

const reloadMutationObserver = new MutationObserver(() => {
    exec();
});

let userCardObservedElement: HTMLElement | undefined = undefined;
const userCardMobileMutationObserver = new MutationObserver(() => {
    updateUserCardMobileView(userCardObservedElement);
});

// Card displayed in mobile view everywhere
const updateUserCardMobileView = async (parent: HTMLElement | undefined = undefined) => {
    const userCard = (parent ?? document).querySelector(".user-card .user-card__details");
    if (!userCard) {
        const reactUserCard = document.querySelector(".js-react--user-card") as HTMLElement;
        userCardObservedElement = reactUserCard;
        userCardMobileMutationObserver.observe(reactUserCard!, { childList: true });
        return;
    }
    updateUserCardFlag(userCard as HTMLElement);
};

const mobileMenuCreationObserver = new MutationObserver((mutations) => {
    const mobileMenuInner = (mutations?.[0]?.target as HTMLElement)?.querySelector(".quick-search");
    if (mobileMenuInner) {
        updateFlagMobileSearchObserver.observe(mobileMenuInner, {
            childList: true,
        });
        mobileMenuCreationObserver.disconnect();   
        return;
    }

});

const addGlobalObservers = () => {
    bodyObserver.observe(document.querySelector("body")!, {
        childList: true,
    });

    const mobileMenu = document.querySelector(".mobile-menu__item--search");
    const mobileMenuInner = mobileMenu?.querySelector(".quick-search");
    if (mobileMenuInner) {
        updateFlagMobileSearchObserver.observe(mobileMenuInner, {
            childList: true,
        });
    }else if (mobileMenu){
        mobileMenuCreationObserver.observe(mobileMenu, {
            childList: true,
        });
    }
};

export const exec = async () => {
    reloadMutationObserver.observe(document.querySelector("title")!, {
        childList: true,
    });
    updateLanguageToOsuLanguage();
    //Invalidate previous executions
    nextAbortControllerSignal();
    addGlobalObservers();
    updateUserCardMobileView();
    updateFlagsSearch();
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
