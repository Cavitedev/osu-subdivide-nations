import { loadFromCache, loadMultipleUrlsFromCache, saveInCache } from "./cache";
import {
    IfetchResponse,
    noId,
    fetchWithCache,
    fetchWithMinimumWaitTime,
    IFetchError,
    fetchErrorToText,
    fetchWithoutCache,
    genExpireDate,
    expireHeader,
    unknownUserError,
    noData,
} from "./fetchUtils";

export interface IosuWorldIdSuccess {
    id: number;
    username: string;
    country_id: string;
    region_id: string;
}

export interface IosuWorldRegionalPlayerData {
    id: number;
    username: string;
    mode: string;
    rank: number;
    pp: number;
    status: any;
}

export interface IosuWorldRegionalRankingSuccess {
    pages: number;
    top: [IosuWorldRegionalPlayerData];
}

export type TosuWorldIdData = IosuWorldIdSuccess | IFetchError;
export type TosuWorldIdsData = IosuWorldIdSuccess[] | IFetchError;

const osuWorldApiBase = "https://osuworld.octo.moe/api/";

const userDataExpireTime = 1800000; //30 minutes

export const osuWorldUser = async (
    id: string,
    signal: AbortSignal | undefined,
): Promise<IfetchResponse<TosuWorldIdData>> => {
    if (!id) {
        console.log("id is null");
        return { error: { code: noId } };
    }

    const url = osuWorldApiBase + "users/" + id;

    const dataPromise = fetchWithCache(url, userDataExpireTime, { signal: signal }) as Promise<
        IfetchResponse<TosuWorldIdData>
    >;
    return fetchWithMinimumWaitTime<TosuWorldIdData>(dataPromise, 200);
};


export const osuWorldUsers = async (
    ids: string[],
    signal: AbortSignal | undefined,
): Promise<IfetchResponse<TosuWorldIdsData>> => {
    if (!ids || ids.length === 0) {
        console.log("id is null");
        return { error: { code: noId } };
    }

    // Max 50 ids per request
    const promises = [];
    for (let i = 0; i < ids.length; i += 50) {
        const slicedIds = ids.slice(i, i + 50);
        const url = osuWorldApiBase + "subdiv/users?ids=" + slicedIds.join(",");
        const promise = loadFromCache(url).then((cacheResponse) => {
            const expireTime = cacheResponse?.[expireHeader];
            if(!expireTime || expireTime < Date.now()){
                return (fetchWithoutCache(url, { signal: signal }) as Promise<
                IfetchResponse<TosuWorldIdsData>>);
            };
            return loadUserIdsFromCache(slicedIds, url);

        });
        promises.push(promise)

        saveInCache(url, {
            [expireHeader]: genExpireDate(userDataExpireTime),
        });
      }

      const response = await Promise.all(promises).then((responses) => {
        const data = responses.map((response) => {
            const responseData = response.data;
            if(!responseData) return [];
            if(isFetchError(responseData)) return [];
            return responseData;
        });
        return {
          data: data.flat(),
        };
      });

  
      const data = response.data;
      cacheMultipleUsersData(data, ids);


    return response;
};

const loadUserIdsFromCache = async (ids: string[], url: string): Promise<
IfetchResponse<TosuWorldIdsData>> => {
    const urls = [];
    for(const id of ids){
        const url = osuWorldApiBase + "users/" + id;
        urls.push(url);

    }
    const responses = await loadMultipleUrlsFromCache(urls) as IfetchResponse<TosuWorldIdData>[] | null;
    if(!responses){
        return {
            error: {
                code: noData,
                url: url
            } 
        }
    }

    const data = responses.filter(response => {
        const responseData = response.data;
        if(!responseData) return false;
        if((responseData as IFetchError).error !== undefined) return false;
        return true;
    }).map((response) => {
        return response.data as IosuWorldIdSuccess});

    return {
        data: data,
        cache: true
    }
};

const isFetchError = (data: TosuWorldIdsData | undefined): data is IFetchError => {
    return (data as IFetchError).error !== undefined;
  }

const cacheMultipleUsersData = async (data: TosuWorldIdsData | undefined, ids: string[]) => {
    if(!data) return;
    if(isFetchError(data)) return;
    
    for(const playerData of data){
        const url = osuWorldApiBase + "users/" + playerData.id;
        const cacheResponse = {
            data: playerData,
            [expireHeader]: genExpireDate(userDataExpireTime),
        }
        saveInCache(url, cacheResponse);
    }
    const dataIdsSet = new Set(data.map(playerData => playerData.id.toString()));


    for(const id of ids){
        if(dataIdsSet.has(id)) continue;
        const url = osuWorldApiBase + "users/" + id;
        saveInCache(url, {
            error: unknownUserError
        });
    }
}

// Modes: osu, taiko, fruits, mania
const regionRankingUrl =
osuWorldApiBase + "{{country-code}}/{{country-region-code}}/top/{{mode}}?page={{page}}";

const regionRankingExpire = 7200000; //2 hours

export const osuWorldCountryRegionRanking = async (
    countryCode: string,
    regionCode: string,
    mode = "osu",
    page = 1,
): Promise<IosuWorldRegionalRankingSuccess | IFetchError | null> => {
    if (!countryCode || !regionCode) {
        console.log("countryCode or regionCode is null");
        return null;
    }

    const url = regionRankingUrl
        .replace("{{country-code}}", countryCode)
        .replace("{{country-region-code}}", regionCode)
        .replace("{{mode}}", mode)
        .replace("{{page}}", page.toString());

    return fetchWithCache(url, regionRankingExpire).then((result) => {
        if (result.error) {
            console.log(fetchErrorToText(result));
            return null;
        }
        return result["data"] as IosuWorldRegionalRankingSuccess;
    });
};

const profileUrl = "https://osu.ppy.sh/users/{{user-id}}/{{mode}}";
export const buildProfileUrl = (id: string, mode = "osu") => {
    const url = profileUrl.replace("{{user-id}}", id).replace("{{mode}}", mode);
    return url;
};
