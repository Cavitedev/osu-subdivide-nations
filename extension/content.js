(async () => {
  // Local users ids
  const src = chrome.runtime.getURL("local_user_regions.js");
  const content = await import(src);
  const localPlayersRegions = content.localPlayersRegions;

  // Flags
  const flagsUrl = chrome.runtime.getURL(`flags.json`);
  const respone = await fetch(flagsUrl);
  countryRegionsData = await respone.json();
  loadedCountryRegions = countryRegionsData;

  chrome.runtime.onMessage.addListener((obj, sender, respone) => {
    const { type, location, view } = obj;
    if (type == "update_flag") {
      if (location == "friends") {
        // No flags
        if (view == "brick") {
          return;
        }

        updateFlagsFriends();
      }
    }
  });

  const regionFromIDandName = (id, name) => {
    playerId = parseInt(id);
    region = localPlayersRegions[playerId];
    return region;
  };

  const regionName = (regionData) => {
    return regionData["name"];
  };

  const styleTMP = "background-image: url('$flag')";
  const flagClass = "flag-country";

  const updateFlagsRankings = () => {
    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");
    const idAttr = "data-user-id";

    for (const item of listItems) {
      userId = item.querySelector(`[${idAttr}]`).getAttribute(idAttr);
      let playerName = item
        .querySelector(`[data-user-id="${userId}"]`)
        .textContent.trim();
      region = regionFromIDandName(userId, playerName);
      if (!region) {
        continue;
      }

      countryCode = region.split("-")[0];

      let countryRegionsData = loadedCountryRegions[countryCode];

      if (countryRegionsData) {
        const regionData = countryRegionsData["regions"][region];
        if (!regionData) continue;

        flagElement = item.querySelector(`.${flagClass}`);
        if (regionData["flag"]) {
          flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
        }

        if (regionData["name"]) {
          flagElement.setAttribute("title", regionName(regionData));
        }
      }
    }
  };

  const updateFlagsProfile = (playerId) => {
    playerName = document
      .querySelector(".profile-info__name")
      .querySelector("span")
      .textContent.trim();
    region = regionFromIDandName(playerId, playerName);

    if (!region) {
      return;
    }

    countryCode = region.split("-")[0];

    let countryRegionsData = loadedCountryRegions[countryCode];

    if (countryRegionsData) {
      const regionData = countryRegionsData["regions"][region];
      if (!regionData) return;

      flagElement = document
        .querySelector(".profile-info__flags")
        .querySelector(`.${flagClass}`);
      if (regionData["flag"]) {
        flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
      }

      if (regionData["name"]) {
        flagElement.setAttribute("title", regionName(regionData));
      }
    }
  };

  const updateFlagsMatches = () => {
    listScores = document.querySelectorAll(".mp-history-player-score__main");

    for (item of listScores) {
      playerNameElement = item.querySelector(
        ".mp-history-player-score__username"
      );
      playerName = playerNameElement.textContent.trim();
      playerId = playerNameElement.getAttribute("href").split("/")[4];

      region = regionFromIDandName(playerId, playerName);
      if (!region) {
        continue;
      }

      countryCode = region.split("-")[0];

      let countryRegionsData = loadedCountryRegions[countryCode];

      if (countryRegionsData) {
        const regionData = countryRegionsData["regions"][region];
        if (!regionData) continue;

        flagElement = item.querySelector(`.${flagClass}`);
        if (regionData["flag"]) {
          flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
        }

        if (regionData["name"]) {
          flagElement.setAttribute("title", regionName(regionData));
        }
      }
    }
  };

  const updateFlagsFriends = () => {
    friendsList = document
      .querySelector(".user-list")
      .querySelectorAll(".user-card__details");

    for (item of friendsList) {
      playerNameElement = item.querySelector(".user-card__username");
      playerName = playerNameElement.textContent.trim();
      playerId = playerNameElement.getAttribute("href").split("/")[4];

      region = regionFromIDandName(playerId, playerName);
      if (!region) {
        continue;
      }

      countryCode = region.split("-")[0];

      let countryRegionsData = loadedCountryRegions[countryCode];

      if (countryRegionsData) {
        const regionData = countryRegionsData["regions"][region];
        if (!regionData) continue;

        flagElement = item.querySelector(`.${flagClass}`);
        if (regionData["flag"]) {
          flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
        }

        if (regionData["name"]) {
          flagElement.setAttribute("title", regionName(regionData));
        }
      }
    }
  };

  // const configureFriendsPage = () => {
  //   viewButtons = document.querySelector(".user-list__view-modes").querySelectorAll("button")

  //   for (button of viewButtons){

  //     button.addEventListener("click", updateFlagsFriends);
  //   }

  //   updateFlagsFriends();
  // }

  const updatePages = () => {
    currentUrl = window.location.href;
    console.log(currentUrl);

    if (currentUrl.includes("/rankings")) {
      updateFlagsRankings();
    } else if (currentUrl.includes("/users/")) {
      const playerId = currentUrl.split("/")[4];
      updateFlagsProfile(playerId);
    } else if (currentUrl.includes("/community/matches/")) {
      updateFlagsMatches();
    } else if (currentUrl.includes("/home/friends")) {
      updateFlagsFriends();
    }
  };

  updatePages();
})();
