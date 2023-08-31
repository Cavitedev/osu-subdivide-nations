chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(`url changed to ${tab.url} changeInfo: ${changeInfo.status}`);

  if (changeInfo.status === "complete") {
    if (tab.url.includes("osu.ppy.sh/community/matches/")) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "matches",
      });
    }
  } else if (changeInfo.status === undefined) {
    if (tab.url.includes("osu.ppy.sh/home/friends")) {
      const queryParameters = tab.url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "friends",
        view: urlParameters.get("view"),
      });
    } else if (tab.url.includes("osu.ppy.sh/users")) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "user",
      });
    }
  }

  if (changeInfo.status === "complete" || changeInfo.status === undefined) {
    if (tab.url.includes("osu.ppy.sh/rankings")) {
      chrome.tabs.sendMessage(tabId, {
        type: "update_flag",
        location: "rankings",
      });
    }
  }
});
