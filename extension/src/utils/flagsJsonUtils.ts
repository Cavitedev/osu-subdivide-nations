import { IfetchResponse, fetchWithoutCache } from "./fetchUtils";
import { nativeLanguageCode, IregionData, getActiveLanguage } from "./languageOsuWorld";

import browser from "webextension-polyfill";

const flagsUrl = browser.runtime.getURL(`flags.json`);
export const countryRegionsLocalData = fetch(flagsUrl).then((res) => res.json()) as Promise<IflagsData>;

export interface IregionsData {
    [key: string]: IregionData;
}

export interface IflagsData {
    [key: string]: {
        name: string;
        nativeName: string;
        regions: IregionsData;
    };
}

export interface Icountries {
    [key: string]: string;
    lang: never;
}

export interface Iregions {
    [key: string]: { [key: string]: string };
    lang: never;
}

const countryUrl = "https://osuworld.octo.moe/locales/{{lang-code}}/countries.json";
const regionsUrl = "https://osuworld.octo.moe/locales/{{lang-code}}/regions.json";

export const getCountryAndRegionName = async (countryCode: string, regionCode: string, regionData: IregionData) => {
    const regionNamePromise = getRegionName(countryCode, regionCode, regionData);
    const countryNamePromise = getCountryName(countryCode);
    const countryName = await countryNamePromise;
    const regionName = await regionNamePromise;

    return { countryName, regionName };
};

export const getCountryName = async (countryCode: string) => {
    const countryNamesLocale = await getCountryNamesLocale();

    const localeCountry = (await countryRegionsLocalData)[countryCode];

    const defaultName = localeCountry.name;
    const nativeName = localeCountry.nativeName;

    if ("lang" in countryNamesLocale && countryNamesLocale["lang"] === nativeLanguageCode) {
        return Promise.resolve(nativeName ?? defaultName);
    } else if (!("lang" in countryNamesLocale)) {
        const countryNameOsuWorld = countryNamesLocale["data"]?.[countryCode];
        return Promise.resolve(countryNameOsuWorld ?? defaultName);
    }
    return Promise.resolve(defaultName);
};

export const getRegionNames = async (countryCode: string) => {
    const regionsOsuWorld = await getRegionNamesLocale();

    const localeRegions = (await countryRegionsLocalData)[countryCode]?.["regions"];

    const defaultNames: { [key: string]: string } = {};
    const nativeNames: { [key: string]: string } = {};
    for (const key in localeRegions) {
        const value = localeRegions[key];
        defaultNames[key] = value["name"];
        nativeNames[key] = value["nativeName"];
    }

    if ("lang" in regionsOsuWorld && regionsOsuWorld["lang"] === nativeLanguageCode) {
        return Promise.resolve(nativeNames ?? defaultNames);
    } else if (!("lang" in regionsOsuWorld)) {
        const regionNamesOsuWorld = regionsOsuWorld["data"]?.[countryCode];
        return Promise.resolve(regionNamesOsuWorld ?? defaultNames);
    }
    return Promise.resolve(defaultNames);
};

export const getRegionName = async (countryCode: string, regionCode: string, regionData: IregionData) => {
    const regionsOsuWorld = await getRegionNamesLocale();

    const defaultName = regionData["name"];
    const nativeName = regionData["nativeName"];

    if ("lang" in regionsOsuWorld && regionsOsuWorld["lang"] === nativeLanguageCode) {
        return Promise.resolve(nativeName ?? defaultName);
    } else if (!("lang" in regionsOsuWorld)) {
        const regionName = regionsOsuWorld?.["data"]?.[countryCode]?.[regionCode];
        return Promise.resolve(regionName ?? defaultName);
    }
    return Promise.resolve(defaultName);
};

const langToRightUpperCases = (lang: string) => {
    const splitLang = lang.split("-");
    if (splitLang.length === 2) {
        return splitLang[0].toLowerCase() + "-" + splitLang[1].toUpperCase();
    }
    const lowerCaseLang = lang.toLowerCase();
    return lowerCaseLang;
};

export const getCountryNamesLocale = async (): Promise<IfetchResponse<Icountries> | { lang: string }> => {
    const lang = await getActiveLanguage();
    if (lang === nativeLanguageCode) return Promise.resolve({ lang: nativeLanguageCode });

    return fetchWithoutCache(countryUrl.replace("{{lang-code}}", langToRightUpperCases(lang))) as Promise<
        IfetchResponse<Icountries>
    >;
};

export const getRegionNamesLocale = async (): Promise<IfetchResponse<Iregions> | { lang: string }> => {
    const lang = await getActiveLanguage();
    if (lang === nativeLanguageCode) return Promise.resolve({ lang: nativeLanguageCode });

    return fetchWithoutCache(regionsUrl.replace("{{lang-code}}", langToRightUpperCases(lang))) as Promise<
        IfetchResponse<Iregions>
    >;
};
