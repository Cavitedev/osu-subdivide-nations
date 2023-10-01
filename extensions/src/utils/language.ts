import { IfetchResponse, fetchWithCache } from "./fetchUtils";


interface Ilanguages {
  [key:string]: string
}

interface Icountries {
  [key:string]: string, 
  lang:never
}

interface Iregions {[key: string]:{[key:string]:string}, lang:never}

export const availableLanguagesOsuWorld = async (): Promise<Ilanguages> => {
  // 1 day cache
  return fetchWithCache(
    "https://osuworld.octo.moe/locales/languages.json",
    86400000
  ).then((res) => {
    const data = res["data"] as Ilanguages;
    const languageKeys = Object.keys(data);
    chrome.storage.local.set({ availableLanguages: languageKeys });
    return data;
  });
};

export interface IregionData{
    name: string;
    flag:string;
    nativeName:string
  }
  
  export interface IregionsData{
    [key: string]: IregionData;
  }
  
  export interface IflagsData {
    [key: string]: {
      name: string;
      nativeName:string
      regions: IregionsData;
    };
  }

  
  const langKey = "lang";
  
  const defaultLang = "EN";
  
  const countryUrl =
    "https://osuworld.octo.moe/locales/{{lang-code}}/countries.json";
  const regionsUrl =
    "https://osuworld.octo.moe/locales/{{lang-code}}/regions.json";
  
  export const systemDefaultCode = "DEF";
  export const nativeLanguageCode = "NAT";
  const availableLanguagesKey = "availableLanguages";
  
  
  const getSupportedSystemLanguage = async () => {
    let availableLanguagesStorage = await chrome.storage.local.get([
      availableLanguagesKey,
    ]);
    //If it does not exist yet
    if (
      Object.keys(availableLanguagesStorage).length === 0 &&
      availableLanguagesStorage.constructor === Object
    ) {
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
    const alternativeCodes: {[key:string]: string} = {
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
      lang = await chrome.storage.sync.get([langKey]);
    } catch (e) {
      lang = null;
    }
    if (
      !lang ||
      (Object.keys(lang).length === 0 && lang.constructor === Object)
    ) {
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
    const previousLang = (await chrome.storage.sync.get([langKey]).catch(() => {
    }))?.[langKey];
    if (previousLang == lang) return;
    try {
      await chrome.storage.sync.set({ [langKey]: lang });
    } catch (e) {
      // Extension invalidated. It doesn't matter too much
    }
  
    chrome.tabs.query({}, function (tabs) {
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const tabId = tab.id;
        console.log(tab.title);
        if(!tabId || !tab.url) continue;
        if(!hasContentScript(tab.url)) continue;
        chrome.tabs.sendMessage(tabId, { action: "osu_flag_refresh" });
      }
    });
  };
  
  const hasContentScript = (url: string) => {
    const matches = [
      "https://osu.ppy.sh/*"
    ]
    for(const match of matches) {
      if(matchesPattern(url, match)) return true;
    }
    return false;
  };
  
  const matchesPattern = (url:string, pattern:string) => {
    return RegExp(`^${pattern}`).test(url);
  }
  
  const eightHours = 28800000;
  
  const langToRightUpperCases = (lang: string) => {
    const splitLang = lang.split("-");
    if (splitLang.length === 2) {
      return splitLang[0].toLowerCase() + "-" + splitLang[1].toUpperCase();
    }
    const lowerCaseLang = lang.toLowerCase();
    return lowerCaseLang;
  };
  
  
  
  export const getCountryNamesLocale = async (): Promise<IfetchResponse<Icountries> | {lang:string}> => {
    const lang = await getActiveLanguage();
    if (lang === nativeLanguageCode)
      return Promise.resolve({ lang: nativeLanguageCode });
  

    return fetchWithCache(
        countryUrl.replace("{{lang-code}}", langToRightUpperCases(lang)),
        eightHours
    ) as Promise<IfetchResponse<Icountries>>;

  };
  
  export const getRegionNamesLocale = async (): Promise<IfetchResponse<Iregions> | {lang:string}> => {
    const lang = await getActiveLanguage();
    if (lang === nativeLanguageCode)
      return Promise.resolve({ lang: nativeLanguageCode });

      return fetchWithCache(
        regionsUrl.replace("{{lang-code}}", langToRightUpperCases(lang)),
        eightHours
      ) as Promise<IfetchResponse<Iregions>>;
  };