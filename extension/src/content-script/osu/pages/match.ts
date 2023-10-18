// https://osu.ppy.sh/community/matches/110067650

import { addFlagUser, addFlagUsers } from "@src/content-script/osu/flagHtml";
import { TFlagItems } from "@src/utils/html";
import { idFromOsuProfileUrl } from "@src/utils/utils";
import { nextAbortControllerSignal } from "@src/utils/fetchUtils";

export const updateFlagsMatches = async () => {
    if (!location.href.includes("osu.ppy.sh/community/matches/")) return;
    const signal = nextAbortControllerSignal();

    const linkItem = document.querySelector(".js-react--mp-history") as HTMLElement;
    if (linkItem) {
        matchesObserver.observe(linkItem, {
            attributes: false,
            childList: true,
            subtree: false,
        });
        checkNewGames(linkItem);
        watchPlayingGame(linkItem);
    }

    updateFlagsInMatchPlay(document, signal);
};

// For late initialization
const matchesObserver = new MutationObserver(() => {
    updateFlagsMatches();
});




// Check for playing games
const watchPlayingGame = (parent: HTMLElement) => {
    const gamesPlayed = (parent ?? document).querySelectorAll(".mp-history-game");
    if (!gamesPlayed || gamesPlayed.length === 0) return;
    const lastGame = gamesPlayed[gamesPlayed.length - 1];
    if (!lastGame) return;
    const scores = lastGame.querySelector(".mp-history-game__player-scores");
    if (scores && scores.children.length === 0) {
        gameBeingPlayedMutationObserver.observe(scores, {
            attributes: false,
            childList: true,
            subtree: false,
        });
    }
};

// Running game
const gameBeingPlayedMutationObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
            const score = (addedNode as HTMLElement).querySelector(".mp-history-player-score__main");
            if (score) {
                await updateFlagInMatchScore(score as HTMLElement);
            }
        }
    }
});




const checkNewGames = (parent: HTMLElement | undefined) => {
    const parentContent = (parent ?? document).querySelector(".mp-history-content") as HTMLElement;
    if(!parentContent) return;
    newMatchesObserver.observe(parentContent, {childList: true});
}

//Observer for new matches getting played
const newMatchesObserver = new MutationObserver((mutations) => {
    const addedScores = mutations[mutations.length - 1].addedNodes[0];
    if (!addedScores) return;

    const matchPlay = (addedScores as HTMLElement).querySelector(".mp-history-game__player-scores");
    if (matchPlay) {
        gameBeingPlayedMutationObserver.observe(matchPlay, {
            attributes: false,
            childList: true,
            subtree: false,
        });
    }
});

const updateFlagsInMatchPlay = async (scores: ParentNode, signal: AbortSignal) => {
    const listScores = scores.querySelectorAll(".mp-history-player-score__main");
    if(!listScores || listScores.length === 0) return;

    const flagItems: TFlagItems = [];
    for (const item of listScores) {
        const id = _idFromScoreItem(item as HTMLElement);
        flagItems.push({ id: id, item: item as HTMLElement });
    }
    await addFlagUsers(flagItems, { addDiv: true, addMargin: true, signal: signal });
};

const updateFlagInMatchScore = async (item: HTMLElement, signal?: AbortSignal) => {
    const playerId = _idFromScoreItem(item);
    await addFlagUser(item, playerId, { addDiv: true, addMargin: true, signal: signal });
};

const _idFromScoreItem = (item: HTMLElement) => {
    const playerNameElement = item.querySelector(".mp-history-player-score__username") as HTMLElement;
    return idFromOsuProfileUrl(playerNameElement.getAttribute("href")!);
}