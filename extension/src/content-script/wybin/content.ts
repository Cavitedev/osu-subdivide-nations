import { updateFlagsPlayers } from "./pages/players";


const contentObserver = new MutationObserver(() => {
    exec();
});

export const exec = async () => {

    
    const content = document.querySelector("body > app-root > app-tournament-view > div.content-spacing > app-tournament-view-details") as HTMLElement;

    contentObserver.observe(content, {childList: true});
    
    //No content
    if(content.children.length === 0) return;


    updateFlagsPlayers();

};

(async () => {
    await exec();
})();