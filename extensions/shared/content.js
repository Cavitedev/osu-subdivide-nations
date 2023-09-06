(async () => {
  // Flags
  const flagsUrl = chrome.runtime.getURL(`flags.json`);
  const respone = await fetch(flagsUrl);
  countryRegionsData = await respone.json();
  loadedCountryRegions = countryRegionsData;
  runningId = 0;

  chrome.runtime.onMessage.addListener((obj, sender, respone) => {
    disconnectObservers();

    const { type, location, view } = obj;
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
  const expireHeader = "expire-date";

  const genExpireDate = () => Date.now() + expireTime;

  const fetchWithCache = async (url) => {
    const cachedItemRaw = localStorage.getItem(url);
    if (cachedItemRaw) {
      const cachedItem = JSON.parse(cachedItemRaw);
      const expireDate = cachedItem[expireHeader];
      if (expireDate < Date.now()) {
        return fetchAndSaveInCache();
      }
      cachedItem["cache"] = true;
      return cachedItem;
    } else {
      return fetchAndSaveInCache();
    }

    function fetchAndSaveInCache() {
      return fetch(url)
        .then(async (res) => {
          const jsonResponse = await res.json();
          jsonResponse[expireHeader] = genExpireDate();
          localStorage.setItem(url, JSON.stringify(jsonResponse));
          return jsonResponse;
        })
        .catch((error) => {
          console.log(error);
        });
    }
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
    return await Promise.race([dataPromise, waitPromise]).then(
      async (result) => {
        const hasCache = result && result["cache"];

        if (hasCache) {
          return result;
        } else {
          await waitPromise;
          return await dataPromise;
        }
      }
    );
  };

  const regionName = (regionData) => {
    return regionData["name"];
  };

  const styleTMP = "background-image: url('$flag')";
  const flagClass = "flag-country";

  const updateFlag = async (item, userId) => {
    if (!item) return;
    playerData = await osuWorldUser(userId);
    if (!playerData || playerData["error"] == unknownUserError) {
      return;
    }
    region = playerData["region_id"];
    countryCode = playerData["country_id"];

    let countryRegionsData = loadedCountryRegions[countryCode];

    if (countryRegionsData) {
      const regionData = countryRegionsData["regions"][region];
      if (!regionData) return;

      flagElement = item.querySelector(`.${flagClass}`);
      if (regionData["flag"]) {
        flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
      }

      if (regionData["name"]) {
        flagElement.setAttribute("title", regionName(regionData));
      }
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
