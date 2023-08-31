(async () => {
  // Flags
  const flagsUrl = chrome.runtime.getURL(`flags.json`);
  const respone = await fetch(flagsUrl);
  countryRegionsData = await respone.json();
  loadedCountryRegions = countryRegionsData;

  chrome.runtime.onMessage.addListener((obj, sender, respone) => {
    const { type, location, view } = obj;
    if (type == "update_flag") {
      console.log(location);

      if (location == "friends") {
        // No flags
        if (view == "brick") {
          return;
        }
        updateFlagsFriends();
      } else if (location == "rankings") {
        updateFlagsRankings();
      } else if (location == "user") {
        const playerId = window.location.href.split("/")[4];
        updateFlagsProfile(playerId);
      } else if (location == "matches") {
        updateFlagsMatches();
      }
    }
  });

  const unknownUserError = "unknown_user";

  const osuWorldUser = async (id) => {
    const url = "https://osuworld.octo.moe/api/users/" + id;
    const options = {
      method: "GET",
      cache: "force-cache",
    };

    let dataPromise = fetch(url, options)
      .then((response) => response.json())
      .catch((_) => {});

    let waitPromise = new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    await Promise.all([dataPromise, waitPromise]);
    data = await dataPromise;
    console.log(data);
    return data;
  };

  const regionName = (regionData) => {
    return regionData["name"];
  };

  const styleTMP = "background-image: url('$flag')";
  const flagClass = "flag-country";

  const updateFlag = async (item, userId) => {
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

  const updateFlagsRankings = async () => {
    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");
    const idAttr = "data-user-id";

    for (const item of listItems) {
      let idItem = item.querySelector(`[${idAttr}]`);
      userId = idItem.getAttribute(idAttr);

      await updateFlag(item, userId);
    }
  };

  const updateFlagsProfile = async (playerId) => {
    flagElement = document.querySelector(".profile-info__flags");
    await updateFlag(flagElement, playerId);
  };

  const updateFlagsMatches = async () => {
    listScores = document.querySelectorAll(".mp-history-player-score__main");

    for (item of listScores) {
      playerNameElement = item.querySelector(
        ".mp-history-player-score__username"
      );
      playerId = playerNameElement.getAttribute("href").split("/")[4];
      await updateFlag(item, playerId);
    }
  };

  const updateFlagsFriends = async () => {
    friendsList = document
      .querySelector(".user-list")
      .querySelectorAll(".user-card__details");

    for (let item of friendsList) {
      playerNameElement = item.querySelector(".user-card__username");
      playerId = playerNameElement.getAttribute("href").split("/")[4];
      await updateFlag(item, playerId);
    }
  };
})();
