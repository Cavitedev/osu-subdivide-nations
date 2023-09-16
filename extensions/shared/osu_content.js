(async () => {
  // Imports

  //Import Tools
  const src = chrome.runtime.getURL("tools.js");
  const tools = await import(src);

  // Import Flags
  const flagsUrl = chrome.runtime.getURL(`flags.json`);
  const respone = await fetch(flagsUrl);
  countryRegionsData = await respone.json();
  loadedCountryRegions = countryRegionsData;
  runningId = 0;

  chrome.runtime.onMessage.addListener(async (obj, sender, respone) => {
    disconnectObservers();

    const { type, location, view, action } = obj;
    if (action && action === "osu_flag_refresh") {
      await refreshOverlays();
      init();
    }

    if (type === "update_flag") {
      if (location === "friends") {
        // No flags
        if (view === "brick") {
          return;
        }
        updateFlagsFriends();
      } else if (location === "rankings") {
        updateFlagsRankings();
      } else if (location === "user") {
        updateFlagsProfile();
      } else if (location === "matches") {
        updateFlagsMatches();
      } else if (location === "topics") {
        updateFlagsTopics();
      } else if (location === "beatmapsets") {
        updateFlagsBeatmapsets();
      }
    }
  });

  const idFromProfileUrl = (url) => {
    return url.split("/")[4];
  };

  const expireTime = 1800000; //30 minutes

  const fetchWithCache = async (url) => {
    return tools.fetchWithCache(url, expireTime);
  };

  const unknownUserError = "unknown_user";

  const osuWorldUser = async (id) => {
    if (!id) {
      console.log("id is null");
      return;
    }

    const url = "https://osuworld.octo.moe/api/users/" + id;

    let dataPromise = fetchWithCache(url);

    let waitPromise = new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    return await Promise.race([dataPromise, waitPromise])
      .then(async (result) => {
        const hasCache = result && result["cache"];

        if (hasCache) {
          return result;
        } else {
          await waitPromise;
          return await dataPromise;
        }
      })
      .then((result) => {
        return result["data"];
      });
  };

  const getRegionName = async (countryCode, regionCode, regionData) => {
    const regionsOsuWorld = await tools.getRegionNamesLocale();

    const regionName = regionsOsuWorld?.["data"]?.[countryCode]?.[regionCode];
    const defaultName = regionData["name"];
    const nativeName = regionData["nativeName"];

    if (regionsOsuWorld["lang"] === tools.nativeLanguageCode) {
      return Promise.resolve(nativeName ?? defaultName);
    } else {
      return Promise.resolve(regionName ?? defaultName);
    }
  };

  const flagStyle = "background-image: url('$flag')";
  const flagStyleWithMargin = flagStyle + "; margin-left: 4px";
  const flagClass = "flag-country";
  const noFlag =
    "https://upload.wikimedia.org/wikipedia/commons/4/49/Noflag2.svg";

  const updateFlag = async (item, userId, addDiv = false) => {
    if (!item) return;
    playerData = await osuWorldUser(userId);
    if (!playerData || playerData["error"] == unknownUserError) {
      return;
    }
    let flagElements = item.querySelectorAll(`.${flagClass}`);
    if (!flagElements || flagElements.length == 0) return;

    countryCode = playerData["country_id"];
    regionCode = playerData["region_id"];

    let countryRegionsData = loadedCountryRegions[countryCode];

    if (countryRegionsData) {
      const regionData = countryRegionsData["regions"][regionCode];
      if (!regionData) return;

      let flagElement = flagElements[0];
      let flagParent = flagElement.parentElement;

      let flagParentClone = flagParent.cloneNode(true);
      let flagElementClone = flagParentClone.querySelector(`.${flagClass}`);

      let flag = regionData["flag"];
      if (!flag || flag === "") {
        flag = noFlag;
      }
      flagElementClone.style = flagStyleWithMargin.replace("$flag", flag);
      const regionName = await getRegionName(
        countryCode,
        regionCode,
        regionData
      );
      if (regionData["name"]) {
        flagElementClone.setAttribute("title", regionName);
      }

      const insertParent = flagParent.parentElement;

      // Check again if flag is already added
      flagElements = item.querySelectorAll(`.${flagClass}`);
      if (flagElements.length > 1) {
        // Update
        flagElements[1].replaceWith(flagElementClone);
      } else {
        // Add
        if (addDiv) {
          const flagsDiv = document.createElement("div");
          flagsDiv.appendChild(flagParent);
          insertParent.appendChild(flagsDiv);
          flagsDiv.setAttribute("class", flagParent.getAttribute("class"));
          flagParent.removeAttribute("class");
          flagParentClone.removeAttribute("class");
          flagParent.style = "display: inline-block";
          flagParentClone.style = "display: inline-block";

          flagsDiv.appendChild(flagParentClone);
        } else {
          if (flagParent.nextSibling) {
            insertParent.insertBefore(flagParentClone, flagParent.nextSibling);
          } else {
            insertParent.appendChild(flagParentClone);
          }
        }
      }

      return regionName;
    }
  };

  let profileCardOverlayFinishObserver = new MutationObserver((mutations) => {
    const addedNodesCount = mutations.reduce(
      (total, mutation) =>
        mutation.type === "childList"
          ? total + mutation.addedNodes.length
          : total,
      0
    );

    if (addedNodesCount > 2) {
      updateFlagsProfileCardOverlay(mutations[0].target);
    }
  });

  let profileCardOverlayObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        const card = addedNode.querySelector(".user-card");
        if (card) {
          profileCardOverlayFinishObserver.observe(card, {
            attributes: false,
            childList: true,
            subtree: true,
          });
          return;
        }
      }
    }
  });

  const updateFlagsProfileCardOverlay = async (card) => {
    const nameElement = card.querySelector(".user-card__username");
    const userId = idFromProfileUrl(nameElement.getAttribute("href"));
    console.log(userId);
    await updateFlag(card, userId);
  };

  const refreshOverlays = async () => {
    const overlays = document.querySelectorAll(
      ".user-card .user-card__details"
    );
    for (const overlay of overlays) {
      await updateFlagsProfileCardOverlay(overlay);
    }
  };

  const nextFunctionId = () => {
    functionId = runningId + 1;
    runningId++;
    profileCardOverlayObserver.disconnect();

    profileCardOverlayObserver.observe(document.querySelector("body"), {
      attributes: false,
      childList: true,
      subtree: false,
    });

    return functionId;
  };

  const disconnectObservers = () => {
    rankingMutationObserver.disconnect();
    profileMutationObserver.disconnect();
    beatmapsetMutationObserver.disconnect();
    profileCardOverlayObserver.disconnect();
  };

  let rankingMutationObserver = new MutationObserver((_) => {
    updateFlagsRankings();
  });

  const updateFlagsRankings = async () => {
    const functionId = nextFunctionId();

    linkItem = document.querySelector("title");
    rankingMutationObserver.observe(linkItem, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");
    const idAttr = "data-user-id";

    for (const item of listItems) {
      if (functionId != runningId) {
        return;
      }
      let idItem = item.querySelector(`[${idAttr}]`);
      userId = idItem.getAttribute(idAttr);
      await updateFlag(item, userId);
    }
  };

  let beatmapsetMutationObserver = new MutationObserver((_) => {
    updateFlagsBeatmapsets();
  });

  const updateFlagsBeatmapsets = async () => {
    const functionId = nextFunctionId();

    const linkItem = document.querySelector(".beatmapset-scoreboard__main");
    beatmapsetMutationObserver.observe(linkItem, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    const topScoreElement = document.querySelector(
      ".beatmap-score-top__user-box"
    );
    if (!topScoreElement) {
      return;
    }
    const topScoreUserElement = topScoreElement.querySelector(
      ".beatmap-score-top__username"
    );
    const topScoreUserId = topScoreUserElement.getAttribute("data-user-id");
    if (topScoreUserId) {
      await updateFlag(topScoreElement, topScoreUserId, true);
    }

    const rankingTable = document.querySelector(
      ".beatmap-scoreboard-table__body"
    );
    if (!rankingTable) {
      return;
    }

    const items = rankingTable.children;
    for (let item of items) {
      if (functionId != runningId) {
        return;
      }
      const playerNameElement = item.querySelector(
        ".beatmap-scoreboard-table__cell-content--user-link"
      );
      const playerId = playerNameElement?.getAttribute("data-user-id");
      await updateFlag(item, playerId, true);
    }
  };

  let profileMutationObserver = new MutationObserver((_) => {
    updateFlagsProfile();
  });

  const updateFlagsProfile = async () => {
    nextFunctionId();

    const url = location.href;
    const playerId = idFromProfileUrl(url);

    profileMutationObserver.disconnect();
    let linkItem = document.querySelector("head");
    profileMutationObserver.observe(linkItem, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    linkItem = document.querySelector("title");
    profileMutationObserver.observe(linkItem, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    flagElement = document.querySelector(".profile-info");
    const regionName = await updateFlag(flagElement, playerId);
    if (regionName) {
      const countryNameElement = flagElement.querySelector(
        ".profile-info__flag-text"
      );
      countryNameElement.textContent =
        countryNameElement.textContent.split(" / ")[0] + ` / ${regionName}`;
    }
  };

  const updateFlagsMatches = async () => {
    const functionId = nextFunctionId();
    listScores = document.querySelectorAll(".mp-history-player-score__main");

    for (item of listScores) {
      if (functionId != runningId) {
        return;
      }
      playerNameElement = item.querySelector(
        ".mp-history-player-score__username"
      );
      playerId = idFromProfileUrl(playerNameElement.getAttribute("href"));
      await updateFlag(item, playerId);
    }
  };

  const updateFlagsFriends = async () => {
    const functionId = nextFunctionId();

    friendsList = document
      .querySelector(".user-list")
      .querySelectorAll(".user-card__details");

    for (let item of friendsList) {
      if (functionId != runningId) {
        return;
      }
      playerNameElement = item.querySelector(".user-card__username");
      playerId = idFromProfileUrl(playerNameElement.getAttribute("href"));
      await updateFlag(item, playerId);
    }
  };

  const updateFlagsTopics = async () => {
    const functionId = nextFunctionId();
    posts = document.querySelectorAll(".forum-post-info");

    for (let item of posts) {
      if (functionId != runningId) {
        return;
      }
      playerNameElement = item.querySelector(".forum-post-info__row--username");
      playerId = playerNameElement.getAttribute("data-user-id");
      await updateFlag(item, playerId);
    }
  };

  const init = async () => {
    const url = location.href;
    if (url.includes("osu.ppy.sh/rankings")) {
      updateFlagsRankings();
    } else if (url.includes("osu.ppy.sh/users")) {
      updateFlagsProfile();
    } else if (url.includes("osu.ppy.sh/home/friends")) {
      const queryParameters = url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
      const view = urlParameters.get("view");
      if (view == "brick") {
        return;
      }
      updateFlagsFriends();
    } else if (url.includes("osu.ppy.sh/community/matches/")) {
      updateFlagsMatches();
    } else if (url.includes("osu.ppy.sh/community/forums/topics/")) {
      updateFlagsTopics();
    } else if (url.includes("osu.ppy.sh/beatmapsets/")) {
      updateFlagsBeatmapsets();
    }
  };

  await init();
})();
