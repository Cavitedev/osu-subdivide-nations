
export const expireHeader = "expireDate";

const genExpireDate = (expireTime:number) => Date.now() + expireTime;

let pendingRequests : {[key:string]: Promise<object>} = {};


export interface IosuWorldIdSuccess  {
    id: number,
    username: string,
    country_id: string,
    region_id: string,
  }
  
  export interface IosuWorldRegionalPlayerData{
    "id": number,
    "username": string,
    "mode": string,
    "rank": number,
    "pp": number,
    "status": any
  }
  
  export interface IosuWorldRegionalRankingSuccess{
    pages: number,
    top: [
      IosuWorldRegionalPlayerData
    ]
  }
  
  export interface IosuWorldError {
    error: string
  }
  
  export type osuWorldIdData =  IosuWorldIdSuccess | IosuWorldError 
  
  export interface IfetchResponse<T> {
    data?: T;
    error?: {
      code: string;
      url?: string;
      userId?: string;
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
        let cachedResponse: IfetchResponse<object> = {};
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
  const noId = "no_id";
  
  export const fetchErrorToText = (response: IfetchResponse<object>) => {
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
  
  const fetchWithMinimumWaitTime = async<T> (dataPromise: Promise<IfetchResponse<T>>, waitTime: number):Promise<IfetchResponse<T>> => {
    const waitPromise = new Promise((resolve) => {
      setTimeout(resolve, waitTime);
    }) as Promise<IfetchResponse<T>>;
  
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
        return result as IfetchResponse<T>;
      });
  };
  
  export const osuWorldUser = async (id: String): Promise<IfetchResponse<osuWorldIdData>> => {
    if (!id) {
      console.log("id is null");
      return { error: { code: noId, userId: id } };
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