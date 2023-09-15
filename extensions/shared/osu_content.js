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

  chrome.runtime.onMessage.addListener((obj, sender, respone) => {
    disconnectObservers();

    const { type, location, view, action } = obj;
    if (action && action == "osu_flag_refresh") {
      init();
    }

    if (type == "update_flag") {
      if (location == "friends") {
        // No flags
        if (view == "brick") {
          return;
        }
        updateFlagsFriends();
      } else if (location == "rankings") {
        updateFlagsRankings();
      } else if (location == "user") {
        updateFlagsProfile();
      } else if (location == "matches") {
        updateFlagsMatches();
      } else if (location == "topics") {
        updateFlagsTopics();
      }
    }
  });

  const expireTime = 900000; //15 minutes

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

  const regionName = async (countryCode, regionCode, regionData) => {
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

  const updateFlag = async (item, userId) => {
    if (!item) return;
    playerData = await osuWorldUser(userId);
    if (!playerData || playerData["error"] == unknownUserError) {
      return;
    }
    flagElements = item.querySelectorAll(`.${flagClass}`);
    if (!flagElements || flagElements.length != 1) return;

    countryCode = playerData["country_id"];
    regionCode = playerData["region_id"];

    let countryRegionsData = loadedCountryRegions[countryCode];

    if (countryRegionsData) {
      const regionData = countryRegionsData["regions"][regionCode];
      if (!regionData) return;

      flagElement = flagElements[0];
      flagParent = flagElement.parentElement;

      flagParentClone = flagParent.cloneNode(true);
      flagElementClone = flagParentClone.querySelector(`.${flagClass}`);

      flag = regionData["flag"];
      if (!flag || flag === "") {
        flag = noFlag;
      }
      flagElementClone.style = flagStyleWithMargin.replace("$flag", flag);

      if (regionData["name"]) {
        flagElementClone.setAttribute(
          "title",
          await regionName(countryCode, regionCode, regionData)
        );
      }
      flagParent.parentElement.insertBefore(
        flagParentClone,
        flagParent.nextSibling ?? flagParent
      );
    }
  };

  const nextFunctionId = () => {
    functionId = runningId + 1;
    runningId++;
    return functionId;
  };

  const disconnectObservers = () => {
    rankingMutationObserver.disconnect();
    profileMutationObserver.disconnect();
  };

  let rankingMutationObserver = new MutationObserver((_) => {
    updateFlagsRankings();
  });

  const updateFlagsRankings = async () => {
    const functionId = nextFunctionId();

    linkItem = document.querySelector("title");
    rankingMutationObserver.observe(linkItem, {
      attributes: true,
      childList: true,
      subtree: true,
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

  let profileMutationObserver = new MutationObserver((_) => {
    updateFlagsProfile();
  });

  const updateFlagsProfile = async () => {
    nextFunctionId();

    const url = location.href;
    const playerId = url.split("/")[4];

    profileMutationObserver.disconnect();
    linkItem = document.querySelector("title");
    profileMutationObserver.observe(linkItem, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    flagElement = document.querySelector(".profile-info");
    await updateFlag(flagElement, playerId);
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
      playerId = playerNameElement.getAttribute("href").split("/")[4];
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
      playerId = playerNameElement.getAttribute("href").split("/")[4];
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
    }
  };

  await init();
})();
