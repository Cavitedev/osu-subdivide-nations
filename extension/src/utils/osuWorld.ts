import {
    IfetchResponse,
    noId,
    fetchWithCache,
    fetchWithMinimumWaitTime,
    IFetchError,
    fetchErrorToText,
    fetchWithoutCache,
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

export type IosuWorldIdData = IosuWorldIdSuccess | IFetchError;
export type IosuWorldIdsData = IosuWorldIdSuccess[] | IFetchError;

const osuWorldApiBase = "https://osuworld.octo.moe/api/";

const userDataExpireTime = 43200000; //12 hours

export const osuWorldUser = async (
    id: string,
    signal: AbortSignal | undefined,
): Promise<IfetchResponse<IosuWorldIdData>> => {
    if (!id) {
        console.log("id is null");
        return { error: { code: noId } };
    }

    const url = osuWorldApiBase + "users/" + id;

    const dataPromise = fetchWithCache(url, userDataExpireTime, { signal: signal }) as Promise<
        IfetchResponse<IosuWorldIdData>
    >;
    return fetchWithMinimumWaitTime<IosuWorldIdData>(dataPromise, 200);
};


export const osuWorldUsers = async (
    ids: string[],
    signal: AbortSignal | undefined,
): Promise<IfetchResponse<IosuWorldIdsData>> => {
    if (!ids || ids.length === 0) {
        console.log("id is null");
        return { error: { code: noId } };
    }

    const url = osuWorldApiBase + "subdiv/users?ids=" + ids.join(",");

    const dataPromise = fetchWithoutCache(url, { signal: signal }) as Promise<
        IfetchResponse<IosuWorldIdsData>
    >;

    return dataPromise;
};

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
