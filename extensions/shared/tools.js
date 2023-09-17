const expireHeader = "expire-date";

const genExpireDate = (expireTime) => Date.now() + expireTime;

let pendingRequests = {};

export const fetchWithCache = async (url, expireTime) => {
  if (pendingRequests[url]) {
    return pendingRequests[url];
  }

  const cachedItemRaw = localStorage.getItem(url);
  if (cachedItemRaw) {
    const cachedItem = JSON.parse(cachedItemRaw);
    const expireDate = cachedItem[expireHeader];
    if (expireDate < Date.now()) {
      return fetchAndSaveInCache();
    }
    cachedItem["cache"] = true;
    return cachedItem;
  } else {
    const fetchPromise = fetchAndSaveInCache();
    pendingRequests[url] = fetchPromise;
    const result = await fetchPromise;
    delete pendingRequests[url];
    return result;
  }

  function fetchAndSaveInCache() {
    return fetch(url)
      .then(async (res) => {
        const jsonResponse = await res.json();
        let cachedResponse = {};
        cachedResponse["data"] = jsonResponse;
        cachedResponse[expireHeader] = genExpireDate(expireTime);
        localStorage.setItem(url, JSON.stringify(cachedResponse));
        return cachedResponse;
      })
      .catch((error) => {
        console.log(error);
      });
  }
};

const userDataExpireTime = 1800000; //30 minutes

const fetchWithMinimumWaitTime = async (dataPromise, waitTime) => {
  const waitPromise = new Promise((resolve) => {
    setTimeout(resolve, waitTime);
  });

  return Promise.race([dataPromise, waitPromise])
    .then(async (result) => {
      const hasCache = result && result["cache"];

      if (hasCache) {
        return result;
      } else {
        await waitPromise;
        return await dataPromise;
      }
    })
    .then((result) => {
      return result["data"];
    });
};

export const osuWorldUser = async (id) => {
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
  countryCode,
  regionCode,
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
    .replace("{{page}}", page);

  return fetchWithCache(url, userDataExpireTime).then((result) => {
    return result["data"];
  });
  // return fetchWithMinimumWaitTime(dataPromise, 200);
};

const profileUrl = "https://osu.ppy.sh/users/{{user-id}/{{mode}}";
export const buildProfileUrl = (id, mode = "osu") => {
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

export const availableLanguagesOsuWorld = async () => {
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
  const alternativeCodes = {
    "PT-PT": "PT-BR",
    ES: "ES-ES",
    "EN-GB": "EN",
    SV: "SV-SE",
  };

  const altCode = alternativeCodes[currLang];
  if (altCode) {
    return getSupportedSystemLanguage(altCode);
  }

  console.log("No supported language found for lang code: " + currLang);

  return defaultLang;
};

export const getLanguage = async () => {
  let lang = await chrome.storage.sync.get([langKey]);
  if (Object.keys(lang).length === 0 && lang.constructor === Object) {
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

export const setLanguage = async (lang) => {
  const previousLang = await chrome.storage.sync.get([langKey]).catch(() => {
    console.log(e);
  });
  if (previousLang == lang) return;
  await chrome.storage.sync.set({ [langKey]: lang });

  chrome.tabs.query({}, function (tabs) {
    for (let i = 0; i < tabs.length; i++) {
      chrome.tabs.sendMessage(tabs[i].id, { action: "osu_flag_refresh" });
    }
  });
};

const eightHours = 28800000;

const langToRightUpperCases = (lang) => {
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

  const countries = localStorage.getItem(countriesKey);
  if (!countries || countries[expireHeader] < Date.now()) {
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

  const regions = localStorage.getItem(regionsKey);
  if (!regions || regions[expireHeader] < Date.now()) {
    return fetchWithCache(
      regionsUrl.replace("{{lang-code}}", langToRightUpperCases(lang)),
      eightHours
    );
  }
  return regions;
};

// Utils

export const convertToGroupsOf5 = (number) => {
  const groupSize = 5;
  const start = (number - 1) * groupSize + 1;

  return Array.from({ length: groupSize }, (_, index) => start + index);
};

export const addOrReplaceQueryParam = (url, paramName, paramValue) => {
  const urlObj = new URL(url);
  const searchParams = new URLSearchParams(urlObj.search);

  // Add or replace the parameter
  searchParams.set(paramName, paramValue);

  // Update the URL with the modified parameters
  urlObj.search = searchParams.toString();

  return urlObj.toString();
};
