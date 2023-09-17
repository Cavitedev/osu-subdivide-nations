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

  const osuWorldUser = async (url) => {
    return tools.osuWorldUser(url);
  };

  const unknownUserError = "unknown_user";

  const getRegionNames = async (countryCode) => {
    const regionsOsuWorld = await tools.getRegionNamesLocale();

    const regionNamesOsuWorld = regionsOsuWorld?.["data"]?.[countryCode];
    const localeRegions = loadedCountryRegions[countryCode]?.["regions"];

    const defaultNames = {};
    const nativeNames = {};
    for (const key in localeRegions) {
      const value = localeRegions[key];
      defaultNames[key] = value["name"];
      nativeNames[key] = value["nativeName"];
    }

    if (regionsOsuWorld["lang"] === tools.nativeLanguageCode) {
      return Promise.resolve(nativeNames ?? defaultNames);
    } else {
      return Promise.resolve(regionNamesOsuWorld ?? defaultNames);
    }
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

  const addFlag = async (item, countryCode, regionCode, addDiv = false) => {
    let flagElements = item.querySelectorAll(`.${flagClass}`);
    if (!flagElements || flagElements.length == 0) return;

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
      const href = flagParentClone.getAttribute("href");
      if (href) {
        const updatedHref = tools.addOrReplaceQueryParam(
          href,
          "region",
          regionCode
        );
        flagParentClone.setAttribute("href", updatedHref);
      }

      const insertParent = flagParent.parentElement;

      // Check again if flag is already added
      flagElements = item.querySelectorAll(`.${flagClass}`);
      if (flagElements.length > 1) {
        // Update
        flagElements[1].replaceWith(flagElementClone);
      } else {
        // Add
        const sibling = flagParent.nextSibling;
        if (addDiv) {
          const flagsDiv = document.createElement("div");
          flagsDiv.appendChild(flagParent);
          flagsDiv.appendChild(flagParentClone);
          flagsDiv.setAttribute("class", flagParent.getAttribute("class"));
          flagParent.removeAttribute("class");
          flagParentClone.removeAttribute("class");
          flagParent.style = "display: inline-block";
          flagParentClone.style = "display: inline-block";

          insertParent.insertBefore(flagsDiv, sibling);
        } else {
          if (sibling) {
            insertParent.insertBefore(flagParentClone, sibling);
          } else {
            insertParent.appendChild(flagParentClone);
          }
        }
      }

      return regionName;
    }
  };

  const addFlagUser = async (item, userId, addDiv = false) => {
    if (!item) return;
    playerData = await osuWorldUser(userId);
    if (!playerData || playerData["error"] == unknownUserError) {
      return;
    }

    countryCode = playerData["country_id"];
    regionCode = playerData["region_id"];
    return addFlag(item, countryCode, regionCode, addDiv);
  };

  const profileCardOverlayFinishObserver = new MutationObserver((mutations) => {
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

  const bodyObserver = new MutationObserver((mutations) => {
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

        const search = addedNode.querySelector(".quick-search");
        if (search) {
          updateFlagSearchObserver.observe(search, {
            attributes: false,
            childList: true,
            subtree: false,
          });
        }
      }
    }
  });

  const updateFlagsProfileCardOverlay = async (card) => {
    const nameElement = card.querySelector(".user-card__username");
    const userId = idFromProfileUrl(nameElement.getAttribute("href"));
    await addFlagUser(card, userId);
  };

  const refreshOverlays = async () => {
    const overlays = document.querySelectorAll(
      ".user-card .user-card__details"
    );
    for (const overlay of overlays) {
      await updateFlagsProfileCardOverlay(overlay);
    }
  };

  const refreshSearch = async (mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.getAttribute("data-section") === "user") {
          await updateSearchCard(addedNode);
        }
      }
    }
  };

  const updateFlagSearchRefreshObserver = new MutationObserver(
    async (mutations) => {
      return refreshSearch(mutations);
    }
  );
  const updateFlagMobileSearchRefreshObserver = new MutationObserver(
    async (mutations) => {
      return refreshSearch(mutations);
    }
  );

  const firstSearch = async (mutations, mobile) => {
    const addedNode = mutations[0].addedNodes[0];
    if (!addedNode) return;

    const userCards = addedNode.querySelectorAll("[data-section=user]");
    if (!userCards || userCards.length === 0) return;

    (mobile
      ? updateFlagMobileSearchRefreshObserver
      : updateFlagSearchRefreshObserver
    ).observe(userCards[0].parentElement, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    for (const userCard of userCards) {
      await updateSearchCard(userCard);
    }
  };

  const updateFlagSearchObserver = new MutationObserver(async (mutations) => {
    return firstSearch(mutations, false);
  });

  const updateFlagMobileSearchObserver = new MutationObserver(
    async (mutations) => {
      return firstSearch(mutations, true);
    }
  );

  const updateSearchCard = async (card) => {
    const userId = idFromProfileUrl(
      card
        .querySelector(".user-search-card__col--username")
        .getAttribute("href")
    );
    console.log("updateSearchCard " + userId);
    await addFlagUser(card, userId, true);
  };

  const nextFunctionId = () => {
    functionId = runningId + 1;
    runningId++;
    bodyObserver.disconnect();

    bodyObserver.observe(document.querySelector("body"), {
      attributes: false,
      childList: true,
      subtree: false,
    });

    updateFlagMobileSearchObserver.observe(
      document.querySelector(".mobile-menu__item--search > .quick-search"),
      {
        attributes: false,
        childList: true,
        subtree: false,
      }
    );

    return functionId;
  };

  const disconnectObservers = () => {
    rankingMutationObserver.disconnect();
    profileMutationObserver.disconnect();
    beatmapsetMutationObserver.disconnect();
    bodyObserver.disconnect();
  };

  let rankingMutationObserver = new MutationObserver((_) => {
    updateFlagsRankings();
  });

  const rankingIdAttr = "data-user-id";

  const updateFlagsRankings = async () => {
    const functionId = nextFunctionId();

    linkItem = document.querySelector("title");
    rankingMutationObserver.observe(linkItem, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    const queryString = location.search;
    const urlParams = new URLSearchParams(queryString);
    const regionUrlParam = urlParams.get("region");
    const countryUrlParam = urlParams.get("country");

    addRegionsDropdown(countryUrlParam, regionUrlParam);

    if (regionUrlParam) {
      const regionData =
        loadedCountryRegions[countryUrlParam]?.["regions"]?.[regionUrlParam];
      const rankingType = location.pathname.split("/")[3];
      const filter = urlParams.get("filter");

      if (regionData && rankingType === "performance" && (!filter || filter === "all")) {
        const page = urlParams.get("page");
        const mode = location.pathname.split("/")[2];
        return regionalRanking(
          functionId,
          mode,
          countryUrlParam,
          regionUrlParam,
          page
        );
      }
    }

    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");

    for (const item of listItems) {
      if (functionId != runningId) {
        return;
      }
      let idItem = item.querySelector(`[${rankingIdAttr}]`);
      userId = idItem.getAttribute(rankingIdAttr);
      await addFlagUser(item, userId);
    }
  };

  const addRegionsDropdown = async (countryCode, regionCode) => {
    const addedDropdown = document.querySelector("#cavitedev_region_dropdown");
    if (addedDropdown) return;

    const originalDropdown = document.querySelector(".ranking-filter--full");
    const cloneDropdown = originalDropdown.cloneNode(true);

    cloneDropdown.setAttribute("id", "cavitedev_region_dropdown");
    cloneDropdown.querySelector(".ranking-filter__title").textContent =
      "Region";

    const predefinedAnchor = cloneDropdown.querySelector(
      ".select-options__select .select-options__option"
    );
    const selectDiv = cloneDropdown.querySelector(".select-options");

    predefinedAnchor.addEventListener("click", function (event) {
      event.preventDefault();
      selectDiv.classList.toggle("select-options--selecting");
    });

    // Options
    const optionsParent = cloneDropdown.querySelector(
      ".select-options__selector"
    );
    const templateOption = optionsParent.firstChild.cloneNode(true);

    while (optionsParent.firstChild) {
      optionsParent.removeChild(optionsParent.firstChild);
    }

    // All
    const baseRanking = tools.addOrReplaceQueryParam(
      templateOption.getAttribute("href"),
      "country",
      countryCode
    );

    const allText = templateOption.textContent;

    const allOption = templateOption.cloneNode(true);
    optionsParent.appendChild(allOption);

    const regionNames = await getRegionNames(countryCode);

    for (const key in regionNames) {
      const value = regionNames[key];
      const updatedRanking = tools.addOrReplaceQueryParam(
        baseRanking,
        "region",
        key
      );
      const clonedOption = templateOption.cloneNode(true);
      clonedOption.setAttribute("href", updatedRanking);
      clonedOption.textContent = value;
      optionsParent.appendChild(clonedOption);
    }

    cloneDropdown.querySelector(
      ".select-options__select .u-ellipsis-overflow"
    ).textContent = regionNames[regionCode] ?? allText;

    originalDropdown.parentElement.appendChild(cloneDropdown);
  };

  const regionalRanking = async (
    functionId,
    osuMode,
    countryCode,
    regionCode,
    osuPage = 1
  ) => {
    initRegionalRanking(countryCode, regionCode);

    if (!osuPage) osuPage = 1;
    osuPage = parseInt(osuPage);

    const pagesToCheck = tools.convertToGroupsOf5(osuPage);

    let totalPages;
    let replaceIndex = 0;

    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");

    for (const page of pagesToCheck) {
      if (functionId != runningId) return;
      if (page > totalPages) break;

      const results = await tools.osuWorldCountryRegionRanking(
        countryCode,
        regionCode,
        osuMode,
        page
      );

      for (const player of results["top"]) {
        const row = listItems[replaceIndex];
        updateRankingRow(row, player);
        await addFlag(row, countryCode, regionCode);
        replaceIndex++;
      }

      totalPages = results["pages"];

      // First iteration
      if (page === pagesToCheck[0]) {
        updateRankingPagination(
          osuPage,
          Math.ceil(totalPages / 5),
          osuMode,
          countryCode,
          regionCode
        );
      }
    }

    for (let i = listItems.length - 1; i >= replaceIndex; i--) {
      listItems[i].remove();
    }
  };

  const initRegionalRanking = (countryCode, regionCode) => {
    const modes = document.querySelectorAll(".game-mode [href]");
    for (const mode of modes) {
      const href = mode.getAttribute("href");
      const updatedHref = tools.addOrReplaceQueryParam(
        href,
        "region",
        regionCode
      );

      // Already fixed
      if (href === updatedHref) return;

      mode.setAttribute("href", updatedHref);
    }
  };

  const updateRankingRow = async (row, playerData) => {
    const cells = row.children;
    const flagAndNameCell = cells[1];

    const { id, username, mode, pp } = playerData;

    const nameElement = flagAndNameCell.querySelector(`[${rankingIdAttr}]`);
    nameElement.setAttribute(rankingIdAttr, id);
    nameElement.setAttribute("href", tools.buildProfileUrl(id, mode));
    nameElement.textContent = username;

    const accCell = cells[2];
    accCell.textContent = "";

    const playcountCell = cells[3];
    playcountCell.textContent = "";

    const performanceCell = cells[4];
    performanceCell.textContent = Math.round(pp);

    const ssCell = cells[5];
    ssCell.textContent = "";

    const sCell = cells[6];
    sCell.textContent = "";

    const aCell = cells[7];
    aCell.textContent = "";

    row.classList.remove("ranking-page-table__row--inactive");
  };

  const updateRankingPagination = (
    currentPage,
    totalPages,
    osuMode,
    countryCode,
    regionCode
  ) => {
    const paginations = document.querySelectorAll(".pagination-v2");

    if (totalPages === 1) {
      while (paginations.firstChild) {
        paginations.removeChild(paginations.firstChild);
      }
      paginations.forEach((pagination) => pagination.remove());
    }

    const firstLink = paginations[0]
      ?.querySelector("a.pagination-v2__link")
      ?.getAttribute("href");

    // If there was pagination
    if (firstLink) {
      const urlObj = new URL(firstLink);
      const searchParams = new URLSearchParams(urlObj.search);
      const regionParam = searchParams.get("region");

      // Already Updated
      if (regionParam) return;
    }

    const htmlTemplates = [
      '<li class="pagination-v2__item"><span class="pagination-v2__link pagination-v2__link--active">5</span></li>',
      '<li class="pagination-v2__item"><a class="pagination-v2__link" href="https://osu.ppy.sh/rankings/fruits/performance?country=ES&amp;page=4#scores">4</a></li>',
      '<li class="pagination-v2__item"> <span class="pagination-v2__link">...</span></li>',
      '<a class="pagination-v2__link pagination-v2__link--quick" href="https://osu.ppy.sh/rankings/fruits/performance?country=US&amp;page=2#scores"> <span class="hidden-xs"> next </span> <i class="fas fa-angle-right"></i> </a>',
      '<span class="pagination-v2__link pagination-v2__link--quick pagination-v2__link--disabled"> <i class="fas fa-angle-left"></i> <span class="hidden-xs"> prev </span> </span>',
    ].map((html) => {
      const template = document.createElement("div");
      template.innerHTML = html;
      return template.firstChild;
    });

    const activePageTemplate = htmlTemplates[0];
    const inactivePageTemplate = htmlTemplates[1];
    const dotsTemplate = htmlTemplates[2];

    const enabledArrow = htmlTemplates[3];
    const disabledArrow = htmlTemplates[4];

    for (const templateWithLink of [
      inactivePageTemplate,
      enabledArrow.parentElement,
    ]) {
      const linkInactive = templateWithLink.querySelector("[href]");
      const href = linkInactive.getAttribute("href");

      let updatedHref = tools.addOrReplaceQueryParam(
        href,
        "region",
        regionCode
      );

      updatedHref = tools.addOrReplaceQueryParam(
        updatedHref,
        "country",
        countryCode
      );
      updatedHref = updatedHref.replace("fruits", osuMode);

      linkInactive.setAttribute("href", updatedHref);
    }

    for (const pagination of paginations) {
      // Fix pages

      const pages = pagination.querySelector(".pagination-v2__col--pages");

      const oldPages = pages.querySelectorAll(".pagination-v2__item");
      oldPages.forEach((page) => page.remove());

      let addingPage = 1;
      do {
        var page = pageToAdd(
          addingPage,
          currentPage,
          totalPages,
          activePageTemplate,
          inactivePageTemplate,
          dotsTemplate
        );
        if (page) {
          pages.appendChild(page);
        }
        addingPage++;
      } while (page);

      // Fix arrows

      const oldArrows = pagination.querySelectorAll(
        ".pagination-v2__link--quick"
      );

      const leftArrow =
        currentPage > 1
          ? enabledArrow.cloneNode(true)
          : disabledArrow.cloneNode(true);
      leftArrow.querySelector(".hidden-xs").textContent = "prev";
      oldArrows[0].replaceWith(leftArrow);

      const rightArrow =
        currentPage < totalPages
          ? enabledArrow.cloneNode(true)
          : disabledArrow.cloneNode(true);
      rightArrow.querySelector(".hidden-xs").textContent = "next";
      oldArrows[1].replaceWith(rightArrow);
    }
  };

  const pageToAdd = (
    addingPage,
    currentPage,
    totalPages,
    activePageTemplate,
    inactivePageTemplate,
    dotsTemplate
  ) => {
    const useLeftDots = totalPages > 5 && currentPage >= 5;
    const useRightDots = totalPages > 5 && totalPages - currentPage >= 4;
    const paginationElementsCount = Math.min(
      totalPages,
      Math.max(7, 5 + (useLeftDots ? 2 : 0) + (useRightDots ? 2 : 0))
    );

    if (addingPage > paginationElementsCount) {
      return null;
    }

    if (addingPage === currentPage) {
      const node = activePageTemplate.cloneNode(true);
      updatePagePagination(node, addingPage);
      return node;
    }

    if (useLeftDots && addingPage === 1) {
      const node = inactivePageTemplate.cloneNode(true);
      updatePagePagination(node, 1);
      return node;
    }

    if (useLeftDots && addingPage === paginationElementsCount) {
      const node = inactivePageTemplate.cloneNode(true);
      updatePagePagination(node, totalPages);
      return node;
    }

    if (
      (useLeftDots && addingPage === 2) ||
      (useRightDots && addingPage === paginationElementsCount - 1)
    ) {
      const node = dotsTemplate.cloneNode(true);
      return node;
    }

    const node = inactivePageTemplate.cloneNode(true);
    updatePagePagination(node, addingPage);
    return node;
  };

  const updatePagePagination = (paginationItem, page) => {
    const link = paginationItem.querySelector(".pagination-v2__link");
    link.textContent = page;
    const href = link.getAttribute("href");
    if (href) {
      link.setAttribute(
        "href",
        tools.addOrReplaceQueryParam(href, "page", page)
      );
    }
  };

  let beatmapsetMutationObserver = new MutationObserver((_) => {
    updateFlagsBeatmapsets();
  });

  const updateFlagsBeatmapsets = async () => {
    const functionId = nextFunctionId();

    const linkItem = document.querySelector(".beatmapset-scoreboard__main");
    beatmapsetMutationObserver.observe(linkItem, {
      attributes: false,
      childList: true,
      subtree: false,
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
      await addFlagUser(topScoreElement, topScoreUserId, true);
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
      await addFlagUser(item, playerId, true);
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
    const regionName = await addFlagUser(flagElement, playerId);
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
      await addFlagUser(item, playerId);
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
      await addFlagUser(item, playerId);
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
      await addFlagUser(item, playerId);
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
