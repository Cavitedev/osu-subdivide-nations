import { loadFromCache } from "./cache";
import { IfetchResponse, fetchWithCache } from "./fetchUtils";
import browser from "webextension-polyfill";

export interface Ilanguages {
    [key: string]: string;
}

const languagesUrl = "https://osuworld.octo.moe/locales/languages.json";

export const lastAvailableLanguages = async () => {
    const cacheLanguages = (await loadFromCache(languagesUrl)) as IfetchResponse<Ilanguages> | undefined;
    if (cacheLanguages) {
        return {
            data: cacheLanguages.data,
            expired: cacheLanguages.expireDate! < Date.now(),
        };
    }
    return null;
};

export const availableLanguagesOsuWorld = async (): Promise<Ilanguages> => {
    // 1 day cache
    return fetchWithCache(languagesUrl, 86400000, { preserve: true }).then((res) => {
        const data = res["data"] as Ilanguages;
        const languageKeys = Object.keys(data);
        browser.storage.local.set({ availableLanguages: languageKeys });
        return data;
    });
};

export interface IregionData {
    name: string;
    flag: string;
    nativeName: string;
}

const langKey = "lang";
const defaultLang = "EN";

export const systemDefaultCode = "DEF";
export const nativeLanguageCode = "NAT";
const availableLanguagesKey = "availableLanguages";

const getSupportedSystemLanguage = async () => {
    let availableLanguagesStorage = await browser.storage.local.get([availableLanguagesKey]);
    //If it does not exist yet
    if (Object.keys(availableLanguagesStorage).length === 0 && availableLanguagesStorage.constructor === Object) {
        const availableLanguages = await availableLanguagesOsuWorld();
        availableLanguagesStorage = {
            [availableLanguagesKey]: Object.keys(availableLanguages),
        };
    }

    const availableLanguages = availableLanguagesStorage[availableLanguagesKey];

    const currLang = navigator.language.toUpperCase();
    if (availableLanguages.includes(currLang)) {
        return currLang;
    }
    const split = currLang.split("-");
    if (availableLanguages.includes(split[0])) {
        return split[0];
    }
    const alternativeCodes: { [key: string]: string } = {
        "PT-PT": "PT-BR",
        ES: "ES-ES",
        "EN-GB": "EN",
        SV: "SV-SE",
    };

    const altCode = alternativeCodes[currLang];
    if (altCode) {
        return altCode;
    }

    console.log("No supported language found for lang code: " + currLang);

    return defaultLang;
};

export const getLanguage = async () => {
    let lang;
    try {
        lang = await browser.storage.sync.get([langKey]);
    } catch (e) {
        lang = null;
    }
    if (!lang || (Object.keys(lang).length === 0 && lang.constructor === Object)) {
        setLanguage(systemDefaultCode);
        return systemDefaultCode;
    }
    return lang[langKey];
};

export const getActiveLanguage = async () => {
    const lang = await getLanguage();
    if (lang === systemDefaultCode) {
        const sysLang = await getSupportedSystemLanguage();
        return sysLang;
    }
    return lang;
};

export const setLanguage = async (lang: string) => {
    const previousLang = (await browser.storage.sync.get([langKey]).catch(() => {}))?.[langKey];
    if (previousLang == lang) return;
    try {
        await browser.storage.sync.set({ [langKey]: lang });
    } catch (e) {
        // Extension invalidated. It doesn't matter too much
    }

    const tabs = await browser.tabs.query({});

    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const tabId = tab.id;
        console.log(tab.title);
        if (!tabId || !tab.url) continue;
        if (!hasContentScript(tab.url)) continue;
        browser.tabs.sendMessage(tabId, { action: "osu_flag_refresh" });
    }
};

const hasContentScript = (url: string) => {
    const matches = ["https://osu.ppy.sh/*"];
    for (const match of matches) {
        if (matchesPattern(url, match)) return true;
    }
    return false;
};

const matchesPattern = (url: string, pattern: string) => {
    return RegExp(`^${pattern}`).test(url);
};
