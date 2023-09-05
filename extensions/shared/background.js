browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log(`url changed to ${tab.url} changeInfo: ${changeInfo.status}`);

  if (changeInfo.status === "complete") {
    if (tab.url.includes("osu.ppy.sh/community/matches/")) {
      browser.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "matches",
      });
    }
    if (tab.url.includes("osu.ppy.sh/community/forums/topics/")) {
      browser.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "topics",
      });
    } else if (tab.url.includes("osu.ppy.sh/rankings")) {
      browser.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "rankings",
      });
    }
  }
  if (changeInfo.status === "complete" || changeInfo.status === undefined) {
    if (tab.url.includes("osu.ppy.sh/users")) {
      browser.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "user",
      });
    } else if (tab.url.includes("osu.ppy.sh/home/friends")) {
      const queryParameters = tab.url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
      browser.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "friends",
        view: urlParameters.get("view"),
      });
    }
  }
});
