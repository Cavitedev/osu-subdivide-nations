import { enhanceDraftPage } from "./pages/draft";
import { addFlagsHome } from "./pages/home";
import { addFlagsParticipants } from "./pages/participants";
import { addFlagsPlayers } from "./pages/players";
import { addFlagsSchedule } from "./pages/schedule";
import { addFlagsTeams, updateFlagTeams } from "./pages/teams";
import { addFlagsTournamentManagement } from "./pages/tournamentManagement";

const bodyObserver = new MutationObserver((mutations) => {
    const overlay = document.querySelector("body > div.cdk-overlay-container");
    if (overlay) {
        overlayObserver.observe(overlay, { childList: true });

        const teamEl = (mutations[0].addedNodes?.[0] as HTMLElement)?.querySelector(".team");
        if (teamEl) {
            updateFlagTeams(teamEl as HTMLElement);
        }
    }
});

const overlayObserver = new MutationObserver((mutation) => {
    if (mutation[0].target) {
        execOverlay(mutation[0].target as HTMLElement);
    }
});

const execOverlay = (parent: HTMLElement) => {
    updateFlagTeams(parent);
};

const contentObserver = new MutationObserver(() => {
    exec();
});

const titleObserver = new MutationObserver(() => {
    exec();
});

export const getContent = () => content;

let content: HTMLElement | undefined = undefined;

export const exec = async () => {
    titleObserver.observe(document.querySelector("head > title")!, { childList: true });
    bodyObserver.observe(document.body, { childList: true });
    const pathname = location.pathname;
    if (pathname === "/draft") {
        draftPageEnhance();
        return;
    }

    addFlagsTournamentManagement();

    content = document.querySelector(
        "body > app-root > app-tournament-view > div.content-spacing > app-tournament-view-details",
    ) as HTMLElement;
    if (!content) {
        return;
    }
    const contentChild = content.children[0] as HTMLElement;

    contentObserver.observe(contentChild ?? content, { childList: true });

    //No content
    if (content.children.length === 0) {
        return;
    }
    enhancePages();
};

const draftPageEnhance = () => {
    content = document.querySelector("body > app-root > app-draft") as HTMLElement;
    if (!content) {
        return;
    }
    contentObserver.observe(content, { childList: true });
    enhanceDraftPage();
};

const enhancePages = () => {
    addFlagsHome();
    addFlagsPlayers();
    addFlagsTeams();
    addFlagsParticipants();
    addFlagsSchedule();
};

(async () => {
    await exec();
})();
