import { IfetchResponse, noId, fetchWithCache, fetchWithMinimumWaitTime, IFetchError, fetchErrorToText } from "./fetchUtils";

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
  

  
  export type osuWorldIdData =  IosuWorldIdSuccess | IFetchError 

  
const userDataExpireTime = 43200000; //12 hours

export const osuWorldUser = async (id: String, signal: AbortSignal | undefined): Promise<IfetchResponse<osuWorldIdData>> => {
    if (!id) {
      console.log("id is null");
      return { error: { code: noId, userId: id } };
    }
  
    const url = "https://osuworld.octo.moe/api/users/" + id;
  
    let dataPromise = fetchWithCache(url,  userDataExpireTime,  { signal:signal}) as Promise<IfetchResponse<osuWorldIdData>>;
    return fetchWithMinimumWaitTime<osuWorldIdData>(dataPromise, 200);
  };


// Modes: osu, taiko, fruits, mania
const regionRankingUrl =
"https://osuworld.octo.moe/api/{{country-code}}/{{country-region-code}}/top/{{mode}}?page={{page}}";

const regionRankingExpire = 7200000; //2 hours

export const osuWorldCountryRegionRanking = async (
countryCode: string,
regionCode: string,
mode = "osu",
page = 1
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

return fetchWithCache(url,  regionRankingExpire).then((result) => {
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





