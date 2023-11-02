import { loadMultipleUrlsFromCache, saveInCache } from "./cache";
import {
    IfetchResponse,
    noId,
    fetchWithCache,
    IFetchError,
    fetchErrorToText,
    fetchWithoutCache,
    genExpireDate,
    expireHeader,
    unknownUserError,
} from "./fetchUtils";

export type TosuWorldIdSuccess = {
    id: number;
    username: string;
    country_id: string;
    region_id: string;
    placement?: number;
};

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

export type TosuWorldIdData = TosuWorldIdSuccess | IFetchError;
export type TosuWorldIdsData = TosuWorldIdSuccess[] | IFetchError;

const osuWorldApiBase = "https://osuworld.octo.moe/api/";

const userDataExpireTime = 3600000; //60 minutes

export const osuWorldUser = async (id: string, mode?: string): Promise<IfetchResponse<TosuWorldIdData>> => {
    if (!id) {
        console.log("id is null");
        return { error: { code: noId } };
    }

    const url = osuWorldApiBase + "users/" + id + (mode ? "?mode=" + mode : "");

    // I'm not cancelling the request midway because it may be repeated
    const dataPromise = fetchWithCache(url, userDataExpireTime) as Promise<IfetchResponse<TosuWorldIdData>>;

    return dataPromise;
};

export const osuWorldUsers = async (
    ids: string[],
    signal?: AbortSignal | undefined,
): Promise<IfetchResponse<TosuWorldIdsData>> => {
    if (!ids || ids.length === 0) {
        console.log("id is null");
        return { error: { code: noId } };
    }

    const cachedRequests = await loadUserIdsFromCache(ids);

    const cachedIds = new Set(cachedRequests.map((entry) => entry.id));
    const fetchIds = [...new Set(ids.filter((id) => !cachedIds.has(id)))];

    // Max 50 ids per request
    const promises = [];

    for (let i = 0; i < fetchIds.length; i += 50) {
        const slicedIds = fetchIds.slice(i, i + 50);
        const url = osuWorldApiBase + "subdiv/users?ids=" + slicedIds.join(",");
        const promise = fetchWithoutCache(url, { signal: signal }) as Promise<IfetchResponse<TosuWorldIdsData>>;
        promises.push(promise);
    }

    const response = await Promise.all(promises).then((responses) => {
        const data = responses.map((response) => {
            const responseData = response.data;
            if (!responseData) return [];
            if (isFetchError(responseData)) return [];
            return responseData;
        });
        return {
            data: data.flat(),
        };
    });

    const data = response.data;
    cacheMultipleUsersData(data, fetchIds);

    if (signal?.aborted) return {};

    const successCache = cacheResponsesFilter(cachedRequests.map((d) => d.data));
    response.data = [...successCache.data, ...response.data];

    return response;
};

type TIdResponse = {
    id: string;
    data: IfetchResponse<TosuWorldIdData>;
};

const loadUserIdsFromCache = async (ids: string[]): Promise<TIdResponse[]> => {
    const urls = [];
    for (const id of ids) {
        const url = osuWorldApiBase + "users/" + id;
        urls.push(url);
    }
    const responses = await loadMultipleUrlsFromCache<IfetchResponse<TosuWorldIdData>>(urls);
    if (!responses) {
        return [];
    }

    const groupedResponse = Object.entries(responses)
        .filter((entry) => {
            const response = entry[1];
            return response.expireDate! > Date.now();
        })
        .map((entry) => ({
            id: idFromIdUrl(entry[0])!,
            data: entry[1],
        }));

    return groupedResponse;
};

const idFromIdUrl = (url: string) => {
    const baseUrl = osuWorldApiBase + "users/";
    const id = new RegExp(baseUrl + "(\\d+)").exec(url)?.[1];
    return id;
};

const cacheResponsesFilter = (responses: IfetchResponse<TosuWorldIdData>[]) => {
    const data = responses
        .filter((response) => {
            const responseData = response.data;
            if (!responseData) return false;
            if ((responseData as IFetchError).error !== undefined) return false;
            return true;
        })
        .map((response) => {
            return response.data as TosuWorldIdSuccess;
        });

    return {
        data: data,
        cache: true,
    };
};

const isFetchError = (data: TosuWorldIdsData | undefined): data is IFetchError => {
    return (data as IFetchError).error !== undefined;
};

const cacheMultipleUsersData = async (data: TosuWorldIdsData | undefined, ids: string[]) => {
    if (!data) return;
    if (isFetchError(data)) return;

    for (const playerData of data) {
        const url = osuWorldApiBase + "users/" + playerData.id;
        const cacheResponse = {
            data: playerData,
            [expireHeader]: genExpireDate(userDataExpireTime),
        };
        saveInCache(url, cacheResponse);
    }
    const dataIdsSet = new Set(data.map((playerData) => playerData.id.toString()));

    for (const id of ids) {
        if (dataIdsSet.has(id)) continue;
        const url = osuWorldApiBase + "users/" + id;
        saveInCache(url, {
            data: {
                error: unknownUserError,
            },
            [expireHeader]: genExpireDate(userDataExpireTime),
        });
    }
};

// Modes: osu, taiko, fruits, mania
const regionRankingUrl = osuWorldApiBase + "{{country-code}}/{{country-region-code}}/top/{{mode}}?page={{page}}";

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
