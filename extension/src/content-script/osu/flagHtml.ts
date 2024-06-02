import { fetchErrorToText } from "../../utils/fetchUtils";
import { countryRegionsLocalData, getCountryName, getRegionName } from "../../utils/flagsJsonUtils";
import { osuWorldUser, osuWorldUsers } from "../../utils/external/osuWorld";
import { addOrReplaceQueryParam } from "../../utils/utils";
import { currentSignal } from "@src/utils/fetchUtils";
import osuNameToCode from "./osuNameToCode";
import { TFlagItems } from "@src/utils/html";
import { noFlag, flagStyleWithMargin, flagStyle } from "@src/utils/html";
import { IregionData } from "@src/utils/external/languageOsuWorld";

export let flagClass: string | null = null;

export const setFlagClass = (flagClassParam: string) => {
    flagClass = flagClassParam;
};

type regionAndCountry =
    | {
          countryCode?: string;
          countryName?: string;
          regionName?: string;
      }
    | undefined;

type osuHtmlUserOptions = {
    addDiv?: boolean;
    addMargin?: boolean;
    addSuperParentClone?: boolean;
    insertInsideOriginalElement?: boolean;
    wikiPage?: boolean;
    topicFlag?: boolean;
    signal?: AbortSignal;
};

export const addFlagUser = async (
    item: HTMLElement,
    userId?: string | null,
    options?: osuHtmlUserOptions,
    mode?: string,
): Promise<regionAndCountry> => {
    if (!userId) return;
    const resultNames = await _addFlagUser(item, userId, options, mode);
    if (!resultNames) {
        const countryName = await updateCountryNameFlag(item);
        return { countryName };
    }
    return resultNames;
};

const _addFlagUser = async (
    item: HTMLElement,
    userId: string,
    options?: osuHtmlUserOptions,
    mode?: string,
): Promise<regionAndCountry> => {
    if (!item) return;
    const playerOsuWorld = await osuWorldUser(userId, mode);
    if (options?.signal?.aborted) return;
    if (playerOsuWorld.error) {
        const textError = fetchErrorToText(playerOsuWorld);
        console.error(textError);
        removeRegionalFlag(item);
        return;
    }
    const playerData = playerOsuWorld.data;
    if (!playerData || "error" in playerData) {
        removeRegionalFlag(item);
        return;
    }

    const countryCode = playerData["country_id"];
    const regionCode = playerData["region_id"];
    return addRegionalFlag(item, countryCode, regionCode, options);
};

export const addFlagUsers = async (flagItems: TFlagItems, options?: osuHtmlUserOptions) => {
    const playersOsuWorld = await osuWorldUsers(
        flagItems.map((item) => item.id),
        options?.signal ?? currentSignal(),
    );

    if (playersOsuWorld.error) {
        const textError = fetchErrorToText(playersOsuWorld);
        console.error(textError);
        return;
    }

    const playersData = playersOsuWorld.data;
    if (!playersData || "error" in playersData) {
        return;
    }

    const promises = [];

    for (const flagItem of flagItems) {
        const item = flagItem.item;
        const playerData = playersData.find((player) => player["id"].toString() === flagItem.id);
        if (!playerData) {
            removeRegionalFlag(item);
            continue;
        }
        const countryCode = playerData["country_id"];
        const regionCode = playerData["region_id"];
        const promise = addRegionalFlag(item, countryCode, regionCode, options);
        promises.push(promise);
    }
    await Promise.all(promises);
};

export const removeRegionalFlag = (item: HTMLElement) => {
    if (!item) return;
    const flagElements = item.querySelectorAll(`.${flagClass}`);
    if (!flagElements || flagElements.length < 2) return;
    flagElements[1].setAttribute("style", "height: 0px; width: 0px;");
};

