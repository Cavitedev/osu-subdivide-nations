import { getContent } from "../content";
import { updateFlagsPlayersList } from "./players";
import { forceUpdateFlagTeams } from "./teams";

export const addFlagsParticipants = async () => {
    const url = location.href;
    if (!url.includes("/participants")) return;

    const teamContainer = getContent()?.querySelector(".teams-container") as HTMLElement;
    let individualPlayers = getContent()?.querySelectorAll(".player-container .players .player") ?? [];
    if (individualPlayers.length === 0) {
        individualPlayers = getContent()?.querySelectorAll(".players .player-tile") ?? [];
    }

    const teamPromise = forceUpdateFlagTeams(teamContainer, false);
    const playersPromise = updateFlagsPlayersList(individualPlayers);
    await Promise.all([teamPromise, playersPromise]);
};
