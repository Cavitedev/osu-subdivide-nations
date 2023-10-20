
import { getContent } from "../content";
import { updateFlagsPlayersList } from "./players";
import { forceUpdateFlagTeams } from "./teams";

export const updateFlagsParticipants = async () => {
    const url = location.href;
    if (!url.includes("/participants")) return;


    const teamContainer = getContent()?.querySelector(".teams-container") as HTMLElement;
    const individualPlayers = getContent()?.querySelectorAll(".player-container .players .player") ?? []

    const teamPromise = forceUpdateFlagTeams(teamContainer, false);
    const playersPromise = updateFlagsPlayersList(individualPlayers);
    await Promise.all([teamPromise, playersPromise]);
}