export const addRegionalFlag = async (
    item: HTMLElement,
    countryCode: string,
    regionCode: string,
    options: osuHtmlUserOptions = {},
) => {
    if (!item) return;
    const {
        addDiv,
        addMargin,
        addSuperParentClone,
        insertInsideOriginalElement: insertInsideThePreviousFlag,
        topicFlag,
        wikiPage,
    } = options ?? {};

    const countryRegionsData = (await countryRegionsLocalData)[countryCode];

    if (!countryRegionsData) return;

    const regionData = countryRegionsData["regions"][regionCode];
    if (!regionData) return;

    if (wikiPage) {
        return addWikiPageFlag(item, regionData);
    }

    let flagElements = item.querySelectorAll(`.${flagClass}`);

    const flagElement = flagElements[0];
    const flagParent = flagElement.parentElement!;
    let flagParentClone = flagParent.cloneNode(true) as HTMLElement;
    const flagElementClone = flagParentClone.querySelector(`.${flagClass}`)!;

    let flag = regionData["flag"];
    if (!flag || flag === "") {
        flag = noFlag;
    }

    flagElementClone.setAttribute("style", (addMargin ? flagStyleWithMargin : flagStyle).replace("$flag", flag));

    if (topicFlag) {
        flagParentClone.classList.add("cavitedev-topic-flag");
        flagParent.parentElement!.classList.add("cavitedev-topic-flag-parent");
    }

    const regionName = await getRegionName(countryCode, regionCode, regionData);
    if (regionData["name"]) {
        flagElementClone.setAttribute("title", regionName);
    }

    let insertParent = insertInsideThePreviousFlag ? flagParent : flagParent.parentElement!;
    if (insertInsideThePreviousFlag) {
        flagParentClone.classList.remove(...flagParentClone.classList);
    }

    // Check again if flag is already added
    flagElements = item.querySelectorAll(`.${flagClass}`);
    if (flagElements.length > 1) {
        // Update
        flagElements[1].replaceWith(flagElementClone);
    } else {
        // Add

        let href = flagParent.getAttribute("href");
        if (!href) {
            const hrefCandidate = flagParent.parentElement!.getAttribute("href");
            if (hrefCandidate && hrefCandidate.includes("performance")) {
                href = hrefCandidate;
                const anchorParent = document.createElement("a");
                anchorParent.appendChild(flagParentClone);
                flagParentClone = anchorParent;
            }
        }

        if (flagParentClone.nodeName === "A") {
            let updatedHref = addOrReplaceQueryParam(href as string, "region", regionCode);
            updatedHref = addOrReplaceQueryParam(updatedHref, "country", countryCode);

            flagParentClone.setAttribute("href", updatedHref);
        }

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

        if (addSuperParentClone) {
            const superParent = insertParent.cloneNode(false) as HTMLElement;
            superParent.appendChild(flagParentClone);
            flagParentClone = superParent;
            sibling = insertParent.nextSibling;
            insertParent = insertParent.parentElement!;
            // insertParent.insertBefore(flagParentClone, flagParent.nextSibling);
        }

        insertParent.insertBefore(flagParentClone, sibling);
    }

    const countryName = await updateCountryNameFlag(item);
    return { countryCode, countryName, regionName };
};

const addWikiPageFlag = async (item: HTMLElement, regionData: IregionData) => {
    const prevElement = item.previousElementSibling;
    if (prevElement && prevElement.classList.contains("cavitedev-flag")) return;

    const flagElement = document.createElement("span");
    flagElement.classList.add(flagClass!);
    flagElement.classList.add("flag-country--flat");
    flagElement.classList.add("flag-country--wiki");
    flagElement.classList.add("cavitedev-flag");

    let flag = regionData["flag"];
    if (!flag || flag === "") {
        flag = noFlag;
    }

    flagElement.setAttribute("style", flagStyle.replace("$flag", flag) + ";margin-right: 4px;border-radius: 2px;");

    const parent = item.parentElement!;
    parent.insertBefore(flagElement, item);

    return undefined;
};

const updateCountryNameFlag = async (item: HTMLElement) => {
    const flagElement = item.querySelector(`.${flagClass}`);
    if (!flagElement) return;

    const osuCountryName = flagElement.getAttribute("original-title") ?? flagElement.getAttribute("title");
    if (!osuCountryName) return;

    const countryCode = osuNameToCode(osuCountryName!);
    if (!countryCode) return;

    const countryName = await getCountryName(countryCode);
    if (!countryName) return osuCountryName;
    flagElement.setAttribute("original-title", osuCountryName);
    flagElement.setAttribute("title", countryName);
    return countryName;
};
