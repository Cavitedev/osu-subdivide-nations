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
        jsonResponse[expireHeader] = genExpireDate(expireTime);
        localStorage.setItem(url, JSON.stringify(jsonResponse));
        return jsonResponse;
      })
      .catch((error) => {
        console.log(error);
      });
  }
};

const setLanguage = async (lang) => {
  

};

