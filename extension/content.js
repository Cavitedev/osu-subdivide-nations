(async () => {
  const src = chrome.runtime.getURL("local_user_regions.js");
  const content = await import(src);
  const localPlayersRegions = content.localPlayersRegions;

  const updateFlagsRankings = async () => {
    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");
    const idAttr = "data-user-id";
    const flagClass = "flag-country";

    const styleTMP = "background-image: url('$flag')";

    let loadedCountryRegions = {};

    for (const item of listItems) {
      id = item.querySelector(`[${idAttr}]`).getAttribute(idAttr);
      console.log(id);
      region = localPlayersRegions[id];
      if (!region) {
        continue;
      }

      countryCode = region.split("-")[0];

      let countryRegionsData = loadedCountryRegions[countryCode];

      if (!countryRegionsData) {
        const url = chrome.runtime.getURL(`flags/${countryCode}.json`);
        const respone = await fetch(url);
        countryRegionsData = await respone.json();
        loadedCountryRegions[countryCode] = countryRegionsData;
      }

      if (countryRegionsData) {
        const regionData = countryRegionsData[region];
        if (!regionData) continue;

        if (regionData["flag"]) {
          flagElement = item.querySelector(`.${flagClass}`);
          flagElement.style = styleTMP.replace("$flag", regionData["flag"]);
        }

        if (regionData["name"]) {
          flagElement.setAttribute("title", regionData["name"]);
        }
      }
    }
  };

  updateFlagsRankings();
})();
