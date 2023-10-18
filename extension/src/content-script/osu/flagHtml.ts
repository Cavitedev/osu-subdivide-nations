import { fetchErrorToText } from "../../utils/fetchUtils";
import { countryRegionsLocalData, getCountryName, getRegionName } from "../../utils/flagsJsonUtils";
import { osuWorldUser, osuWorldUsers } from "../../utils/osuWorld";
import { addOrReplaceQueryParam } from "../../utils/utils";
import { currentSignal } from "./content";
import osuNameToCode from "./osuNameToCode";

// Quotes needed for special characters
const flagStyle = 'background-image: url("$flag"); background-size: auto 100%';
const marginLeftStyle = "margin-left: 4px";
const flagStyleWithMargin = flagStyle + ";" + marginLeftStyle;
const noFlag = "https://upload.wikimedia.org/wikipedia/commons/4/49/Noflag2.svg";

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
    signal?: AbortSignal;
};

export type TFlagItems = {
    id: string,
    item: HTMLElement
}[];

export const addFlagUser = async (
    item: HTMLElement,
    userId?: string | null,
    options?: osuHtmlUserOptions,
): Promise<regionAndCountry> => {
    if (!userId) return;
    const resultNames = await _addFlagUser(item, userId, options);
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
): Promise<regionAndCountry> => {
    if (!item) return;
    const playerOsuWorld = await osuWorldUser(userId, options?.signal ?? currentSignal());
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
    const playersOsuWorld = await osuWorldUsers(flagItems.map(item => item.id), options?.signal ?? currentSignal());

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

    for(const playerData of playersData){
        const item = flagItems.find(item => item.id === playerData.id.toString())?.item;
        if(!item) continue;
        const countryCode = playerData["country_id"];
        const regionCode = playerData["region_id"];
        const promise =  addRegionalFlag(item, countryCode, regionCode, options);
        promises.push(promise);
    }
    await Promise.all(promises);


}

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
    } = options ?? {};

    const countryRegionsData = (await countryRegionsLocalData)[countryCode];

    if (!countryRegionsData) return;

    const regionData = countryRegionsData["regions"][regionCode];
    if (!regionData) return;

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
            const updatedHref = addOrReplaceQueryParam(href as string, "region", regionCode);

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

const updateCountryNameFlag = async (item: HTMLElement) => {
    const flagElement = item.querySelector(`.${flagClass}`);
    if (!flagElement) return;

    const osuCountryName = flagElement.getAttribute("original-title") ?? flagElement.getAttribute("title");
    if (!osuCountryName) return;

    const countryCode = osuNameToCode(osuCountryName!);
    if (!countryCode) return;

    const countryName = await getCountryName(countryCode);
    if (!countryName) return;
    flagElement.setAttribute("original-title", osuCountryName);
    flagElement.setAttribute("title", countryName);
    return countryName;
};
