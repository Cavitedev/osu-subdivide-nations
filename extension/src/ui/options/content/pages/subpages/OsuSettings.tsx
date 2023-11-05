import { getLocMsg, locMsgToHtml } from "@src/utils/languageChrome";
import SettingsLayout from "../SettingsLayout";
import { PreferenceCard } from "../../PreferenceCard";

export default function OsuSettings() {
    const scoreRankingDescription = locMsgToHtml(getLocMsg("score_ranking_desc"), [
        { type: "A", link: "https://github.com/respektive/osu-score-rank-api", match: "respektive_api" },
    ]);

    const kudosuRankingDescription = locMsgToHtml(getLocMsg("kudosu_ranking_desc"), [
        { type: "A", link: "https://github.com/Hiviexd/kudosu-api", match: "hiviexd_api" },
    ]);

    return (
        <SettingsLayout websiteName="osu!" link="https://osu.ppy.sh/home">
            <PreferenceCard title={getLocMsg("score_ranking")} content={scoreRankingDescription} />
            <PreferenceCard title={getLocMsg("kudosu_ranking")} content={kudosuRankingDescription} />
        </SettingsLayout>
    );
}
