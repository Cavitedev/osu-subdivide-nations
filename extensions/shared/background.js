chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log(
  //   `url changed to ${tab.url} changeInfo: ${changeInfo.status} ${Date.now()}`
  // );

  if (changeInfo.status === "complete") {
    if (tab.url.includes("osu.ppy.sh/community/matches/")) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "matches",
      });
    }
    if (tab.url.includes("osu.ppy.sh/community/forums/topics/")) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "topics",
      });
    } else if (
      tab.url.includes("osu.ppy.sh/rankings") ||
      tab.url.includes("osu.ppy.sh/multiplayer/rooms") ||
      tab.url.includes("osu.ppy.sh/rankings/kudosu")
    ) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "rankings",
      });
    } else if (tab.url.includes("osu.ppy.sh/beatmapsets/")) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "beatmapsets",
      });
    }
  }
  if (changeInfo.status === "complete" || changeInfo.status === undefined) {
    if (tab.url.includes("osu.ppy.sh/users")) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "user",
      });
    } else if (tab.url.includes("osu.ppy.sh/home/friends")) {
      const queryParameters = tab.url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "friends",
        view: urlParameters.get("view"),
      });
    }
  }
});
