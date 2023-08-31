(async () => {
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

  const unknownUserError = "unknown_user";

  const osuWorldUser = async (id) => {
    const url = "https://osuworld.octo.moe/api/users/" + id;
    const options = { method: "GET" };

    data = await fetch(url, options)
      .then((response) => response.json())
      .catch((_) => {});
    return data;
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

      {
        let localItem = item;
        osuWorldUser(userId).then((playerData) => {
          if (!playerData || playerData["error"] == unknownUserError) {
            return;
          }
          region = playerData["region_id"];
          countryCode = playerData["country_id"];

          let countryRegionsData = loadedCountryRegions[countryCode];

          if (countryRegionsData) {
            const regionData = countryRegionsData["regions"][region];
            if (!regionData) return;

            flagElement = localItem.querySelector(`.${flagClass}`);
            if (regionData["flag"]) {
              flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
            }

            if (regionData["name"]) {
              flagElement.setAttribute("title", regionName(regionData));
            }
          }
        });
      }
    }
  };

  const updateFlagsProfile = (playerId) => {
    playerName = document
      .querySelector(".profile-info__name")
      .querySelector("span")
      .textContent.trim();

    osuWorldUser(playerId).then((playerData) => {
      if (!playerData || playerData["error"] == unknownUserError) {
        return;
      }

      region = playerData["region_id"];
      countryCode = playerData["country_id"];

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
    });
  };

  const updateFlagsMatches = () => {
    listScores = document.querySelectorAll(".mp-history-player-score__main");

    for (item of listScores) {
      playerNameElement = item.querySelector(
        ".mp-history-player-score__username"
      );
      playerName = playerNameElement.textContent.trim();
      playerId = playerNameElement.getAttribute("href").split("/")[4];
      {
        let localItem = item;

        osuWorldUser(playerId).then((playerData) => {
          if (!playerData || playerData["error"] == unknownUserError) {
            return;
          }
          region = playerData["region_id"];
          countryCode = playerData["country_id"];

          countryCode = region.split("-")[0];

          let countryRegionsData = loadedCountryRegions[countryCode];

          if (countryRegionsData) {
            const regionData = countryRegionsData["regions"][region];
            if (!regionData) return;

            flagElement = localItem.querySelector(`.${flagClass}`);
            if (regionData["flag"]) {
              flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
            }

            if (regionData["name"]) {
              flagElement.setAttribute("title", regionName(regionData));
            }
          }
        });
      }
    }
  };

  const updateFlagsFriends = () => {
    friendsList = document
      .querySelector(".user-list")
      .querySelectorAll(".user-card__details");

    for (let item of friendsList) {
      playerNameElement = item.querySelector(".user-card__username");
      playerName = playerNameElement.textContent.trim();
      playerId = playerNameElement.getAttribute("href").split("/")[4];
      {
        let localItem = item;
        osuWorldUser(playerId).then((playerData) => {
          if (!playerData || playerData["error"] == unknownUserError) {
            return;
          }
          console.log(playerData);
          region = playerData["region_id"];
          countryCode = playerData["country_id"];

          let countryRegionsData = loadedCountryRegions[countryCode];

          if (countryRegionsData) {
            const regionData = countryRegionsData["regions"][region];
            if (!regionData) return;

            flagElement = localItem.querySelector(`.${flagClass}`);
            if (regionData["flag"]) {
              flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
            }

            if (regionData["name"]) {
              flagElement.setAttribute("title", regionName(regionData));
            }
          }
        });
      }
    }
  };

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
