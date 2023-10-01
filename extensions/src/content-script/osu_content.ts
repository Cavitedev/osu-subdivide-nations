
import { cleanCacheConditionally } from "@src/utils/cache";
import { unknownUserError, fetchErrorToText } from "@src/utils/fetchUtils";
import { getRegionNamesLocale, nativeLanguageCode, IregionData } from "@src/utils/language";
import { osuWorldUser, osuWorldCountryRegionRanking, IosuWorldRegionalPlayerData, buildProfileUrl } from "@src/utils/osuWorld";
import { addOrReplaceQueryParam, removeQueryParam, convertToGroupsOf5, isNumber } from "@src/utils/utils";


(async () => {
  cleanCacheConditionally();

  // Import Flags
  const flagsUrl = chrome.runtime.getURL(`flags.json`);
  const countryRegionsLocalData = fetch(flagsUrl).then(res => res.json());
  let runningId = 0;

  chrome.runtime.onMessage.addListener(async (obj, sender, respone) => {

    const {  action } = obj;
    if (action && action === "osu_flag_refresh") {
      await updateRegionsDropdown();
      refreshOverlays();
      init();
    }
  });

  const idFromProfileUrl = (url: string) => {
    return url.split("/")[4];
  };



  const getRegionNames = async (countryCode: string) => {
    const regionsOsuWorld = await getRegionNamesLocale();


    const localeRegions = (await countryRegionsLocalData)[countryCode]?.["regions"];

    const defaultNames: {[key:string]: string} = {};
    const nativeNames: {[key:string]: string} = {};
    for (const key in localeRegions) {
      const value = localeRegions[key];
      defaultNames[key] = value["name"];
      nativeNames[key] = value["nativeName"];
    }

    if ("lang" in regionsOsuWorld && regionsOsuWorld["lang"] === nativeLanguageCode) {
      return Promise.resolve(nativeNames ?? defaultNames);
    } else if(!("lang" in regionsOsuWorld)) {
      const regionNamesOsuWorld = regionsOsuWorld["data"]?.[countryCode];
      return Promise.resolve(regionNamesOsuWorld ?? defaultNames);
    }
    return Promise.resolve(defaultNames);
  };

  const getRegionName = async (countryCode:string, regionCode:string, regionData: IregionData) => {
    const regionsOsuWorld = await getRegionNamesLocale();

    const defaultName = regionData["name"];
    const nativeName = regionData["nativeName"];

    if ("lang" in regionsOsuWorld && regionsOsuWorld["lang"] === nativeLanguageCode) {
      return Promise.resolve(nativeName ?? defaultName);
    } else if(!("lang" in regionsOsuWorld)){
      const regionName = regionsOsuWorld?.["data"]?.[countryCode]?.[regionCode];
      return Promise.resolve(regionName ?? defaultName);
    }
    return Promise.resolve(defaultName);
  };

  // Quotes needed for special characters
  const flagStyle = 'background-image: url("$flag"); background-size: contain';
  const marginLeftStyle = "margin-left: 4px";
  const flagStyleWithMargin = flagStyle + ";" + marginLeftStyle;
  const flagClass = "flag-country";
  const noFlag =
    "https://upload.wikimedia.org/wikipedia/commons/4/49/Noflag2.svg";

  const removeRegionalFlag = (item: HTMLElement) => {
    if (!item) return;
    let flagElements = item.querySelectorAll(`.${flagClass}`);
    if (!flagElements || flagElements.length < 2) return;
    flagElements[1].setAttribute("style", "height: 0px; width: 0px;");
  };

  const addFlag = (
    item: HTMLElement,
    addDiv = false,
    addMargin = true,
    superParentClone = false
  ) => {
    if (!item) return;
    let flagElements = item.querySelectorAll(`.${flagClass}`);
    if (!flagElements || flagElements.length != 1) return;

    let flagElement = flagElements[0];
    let flagParent = flagElement.parentElement!;

    let flagParentClone = flagParent.cloneNode(true) as HTMLElement;
    let flagElementClone = flagParentClone.querySelector(`.${flagClass}`)!;

    flagElementClone.setAttribute("style", addMargin ? marginLeftStyle : "");

    flagElementClone.removeAttribute("title");
    flagElementClone.removeAttribute("href");

    let href = flagParentClone.getAttribute("href");
    if (!href) {
      const hrefCandidate = flagParent.parentElement!.getAttribute("href");
      if (hrefCandidate && hrefCandidate.includes("performance")) {
        href = hrefCandidate;
        const anchorParent = document.createElement("a");
        anchorParent.appendChild(flagParentClone);
        flagParentClone = anchorParent;
      }
    }

    let insertParent = flagParent.parentElement!;

    // Check again if flag is already added
    flagElements = item.querySelectorAll(`.${flagClass}`);
    if (flagElements.length > 1) {
      // Update
      flagElements[1].replaceWith(flagElementClone);
    } else {
      // Add
      let sibling = flagParent.nextSibling;
      if (addDiv) {
        const flagsDiv = document.createElement("div");
        flagsDiv.appendChild(flagParent);
        flagsDiv.appendChild(flagParentClone);

        const classAttr = flagParent.getAttribute("class");
        if (classAttr) {
          flagsDiv.setAttribute("class", classAttr);
          flagParent.removeAttribute("class");
          flagParentClone.removeAttribute("class");
        }

        flagParent.setAttribute("style", "display: inline-block");
        flagParentClone.setAttribute("style", "display: inline-block");
        flagParentClone = flagsDiv;
      }

      if (superParentClone) {
        const superParent = insertParent.cloneNode(false) as HTMLElement;
        superParent.appendChild(flagParentClone);
        flagParentClone = superParent;
        sibling = insertParent.nextSibling;
        insertParent = insertParent.parentElement!;
        // insertParent.insertBefore(flagParentClone, flagParent.nextSibling);
      }

      insertParent.insertBefore(flagParentClone, sibling);
    }
  };

  const updateRegionalFlag = async (
    item: HTMLElement,
    countryCode: string,
    regionCode: string,
    addMargin = true
  ) => {
    if (!item) return;
    let flagElements = item.querySelectorAll(`.${flagClass}`);
    if (!flagElements || flagElements.length == 0) return;

    let countryRegionsData = (await countryRegionsLocalData)[countryCode];

    if (countryRegionsData) {
      const regionData = countryRegionsData["regions"][regionCode];
      if (!regionData) return;

      let flagElement = flagElements[1] as HTMLElement;
      if (!flagElement) return;

      let originalFlagElement = flagElements[0];

      let flag = regionData["flag"];
      if (!flag || flag === "") {
        flag = noFlag;
      }
      flagElement.setAttribute("style", (addMargin ? flagStyleWithMargin : flagStyle).replace(
        "$flag",
        flag
      ));

      const regionName = await getRegionName(
        countryCode,
        regionCode,
        regionData
      );
      if (regionData["name"]) {
        flagElement.setAttribute("title", regionName);
      }

      let flagParent = flagElement.parentElement!;
      let originalParent = originalFlagElement.parentElement;
      if (flagParent!.nodeName != "A") {
        flagParent = flagParent!.parentElement!;
        originalParent = originalParent!.parentElement;
      }

      if (flagParent!.nodeName === "A") {
        let href = originalParent!.getAttribute("href")!;
        const updatedHref = addOrReplaceQueryParam(
          href,
          "region",
          regionCode
        );

        flagParent.setAttribute("href", updatedHref);
      }
      return regionName;
    }
  };

  const updateFlagUser = async (item: HTMLElement, userId: string, addMargin = true) => {
    if (!item) return;
    const playerOsuWorld = await osuWorldUser(userId);
    if (playerOsuWorld.error) {
      if (playerOsuWorld.error.code === unknownUserError) {
        return;
      }
      const textError = fetchErrorToText(playerOsuWorld);
      console.log(textError);
      removeRegionalFlag(item);
      return;
    }
    const playerData = playerOsuWorld.data;
    if(!playerData){
      return;
    }
    if("error" in playerData){
      return;
    }

    const countryCode = playerData["country_id"];
    const regionCode = playerData["region_id"];
    return updateRegionalFlag(item, countryCode, regionCode, addMargin);
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
      updateFlagsProfileCardOverlay(mutations[0].target as HTMLElement);
    }
  });

  const bodyObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const addedNode  of mutation.addedNodes) {
        const card = (addedNode as HTMLElement).querySelector(".user-card");
        if (card) {
          profileCardOverlayFinishObserver.observe(card, {
            attributes: false,
            childList: true,
            subtree: true,
          });
          return;
        }
        const search = (addedNode as HTMLElement).querySelector(".quick-search");
        if (search) {
          firstSearch(search as HTMLElement, false);
          updateFlagSearchObserver.observe(search, {
            attributes: false,
            childList: true,
            subtree: false,
          });
        }
      }
    }
  });

  const updateFlagsProfileCardOverlay = async (card: HTMLElement) => {
    const nameElement = card.querySelector(".user-card__username")!;
    const userId = idFromProfileUrl(nameElement.getAttribute("href")!);
    addFlag(card, true);
    const regionAdded = await updateFlagUser(card, userId);
    if (!regionAdded) {
      removeRegionalFlag(card);
    }
  };

  const refreshOverlays = async () => {
    const overlays = document.querySelectorAll(
      ".user-card .user-card__details"
    );
    for (const overlay of overlays) {
      await updateFlagsProfileCardOverlay(overlay as HTMLElement);
    }
  };

  const refreshSearch = async (mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if(addedNode instanceof HTMLElement){
          if (addedNode.getAttribute("data-section") === "user") {
            addFlag(addedNode, true);
          }
        }

      }
    }

    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if(addedNode instanceof HTMLElement){
        if (addedNode.getAttribute("data-section") === "user") {
          await updateSearchCard(addedNode);
        }
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

  const firstSearch = async (addedNode: HTMLElement, mobile: boolean) => {
    if (!addedNode) return;

    const userCards = addedNode.querySelectorAll("[data-section=user]");
    if (!userCards || userCards.length === 0) return;

    (mobile
      ? updateFlagMobileSearchRefreshObserver
      : updateFlagSearchRefreshObserver
    ).observe(userCards[0].parentElement!, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    for (const userCard of userCards) {
      addFlag(userCard as HTMLElement, true);
    }

    for (const userCard of userCards) {
      await updateSearchCard(userCard as HTMLElement);
    }
  };

  const updateFlagSearchObserver = new MutationObserver(async (mutations) => {
    return firstSearch(mutations[0].addedNodes[0] as HTMLElement, false);
  });

  const updateFlagMobileSearchObserver = new MutationObserver(
    async (mutations) => {
      return firstSearch(mutations[0].addedNodes[0] as HTMLElement, true);
    }
  );

  const updateSearchCard = async (card:HTMLElement) => {
    const userId = idFromProfileUrl(
      card
        .querySelector(".user-search-card__col--username")!.getAttribute("href")!
    );
    await updateFlagUser(card, userId);
  };

  const nextFunctionId = () => {
    const functionId = runningId + 1;
    runningId++;
    bodyObserver.disconnect();

    bodyObserver.observe(document.querySelector("body")!, {
      attributes: false,
      childList: true,
      subtree: false,
    });

    const mobileMenu = document.querySelector(
      ".mobile-menu__item--search > .quick-search"
    );
    if (mobileMenu) {
      updateFlagMobileSearchObserver.observe(mobileMenu, {
        attributes: false,
        childList: true,
        subtree: false,
      });
    }

    return functionId;
  };





  const rankingIdAttr = "data-user-id";

  const addLinkToFlag = (item: HTMLElement) => {
    const flags = item.querySelectorAll(`.${flagClass}`);

    if (!flags || flags.length != 1) {
      return;
    }

    const anchorParent = document.createElement("div");
    const parent = flags[0].parentElement!;
    anchorParent.appendChild(flags[0]);
    parent.insertBefore(anchorParent, parent.firstChild);
  };

  const updateFlagsRankings = async () => {
    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");

    const url = location.href;

    if (url.includes("/country")) {
      return;
    }

    if (
      url.includes("osu.ppy.sh/multiplayer/rooms") ||
      url.includes("osu.ppy.sh/rankings/kudosu") ||
      (url.includes("osu.ppy.sh/rankings") && url.includes("charts"))
    ) {
      for (const item of listItems) {
        addLinkToFlag(item as HTMLElement);
      }
    }
    const functionId = nextFunctionId();


    const isRegionRanking = await regionsInRanking(functionId);
    if(isRegionRanking) return;

    for (const item of listItems) {
      addFlag(item as HTMLElement, true);
    }

    for (const item of listItems) {
      if (functionId != runningId) {
        return;
      }
      let idItem = item.querySelector(`[${rankingIdAttr}]`)!;
      const userId = idItem.getAttribute(rankingIdAttr)!;

      await updateFlagUser(item as HTMLElement, userId);
    }
  };

  const regionsInRanking = async (functionId: number) : Promise<boolean> => {
    const queryString = location.search;
    const urlParams = new URLSearchParams(queryString);
    const regionUrlParam = urlParams.get("region");
    const countryUrlParam = urlParams.get("country");


    const rankingType = location.pathname.split("/")[3];
    const filter = urlParams.get("filter");
    
    if (rankingType === "performance" &&
        (!filter || filter === "all") 
        && countryUrlParam) {
      addRegionsDropdown(countryUrlParam, regionUrlParam);
      if(!regionUrlParam) return false;
      const regionData =
      (await countryRegionsLocalData)[countryUrlParam]?.["regions"]?.[regionUrlParam];
      if (regionData) {
        const page = urlParams.get("page");
        const mode = location.pathname.split("/")[2];
        await regionalRanking(
          functionId,
          mode,
          countryUrlParam,
          regionUrlParam,
          page != null ? parseInt(page) : 1
        );
        return true;
      }
    }
    return false;
  }

  const updateRegionsDropdown = async () => {
    const addedDropdown = document.querySelector("#cavitedev_region_dropdown");
    if (!addedDropdown) return;

    const queryString = location.search;
    const urlParams = new URLSearchParams(queryString);
    const regionUrlParam = urlParams.get("region");
    const countryUrlParam = urlParams.get("country");

    addedDropdown.remove();
    if(!countryUrlParam || !regionUrlParam) return;
    addRegionsDropdown(countryUrlParam, regionUrlParam);
  };

  const addRegionsDropdown = async (countryCode: string, regionCode: string | null) => {
    const addedDropdown = document.querySelector("#cavitedev_region_dropdown");
    let regionNames = await getRegionNames(countryCode);
    const regionNamesKeys = Object.entries(regionNames).sort(
      ([key1, value1], [key2, value2]) => value1.localeCompare(value2)
    );

    regionNames = Object.fromEntries(regionNamesKeys);

    // remove dropdown if country isn't supported by osu!world
    if (!Object.keys(regionNames).length) {
      if (addedDropdown) {
        addedDropdown.remove();
      }

      return;
    }

    if (addedDropdown) {
      return;
    }

    const originalDropdown = document.querySelector(".ranking-filter--full");
    // May not be loaded yet
    if (!originalDropdown) return;
    const cloneDropdown = originalDropdown.cloneNode(true) as HTMLElement;

    cloneDropdown.setAttribute("id", "cavitedev_region_dropdown");
    cloneDropdown.querySelector(".ranking-filter__title")!.textContent =
      "Region";

    const predefinedAnchor = cloneDropdown.querySelector(
      ".select-options__select .select-options__option"
    )!;
    const selectDiv = cloneDropdown.querySelector(".select-options")!;

    predefinedAnchor.addEventListener("click", function (event) {
      event.preventDefault();
      selectDiv.classList.toggle("select-options--selecting");
    });

    // Options
    const optionsParent = cloneDropdown.querySelector(
      ".select-options__selector"
    )!;
    const templateOption = optionsParent!.firstChild!.cloneNode(true) as HTMLElement;

    while (optionsParent!.firstChild) {
      optionsParent!.removeChild(optionsParent!.firstChild);
    }

    // All
    const baseRanking = addOrReplaceQueryParam(
      templateOption.getAttribute("href")!,
      "country",
      countryCode
    );

    const allLink = removeQueryParam(baseRanking, "region");
    templateOption.setAttribute("href", allLink);

    const allText = templateOption.textContent;

    const allOption = templateOption.cloneNode(true);
    optionsParent.appendChild(allOption);

    for (const key in regionNames) {
      const value = regionNames[key];
      const updatedRanking = addOrReplaceQueryParam(
        baseRanking,
        "region",
        key
      );
      const clonedOption = templateOption.cloneNode(true) as HTMLElement;
      clonedOption.setAttribute("href", updatedRanking);
      clonedOption.textContent = value;
      optionsParent.appendChild(clonedOption);
    }

    const selectedRegionName = regionCode != null ? regionNames[regionCode] ?? allText : allText;
    cloneDropdown.querySelector(
      ".select-options__select .u-ellipsis-overflow"
    )!.textContent = selectedRegionName;

    if (document.querySelector("#cavitedev_region_dropdown")) return;

    originalDropdown.parentElement!.appendChild(cloneDropdown);
  };

  const regionalRanking = async (
    functionId: number,
    osuMode: string,
    countryCode: string,
    regionCode: string,
    osuPage = 1
  ) => {
    initRegionalRanking(regionCode);

    if (!osuPage) osuPage = 1;

    const pagesToCheck = convertToGroupsOf5(osuPage);

    let totalPages;
    let replaceIndex = 0;

    const listItems = document.querySelectorAll(".ranking-page-table>tbody>tr");

    for (const row of listItems) {
      addFlag(row as HTMLElement);
    }

    for (const page of pagesToCheck) {
      if (functionId != runningId) return;

      const results = await osuWorldCountryRegionRanking(
        countryCode,
        regionCode,
        osuMode,
        page
      );
      if(!results || "error" in results){
        return;
      }

      for (const player of results["top"]) {
        const row = listItems[replaceIndex] as HTMLElement;
        updateRankingRow(row, player);
        await updateRegionalFlag(row as HTMLElement, countryCode, regionCode);
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

      if (page >= totalPages) break;

    }

    for (let i = listItems.length - 1; i >= replaceIndex; i--) {
      listItems[i].remove();
    }
  };

  const removeColsRegionalRanking = [7, 6, 5, 3];

  const initRegionalRanking = ( regionCode: string) => {
    const modes = document.querySelectorAll(".game-mode [href]");
    for (const mode of modes) {
      const href = mode.getAttribute("href")!;
      const updatedHref = addOrReplaceQueryParam(
        href,
        "region",
        regionCode
      );

      // Already fixed
      if (href === updatedHref) return;

      mode.setAttribute("href", updatedHref);
    }

    const headerRow = document.querySelector(".ranking-page-table>thead>tr")!;
    const headers = headerRow.children;

    for (const index of removeColsRegionalRanking) {
      headers[index].remove();
    }

    headers[2].textContent = "Rank";
  };

  const updateRankingRow = async (row:HTMLElement, playerData: IosuWorldRegionalPlayerData) => {
    const cells = row?.children;
    //Not loaded yet
    if (!cells) return;
    const flagAndNameCell = cells[1];

    const { id, username, rank, mode, pp } = playerData;

    const nameElement = flagAndNameCell.querySelector(`[${rankingIdAttr}]`)!;
    nameElement.setAttribute(rankingIdAttr, id.toString());
    nameElement.setAttribute("href", buildProfileUrl(id.toString(), mode));
    nameElement.textContent = username;

    const performanceCell = cells[4];
    performanceCell.textContent = Math.round(pp).toLocaleString();

    for (const index of removeColsRegionalRanking) {
      cells[index].remove();
    }
    cells[2].textContent = "#" + rank.toLocaleString();

    row.classList.remove("ranking-page-table__row--inactive");
  };

  const updateRankingPagination = (
    currentPage: number,
    totalPages: number,
    osuMode: string,
    countryCode: string,
    regionCode: string
  ) => {
    const paginations = document.querySelectorAll(".pagination-v2") as NodeListOf<HTMLElement> ;

    if (totalPages === 1) {
      paginations.forEach((pagination) => pagination.remove());
      return;
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

    const activePageTemplate = htmlTemplates[0]! as HTMLElement;
    const inactivePageTemplate = htmlTemplates[1]! as HTMLElement;
    const dotsTemplate = htmlTemplates[2]! as HTMLElement;
    const enabledArrow = htmlTemplates[3]! as HTMLElement;
    const disabledArrow = htmlTemplates[4]! as HTMLElement;

    for (const templateWithLink of [
      inactivePageTemplate,
      enabledArrow.parentElement,
    ]) {
      const linkInactive = (templateWithLink as HTMLElement).querySelector("[href]")!;
      const href = linkInactive.getAttribute("href")!;

      let updatedHref = addOrReplaceQueryParam(
        href,
        "region",
        regionCode
      );

      updatedHref = addOrReplaceQueryParam(
        updatedHref,
        "country",
        countryCode
      );
      updatedHref = updatedHref.replace("fruits", osuMode);

      linkInactive.setAttribute("href", updatedHref);
    }

    for (const pagination of paginations) {
      // Fix pages

      const pages = pagination.querySelector(".pagination-v2__col--pages")!;

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
        (currentPage > 1
          ? enabledArrow.cloneNode(true)
          : disabledArrow.cloneNode(true)) as HTMLElement;
      leftArrow.querySelector(".hidden-xs")!.textContent = "prev";
      oldArrows[0].replaceWith(leftArrow);

      const rightArrow =
        (currentPage < totalPages
          ? enabledArrow.cloneNode(true)
          : disabledArrow.cloneNode(true)) as HTMLElement;
      rightArrow.querySelector(".hidden-xs")!.textContent = "next";
      oldArrows[1].replaceWith(rightArrow);
    }
  };

  const pageToAdd = (
    addingPage: number,
    currentPage: number,
    totalPages: number,
    activePageTemplate: HTMLElement,
    inactivePageTemplate: HTMLElement,
    dotsTemplate: HTMLElement
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
      updatePagePagination(node as HTMLElement, addingPage);
      return node;
    }

    if (useLeftDots && addingPage === 1) {
      const node = inactivePageTemplate.cloneNode(true);
      updatePagePagination(node as HTMLElement, 1);
      return node;
    }

    if (useLeftDots && addingPage === paginationElementsCount) {
      const node = inactivePageTemplate.cloneNode(true);
      updatePagePagination(node as HTMLElement, totalPages);
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
    updatePagePagination(node as HTMLElement, addingPage);
    return node;
  };

  const updatePagePagination = (paginationItem:HTMLElement, page: number) => {
    const link = paginationItem.querySelector(".pagination-v2__link")!;
    link.textContent = page.toString();
    const href = link.getAttribute("href");
    if (href) {
      link.setAttribute(
        "href",
        addOrReplaceQueryParam(href, "page", page.toString())
      );
    }
  };

  let beatmapsetMutationObserver = new MutationObserver((_) => {
    updateFlagsBeatmapsets();
  });

  const updateFlagsBeatmapsets = async () => {
    const functionId = nextFunctionId();

    const linkItem = document.querySelector(".beatmapset-scoreboard__main");
    if (linkItem) {
      beatmapsetMutationObserver.observe(linkItem, {
        attributes: false,
        childList: true,
        subtree: false,
      });
    } 

    const topScoreElements = document.querySelectorAll(
      ".beatmap-score-top__user-box"
    );
    if (!topScoreElements) {
      return;
    }

    for (const topScoreElement of topScoreElements) {
      addFlag(topScoreElement as HTMLElement, true);
    }

    for (const topScoreElement of topScoreElements) {
      const topScoreUserElement = topScoreElement.querySelector(
        ".beatmap-score-top__username"
      );
      const topScoreUserId = (topScoreUserElement as HTMLElement).getAttribute("data-user-id");
      if (topScoreUserId) {
        await updateFlagUser(topScoreElement as HTMLElement, topScoreUserId, true);
      }
    }

    const rankingTable = document.querySelector(
      ".beatmap-scoreboard-table__body"
    );
    if (!rankingTable) {
      return;
    }

    const items = rankingTable.children;
    for (let item of items) {
      addFlag(item as HTMLElement, true);
    }

    for (let item of items) {
      if (functionId != runningId) {
        return;
      }
      const playerNameElement = item.querySelector(
        ".beatmap-scoreboard-table__cell-content--user-link"
      );
      const playerId = playerNameElement?.getAttribute("data-user-id")!;
      await updateFlagUser(item  as HTMLElement, playerId, true);
    }
  };

  let profileMutationObserverInit = new MutationObserver((_) => {
    updateFlagsProfile();
  });

  const updateFlagsProfile = async () => {
    const url = location.href;
    const playerId = idFromProfileUrl(url);
    if (!isNumber(playerId)) {
      return;
    }

    nextFunctionId();

    const flagElement = document.querySelector(".profile-info")!;
    addFlag(flagElement as HTMLElement);
    const regionName = await updateFlagUser(flagElement as HTMLElement, playerId);
    if (regionName) {
      const countryNameElement = flagElement.querySelector(
        ".profile-info__flag-text"
      )!;
      countryNameElement.textContent =
        countryNameElement.textContent?.split(" / ")[0] + ` / ${regionName}` ?? regionName;
    } else {
      removeRegionalFlag(flagElement as HTMLElement);
    }
  };

  const gameBeingPlayedMutationObserver = new MutationObserver(
    async (mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          const score = (addedNode as HTMLElement).querySelector(
            ".mp-history-player-score__main"
          );
          if (score) {
            addFlag(score as HTMLElement, true);
          }
        }
      }

      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          const score = (addedNode as HTMLElement).querySelector(
            ".mp-history-player-score__main"
          );
          if (score) {
            await updateFlagInMatchScore(score as HTMLElement);
          }
        }
      }
    }
  );

  let lobbyPlayingMutationObserver = new MutationObserver((mutations) => {
    const addedScores = mutations[mutations.length - 1].addedNodes[0];
    if (!addedScores) return;

    const matchPlay = (addedScores as HTMLElement).querySelector(
      ".mp-history-game__player-scores"
    );
    if (matchPlay) {
      gameBeingPlayedMutationObserver.observe(matchPlay, {
        attributes: false,
        childList: true,
        subtree: false,
      });
    }
  });

  const updateFlagsMatches = async () => {
    const functionId = nextFunctionId();

    const linkItem = document.querySelector(".mp-history-content");
    if (linkItem) {
      lobbyPlayingMutationObserver.observe(linkItem, {
        attributes: false,
        childList: true,
        subtree: false,
      });
    }
Document
    watchPlayingGame();
    updateFlagsInMatchPlay(document, functionId);
  };

  const watchPlayingGame = () => {
    const gamesPlayed = document.querySelectorAll(".mp-history-game");
    if (!gamesPlayed || gamesPlayed.length === 0) return;
    const lastGame = gamesPlayed[gamesPlayed.length - 1];
    if (!lastGame) return;
    const scores = lastGame.querySelector(".mp-history-game__player-scores");
    if (scores && scores.children.length === 0) {
      gameBeingPlayedMutationObserver.observe(scores, {
        attributes: false,
        childList: true,
        subtree: false,
      });
    }
  };

  const updateFlagsInMatchPlay = async (scores: ParentNode, functionId: number) => {
    const listScores = scores.querySelectorAll(".mp-history-player-score__main");

    for (const item of listScores) {
      addFlag(item as HTMLElement, true);
    }

    for (const item of listScores) {
      if (functionId != runningId) {
        return;
      }
      await updateFlagInMatchScore(item as HTMLElement);
    }
  };

  const updateFlagInMatchScore = async (item: HTMLElement) => {
    const playerNameElement = item.querySelector(
      ".mp-history-player-score__username"
    ) as HTMLElement;
    const playerId = idFromProfileUrl(playerNameElement.getAttribute("href")!);
    await updateFlagUser(item, playerId);
  };

  const updateFlagsFriendsObserver = new MutationObserver((mutations) => {
    updateFlagsFriends();
  });



  const updateFlagsFriends = async () => {
    const functionId = nextFunctionId();

    updateFlagsFriendsObserver.observe(document.querySelector(".t-changelog-stream--all")!, {
      attributes: true,
      attributeFilter: ['href']
    });

    const friendsList = document
      .querySelector(".user-list")!.querySelectorAll(".user-card__details");

    for (let item of friendsList) {
      addFlag(item as HTMLElement);
    }
    for (let item of friendsList) {
      if (functionId != runningId) {
        return;
      }
      const playerNameElement = item.querySelector(".user-card__username") as HTMLElement;
      const playerId = idFromProfileUrl(playerNameElement.getAttribute("href")!);
      await updateFlagUser(item as HTMLElement, playerId);
    }
  };

  const updateFlagsTopics = async () => {
    const functionId = nextFunctionId();
   const  posts = document.querySelectorAll(".forum-post-info");

    for (let item of posts) {
      addFlag(item as HTMLElement, false, false, true);
    }
    for (let item of posts) {
      if (functionId != runningId) {
        return;
      }
      const playerNameElement = item.querySelector(".forum-post-info__row--username") as HTMLElement;
      const playerId = playerNameElement.getAttribute("data-user-id")!;
      updateFlagUser(item as HTMLElement, playerId, false);
    }
  };

  const reloadMutationObserver = new MutationObserver((_) => {
    init();
  });

  const init = async () => {
    reloadMutationObserver.observe(document.querySelector("title")!, {
      childList: true,
    });
    //Invalidate previous executions
    nextFunctionId();

    const url = location.href;
    
    if (
      url.includes("osu.ppy.sh/rankings") ||
      url.includes("osu.ppy.sh/multiplayer/rooms") ||
      url.includes("osu.ppy.sh/rankings/kudosu")
    ) {
      updateFlagsRankings();
    } else if (url.includes("osu.ppy.sh/users")) {
      const linkItem = document.querySelector(
        "body > div.osu-layout__section.osu-layout__section--full > div"
      ) as HTMLElement;
      profileMutationObserverInit.observe(linkItem, {
        attributes: false,
        childList: true,
        subtree: false,
      });

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
    } else if (url.includes("osu.ppy.sh/scores")) {
      // The flag appears in a card same as overlays
      refreshOverlays();
    }
  };
  
  await init();

})();
