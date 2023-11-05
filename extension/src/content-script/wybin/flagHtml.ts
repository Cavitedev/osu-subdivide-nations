import { fetchErrorToText, fetchOptions } from "@src/utils/fetchUtils";
import { countryRegionsLocalData } from "@src/utils/flagsJsonUtils";
import { TFlagItems, flagStyleWithMargin, noFlag } from "@src/utils/html";
import { osuWorldUser, osuWorldUsers } from "@src/utils/external/osuWorld";

export type TWybinHtmlUserOptions = {
    inlineInsteadOfFlex?: boolean;
} & fetchOptions;

export const addFlagUser = async (item: HTMLElement, userId: string, options?: TWybinHtmlUserOptions) => {
    if (!item) return;
    const playerOsuWorld = await osuWorldUser(userId);
    if (playerOsuWorld.error) {
        const textError = fetchErrorToText(playerOsuWorld);
        console.error(textError);
        return;
    }
    const playerData = playerOsuWorld.data;
    if (!playerData || "error" in playerData) {
        return;
    }
    if (options?.signal?.aborted) return;

    const countryCode = playerData["country_id"];
    const regionCode = playerData["region_id"];
    return addRegionalFlag(item, countryCode, regionCode, options);
};

export const addFlagUsers = async (flagItems: TFlagItems, options?: TWybinHtmlUserOptions) => {
    if (flagItems.length === 0) return;

    const playersOsuWorld = await osuWorldUsers(flagItems.map((item) => item.id));

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
        if (!playerData) continue;
        const countryCode = playerData["country_id"];
        const regionCode = playerData["region_id"];
        const promise = addRegionalFlag(item, countryCode, regionCode, options);
        promises.push(promise);
    }
    await Promise.all(promises);
};

const flagClass = "fi";

const addRegionalFlag = async (
    item: HTMLElement,
    countryCode: string,
    regionCode: string,
    options?: TWybinHtmlUserOptions,
) => {
    if (!item) return;
    const { inlineInsteadOfFlex: flexInParent } = options ?? {};

    const countryRegionsData = (await countryRegionsLocalData)[countryCode];

    if (!countryRegionsData) return;

    const regionData = countryRegionsData["regions"][regionCode];
    if (!regionData) return;

    const flagElements = item.querySelectorAll(`.${flagClass}`);

    const flagElement = flagElements[0];
    const flagElementClone = flagElement.cloneNode(true) as HTMLElement;

    let flag = regionData["flag"];
    if (!flag || flag === "") {
        flag = noFlag;
    }

    flagElementClone.setAttribute("style", flagStyleWithMargin.replace("$flag", flag));

    if (flagElements.length > 1) {
        // Update
        flagElements[1].replaceWith(flagElementClone);
    } else {
        // Add
        const parent = flagElement.parentElement!;

        //Parent div
        const flagsDiv = document.createElement("div");
        flagsDiv.appendChild(flagElement);
        flagsDiv.appendChild(flagElementClone);

        if (flexInParent) {
            flagsDiv.setAttribute("style", "display: inline");
        } else {
            flagsDiv.setAttribute("style", "display: flex");
        }

        parent.insertBefore(flagsDiv, parent.firstChild);
    }
};
