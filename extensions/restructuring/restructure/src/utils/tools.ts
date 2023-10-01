const expireHeader = "expireDate";

const genExpireDate = (expireTime:number) => Date.now() + expireTime;

let pendingRequests : {[key:string]: Promise<any>} = {};


export interface fetchResponse {
  data?: any;
  error?: {
    code: string;
    url: string;
    userId: string;
  };
  cache?: boolean;
  expireDate?: number;
}


const fetchAndSaveInCache = async (url:string, expireTime:number) => {
  return fetch(url)
    .then(async (res) => {
      const jsonResponse = await res.json();
      if (!jsonResponse)
        return {
          error: {
            code: noData,
            url: url,
          },
        };
      let cachedResponse: fetchResponse = {};
      cachedResponse["data"] = jsonResponse;
      cachedResponse[expireHeader] = genExpireDate(expireTime);
      localStorage.setItem(url, JSON.stringify(cachedResponse));
      return cachedResponse;
    })
    .catch((error) => {
      return { error: { code: "cannot_fetch ", url: url } };
    });
}

export const fetchWithCache = async (url:string, expireTime:number) => {




  if (pendingRequests[url] !== undefined) {
    return pendingRequests[url];
  }

  const cachedItemRaw = localStorage.getItem(url);
  if (cachedItemRaw) {
    const cachedItem = JSON.parse(cachedItemRaw);
    const expireDate = cachedItem[expireHeader];
    if (expireDate < Date.now()) {
      return fetchAndSaveInCache(url, expireTime);
    }
    cachedItem["cache"] = true;
    return cachedItem;
  } else {
    const fetchPromise = fetchAndSaveInCache(url, expireTime);
    pendingRequests[url] = fetchPromise;
    const result = await fetchPromise;
    delete pendingRequests[url];
    return result;
  }


};

export const unknownUserError = "unknown_user";
const cannotFetchError = "cannot_fetch";
const noData = "no_data";

export const fetchErrorToText = (response: fetchResponse) => {
  if (!response?.error?.code) return "";
  const error = response.error;
  switch (error.code) {
    case unknownUserError:
      return "Unknown user " + error.userId;
    case cannotFetchError:
      return "Cannot fetch " + error.url;
    case noData:
      return "No data for " + error.url;
    default:
      return "Unknown error";
  }
};

const userDataExpireTime = 1800000; //30 minutes

const fetchWithMinimumWaitTime = async (dataPromise: Promise<fetchResponse>, waitTime: number):Promise<fetchResponse> => {
  const waitPromise = new Promise((resolve) => {
    setTimeout(resolve, waitTime);
  }) as Promise<fetchResponse>;

  return Promise.race([dataPromise, waitPromise])
    .then(async (result) => {
      const hasCache = result && result["cache"];
      const hasError = result && result["error"];
      if (hasError) {
        return result;
      }
      if (hasCache) {
        return result;
      } else {
        await waitPromise;
        return await dataPromise;
      }
    })
    .then((result) => {
      return result as fetchResponse;
    });
};

export const osuWorldUser = async (id: String) => {
  if (!id) {
    console.log("id is null");
    return;
  }

  const url = "https://osuworld.octo.moe/api/users/" + id;

  let dataPromise = fetchWithCache(url, userDataExpireTime);
  return fetchWithMinimumWaitTime(dataPromise, 200);
};

// Modes: osu, taiko, fruits, mania
const regionRankingUrl =
  "https://osuworld.octo.moe/api/{{country-code}}/{{country-region-code}}/top/{{mode}}?page={{page}}";

export const osuWorldCountryRegionRanking = async (
  countryCode: string,
  regionCode: string,
  mode = "osu",
  page = 1
) => {
  if (!countryCode || !regionCode) {
    console.log("countryCode or regionCode is null");
    return;
  }

  const url = regionRankingUrl
    .replace("{{country-code}}", countryCode)
    .replace("{{country-region-code}}", regionCode)
    .replace("{{mode}}", mode)
    .replace("{{page}}", page.toString());

  return fetchWithCache(url, userDataExpireTime).then((result) => {
    return result["data"];
  });
};

const profileUrl = "https://osu.ppy.sh/users/{{user-id}}/{{mode}}";
export const buildProfileUrl = (id: string, mode = "osu") => {
  const url = profileUrl.replace("{{user-id}}", id).replace("{{mode}}", mode);
  return url;
};

const langKey = "lang";
const countriesKey = "countries";
const regionsKey = "regions";

const defaultLang = "EN";

const countryUrl =
  "https://osuworld.octo.moe/locales/{{lang-code}}/countries.json";
const regionsUrl =
  "https://osuworld.octo.moe/locales/{{lang-code}}/regions.json";

export const systemDefaultCode = "DEF";
export const nativeLanguageCode = "NAT";
const availableLanguagesKey = "availableLanguages";

export const availableLanguagesOsuWorld = async (): Promise<{[key:string]: string}> => {
  // 1 day cache
  return fetchWithCache(
    "https://osuworld.octo.moe/locales/languages.json",
    86400000
  ).then((res) => {
    const data = res["data"];
    const languageKeys = Object.keys(data);
    chrome.storage.local.set({ availableLanguages: languageKeys });
    return data;
  });
};

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



export const getCountryNamesLocale = async () => {
  const lang = await getActiveLanguage();
  if (lang === nativeLanguageCode)
    return Promise.resolve({ lang: nativeLanguageCode });

  const countries = localStorage.getItem(countriesKey) as fetchResponse | undefined;
  if (!countries || (countries[expireHeader] && countries[expireHeader] < Date.now())  ) {
    return fetchWithCache(
      countryUrl.replace("{{lang-code}}", langToRightUpperCases(lang)),
      eightHours
    );
  }
  return countries;
};

export const getRegionNamesLocale = async () => {
  const lang = await getActiveLanguage();
  if (lang === nativeLanguageCode)
    return Promise.resolve({ lang: nativeLanguageCode });

  const regions = localStorage.getItem(regionsKey) as fetchResponse | undefined;
  if (!regions || (regions[expireHeader] && regions[expireHeader] < Date.now())) {
    return fetchWithCache(
      regionsUrl.replace("{{lang-code}}", langToRightUpperCases(lang)),
      eightHours
    );
  }
  return regions;
};

// Utils

export const convertToGroupsOf5 = (number: number) => {
  const groupSize = 5;
  const start = (number - 1) * groupSize + 1;

  return Array.from({ length: groupSize }, (_, index) => start + index);
};

export const addOrReplaceQueryParam = (url:string, paramName:string, paramValue:string) => {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);

    // Add or replace the parameter
    searchParams.set(paramName, paramValue);

    // Update the URL with the modified parameters
    urlObj.search = searchParams.toString();

    return urlObj.toString();
  } catch (e) {
    // Invalid URL
    return url;
  }
};

export const removeQueryParam = (url:string, paramName:string) => {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);

    // Add or replace the parameter
    searchParams.delete(paramName);

    // Update the URL with the modified parameters
    urlObj.search = searchParams.toString();

    return urlObj.toString();
  } catch (e) {
    // Invalid URL
    return url;
  }
};

export function isNumber(value: any) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}
