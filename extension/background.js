chrome.tabs.onUpdated.addListener((tabId, tab) => {
    if(!tab.url) return;

    if (tab.url.includes("osu.ppy.sh/home/friends")){
        console.log("friends");
        const queryParameters = tab.url.split("?")[1]
        const urlParameters = new URLSearchParams(queryParameters);
        chrome.tabs.sendMessage(tabId, {
            type: "update_flag",
            location: "friends",
            view: urlParameters.get("view")
        });
    }
    
});
