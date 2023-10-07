import { IfetchResponse, fetchErrorToText, fetchWithCache, noId, noMode } from "./fetchUtils";

  
type TRespektiveScore = [{
    rank: number;
    user_id: number;
    username: string;
    score: number;
    rank_highest: {
      rank: number;
      updated_at: string;
    }
  }
  ];

const respektiveDbReload = 1800000; //30 minutes

export const osuScoreRanking = async (userId: string | undefined, mode:string | undefined): Promise<TRespektiveScore | undefined> => {
    if (!userId) {
      const err = fetchErrorToText({error: { code: noId, userId: userId } });
      console.error(err);
    }
    if (!mode) {
        const err = fetchErrorToText({error: { code: noMode, mode: mode } });
        console.error(err);
      }

  
    const url = `https://score.respektive.pw/u/${userId}?mode=${mode}`;
  
    let dataPromise = (fetchWithCache(url, respektiveDbReload) as Promise<IfetchResponse<TRespektiveScore>>).then(r => r.data);
    return dataPromise;
}
