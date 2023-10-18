import { updateFlagsParticipants } from "./pages/participants";
import { updateFlagsPlayers } from "./pages/players";
import { updateFlagsSchedule } from "./pages/schedule";
import { updateFlagsTeams } from "./pages/teams";


const contentObserver = new MutationObserver(() => {
    console.log("content");
    exec();
    contentObserver.disconnect();
});

const titleObserver = new MutationObserver((mut) => {
    console.log(mut);
    exec();
});



export const getContent = () => content;

let content: HTMLElement | undefined = undefined;

export const exec = async () => {
    titleObserver.observe(document.querySelector("head > title")!, {childList: true});
    
    content = document.querySelector("body > app-root > app-tournament-view > div.content-spacing > app-tournament-view-details") as HTMLElement;
    if(!content) return;
 
    
    //No content
    if(content.children.length === 0) {
        const contentChild = content.children[0] as HTMLElement;
        contentObserver.observe(contentChild ?? content, {childList: true});
        return;
    };

    const starInserted = content.querySelector(".ng-star-inserted");
    contentObserver.observe(starInserted!, {childList: true});

    updateFlagsPlayers();
    updateFlagsTeams();
    updateFlagsParticipants();  
    updateFlagsSchedule();

};

(async () => {
    await exec();
})();