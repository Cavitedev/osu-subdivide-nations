import { getLocMsg, locMsgToHtml } from "@src/utils/languageChrome";
import { usePreferencesContext } from "../../../context/preferencesContext";
import SettingsLayout from "../SettingsLayout";

export default function OsuSettings() {
    const descriptionContent = locMsgToHtml(getLocMsg("score_ranking_desc"), [
        { type: "A", link: "https://github.com/respektive/osu-score-rank-api", match: "respektive_api" },
    ]);

    const preferencesContext = usePreferencesContext();

    return (
        <SettingsLayout websiteName="osu!" link="https://osu.ppy.sh/home">
            <div class=" block  rounded-lg border border-gray-200 bg-white p-6 shadow  dark:border-gray-700 dark:bg-gray-800 ">
                <div class=" flex">
                    <div class="flex-auto px-1">
                        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {getLocMsg("score_ranking")}
                        </h5>
                        <p class="font-normal text-gray-700 dark:text-gray-400">{descriptionContent}</p>
                    </div>
                    <div class="self-end">
                        <label class="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                value=""
                                checked={preferencesContext.preferences.scoreRanking}
                                onChange={(e) => {
                                    preferencesContext.setPreference("scoreRanking", e.currentTarget.checked);
                                }}
                                class="peer sr-only"
                            />
                            <div class="h-6 w-11 rounded-full bg-gray-400  after:absolute  after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </label>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}
