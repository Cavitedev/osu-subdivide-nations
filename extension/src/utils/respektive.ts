import { IfetchResponse, fetchErrorToText, fetchWithCache, noId, noMode } from "./fetchUtils";
import { isNumber, isValidDate } from "./utils";

type TRespektiveScore = [
    {
        rank: number;
        user_id: number;
        username: string;
        score: number;
        rank_highest: {
            rank: number;
            updated_at: string;
        };
    },
];

const respektiveDbReload = 1800000; //30 minutes

export const osuScoreRanking = async (
    userId: string | undefined,
    mode: string | undefined,
    signal: AbortSignal | undefined,
): Promise<TRespektiveScore | undefined> => {
    if (!userId) {
        const err = fetchErrorToText({ error: { code: noId } });
        console.error(err);
    }
    if (!mode) {
        const err = fetchErrorToText({ error: { code: noMode, mode: mode } });
        console.error(err);
    }

    // example: `https://score.respektive.pw/u/4871211?mode=fruits`
    const url = `https://score.respektive.pw/u/${userId}?mode=${mode}`;

    const dataPromise = (
        fetchWithCache(url, respektiveDbReload, { signal: signal }) as Promise<IfetchResponse<TRespektiveScore>>
    ).then((r) => {
        // Validate to prevent XHR injection
        if (!isNumber(r.data?.[0]?.rank) || !isValidDate(r.data?.[0]?.rank_highest?.updated_at)) {
            return undefined;
        }
        return r.data;
    });
    return dataPromise;
};
