import { saveInCache } from "./cache";
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

    const url = osuWorldApiBase + "subdiv/users?ids=" + ids.join(",");

    const response = await (fetchWithoutCache(url, { signal: signal }) as Promise<
        IfetchResponse<TosuWorldIdsData>
    >);

    const data = response.data;
    cacheMultipleUsersData(data, ids);

    return response;
};

const isFetchError = (data: TosuWorldIdsData): data is IFetchError => {
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
