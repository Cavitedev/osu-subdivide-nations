import { updateFlagsParticipants } from "./pages/participants";
import { updateFlagsPlayers } from "./pages/players";
import { updateFlagsSchedule } from "./pages/schedule";
import { updateFlagsTeams } from "./pages/teams";


const contentObserver = new MutationObserver(() => {
    exec();
});

const titleObserver = new MutationObserver(() => {
    exec();
});

export const getContent = () => content;

let content: HTMLElement | undefined = undefined;

export const exec = async () => {
    console.log("exec");
    titleObserver.observe(document.querySelector("head > title")!, {childList: true});
    
    content = document.querySelector("body > app-root > app-tournament-view > div.content-spacing > app-tournament-view-details") as HTMLElement;
    if(!content) return;
    const contentChild = content.children[0] as HTMLElement;

    contentObserver.observe(contentChild ?? content, {childList: true});
    
    //No content
    if(content.children.length === 0) {
        return;
    };


    updateFlagsPlayers();
    updateFlagsTeams();
    updateFlagsParticipants();  
    updateFlagsSchedule();

};

(async () => {
    await exec();
})();