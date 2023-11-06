import { IfetchResponse, fetchErrorToText, fetchWithCache, noId } from "../fetchUtils";
import { isNumber } from "../utils";

interface IKudosuUser {
    _id: string;
    avatar_url: string;
    osuId: number;
    username: string;
    rank: number;
    kudosu: number;
    updatedAt: Date;
}
const kudosuRankingReload = 3600000; //60 minutes

export const osuKudosuRanking = async (userId: string | undefined): Promise<IKudosuUser | undefined> => {
    if (!userId) {
        const err = fetchErrorToText({ error: { code: noId } });
        console.error(err);
    }

    // example: `https://kudosu-api.vercel.app/api/user/318565`
    const url = `https://kudosu-api.vercel.app/api/user/${userId}`;

    const dataPromise = (fetchWithCache(url, kudosuRankingReload) as Promise<IfetchResponse<IKudosuUser>>).then((r) => {
        const errText = fetchErrorToText(r);
        if (errText) {
            console.error(errText);
        }

        if (!isNumber(r?.data?.rank)) {
            return undefined;
        }

        return r.data;
    });
    return dataPromise;
};
