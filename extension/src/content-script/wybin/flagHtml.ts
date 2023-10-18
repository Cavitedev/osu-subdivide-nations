import { fetchErrorToText, nextAbortControllerSignal } from "@src/utils/fetchUtils";
import { countryRegionsLocalData } from "@src/utils/flagsJsonUtils";
import { TFlagItems, flagStyleWithMargin, noFlag } from "@src/utils/html";
import { osuWorldUsers } from "@src/utils/osuWorld";


export type TWybinHtmlUserOptions = {
    inlineInsteadOfFlex?: boolean;
};

export const addFlagUsers = async (flagItems: TFlagItems, options?: TWybinHtmlUserOptions) => {
    if(flagItems.length === 0) return;

    const signal = nextAbortControllerSignal();
    
    const playersOsuWorld = await osuWorldUsers(flagItems.map(item => item.id), signal);

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

const flagClass = "fi";

const addRegionalFlag = async (item:HTMLElement, countryCode:string, regionCode:string, options?: TWybinHtmlUserOptions) => {

    if (!item) return;
    const {inlineInsteadOfFlex: flexInParent} = options ?? {};

    const countryRegionsData = (await countryRegionsLocalData)[countryCode];

    if (!countryRegionsData) return;

    const regionData = countryRegionsData["regions"][regionCode];
    if (!regionData) return;

    let flagElements = item.querySelectorAll(`.${flagClass}`);

    const flagElement = flagElements[0];
    const flagElementClone = flagElement.cloneNode(true) as HTMLElement;

    let flag = regionData["flag"];
    if (!flag || flag === "") {
        flag = noFlag;
    }

    flagElementClone.setAttribute("style", (flagStyleWithMargin).replace("$flag", flag));

    const parent = flagElement.parentElement!;

    //Parent div
    const flagsDiv = document.createElement("div");
    flagsDiv.appendChild(flagElement);
    flagsDiv.appendChild(flagElementClone);
  
    if(flexInParent){
        flagsDiv.setAttribute("style", "display: inline")
    }else{
        flagsDiv.setAttribute("style", "display: flex")
    }

    parent.insertBefore(flagsDiv, parent.firstChild);

}