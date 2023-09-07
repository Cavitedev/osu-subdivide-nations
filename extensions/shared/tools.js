const expireHeader = "expire-date";

const genExpireDate = (expireTime) => Date.now() + expireTime;

export const fetchWithCache = async (url, expireTime) => {
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
    return fetchAndSaveInCache();
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

const langKey = "lang";
const countriesKey = "countries";
const regionsKey = "regions";

const countryUrl =
  "https://osuworld.octo.moe/locales/{{lang-code}}/countries.json";
const regionsUrl =
  "https://osuworld.octo.moe/locales/{{lang-code}}/regions.json";

export const systemDefaultCode = "DEF";
export const nativeLanguageCode = "NAT";

export const getLanguage = async () => {
  let lang = await chrome.storage.sync.get([langKey]);
  if (Object.keys(lang).length === 0 && lang.constructor === Object) {
    lang = systemDefaultCode;
    setLanguage(lang);
  }
  return lang[langKey];
};

export const getActiveLanguage = async () => {
  const lang = await getLanguage();
  if (lang === systemDefaultCode) {
    //Test this
    return navigator.language.toUpperCase();
  }

  return lang;
};

export const setLanguage = async (lang) => {
  const previousLang = await chrome.storage.sync.get([langKey]);
  if (previousLang == lang) return;
  await chrome.storage.sync.set({ [langKey]: lang });

  if (lang === systemDefaultCode) {
  } else if (lang === nativeLanguageCode) {
    return;
  }

  // const countryPromise = getCountryNamesLocale();
  // const regionsPromise = getRegionNamesLocale();

  // await Promise.all([countryPromise, regionsPromise]).then(
  //   (countries, regions) => {
  //     //Refresh Page
  //   }
  // );
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
