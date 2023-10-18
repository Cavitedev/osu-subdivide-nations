import { updateFlagsPlayers } from "./pages/players";
import { updateFlagsSchedule } from "./pages/schedule";


const contentObserver = new MutationObserver(() => {
    exec();
});

export const getContent = () => content;

let content: HTMLElement | undefined = undefined;

export const exec = async () => {

    
    content = document.querySelector("body > app-root > app-tournament-view > div.content-spacing > app-tournament-view-details") as HTMLElement;
    if(!content) return;
    contentObserver.observe(content, {childList: true});
    
    //No content
    if(content.children.length === 0) return;


    updateFlagsPlayers();
    updateFlagsSchedule();

};

(async () => {
    await exec();
})();