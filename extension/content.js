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

  const regionFromIDandName = (id, name) => {
    playerId = parseInt(id)
    region = localPlayersRegions[playerId];
    return region;
  
  }

  const regionName = (regionData) => {
    return regionData["name"];
  }

  const styleTMP = "background-image: url('$flag')";
  const flagClass = "flag-country";

  const updateFlagsRankings =  () => {
    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");
    const idAttr = "data-user-id";




    for (const item of listItems) {
      userId = item.querySelector(`[${idAttr}]`).getAttribute(idAttr);
      let playerName = item.querySelector(`[data-user-id="${userId}"]`).textContent.trim();
      region = regionFromIDandName(userId, playerName)
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


    playerName = document.querySelector(".profile-info__name").querySelector("span").textContent.trim();
    region = regionFromIDandName(playerId, playerName)

    if (!region) {
      return;
    }

    countryCode = region.split("-")[0];

    let countryRegionsData = loadedCountryRegions[countryCode];

    if (countryRegionsData) {
      const regionData = countryRegionsData["regions"][region];
      if (!regionData) return;
      
      flagElement = document.querySelector(".profile-info__flags").querySelector(`.${flagClass}`);
      if (regionData["flag"]) {
        flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
      }

      if (regionData["name"]) {
        flagElement.setAttribute("title", regionName(regionData));
      }
    }
  }

  const updateFlagsMatches = () => {

    listScores = document.querySelectorAll(".mp-history-player-score__main")

    for (item of listScores){
      playerNameElement = item.querySelector(".mp-history-player-score__username");
      playerName = playerNameElement.textContent.trim()
      playerId = playerNameElement.getAttribute("href").split("/")[4]

      region = regionFromIDandName(playerId, playerName)
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


  }


  const updatePages = () => {
    currentUrl = window.location.href;
    console.log(currentUrl);

    if(currentUrl.startsWith("https://osu.ppy.sh/rankings")){
      updateFlagsRankings();
    } else if (currentUrl.startsWith("https://osu.ppy.sh/users/")){
      const playerId = currentUrl.split("/")[4];
      updateFlagsProfile(playerId); 
    }else if (currentUrl.startsWith("https://osu.ppy.sh/community/matches/")){
      updateFlagsMatches();
    }


  }

  updatePages();
})();
