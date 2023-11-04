import { getLocMsg, locMsgToHtml } from "@src/utils/languageChrome";
import browser from "webextension-polyfill";
import { usePreferencesContext } from "../../context/preferencesContext";
import { createEffect } from "solid-js";

export default function Settings() {
    const descriptionContent = locMsgToHtml(getLocMsg("score_ranking_desc"), [
        { type: "A", link: "https://github.com/respektive/osu-score-rank-api", match: "respektive_api" },
    ]);

    const preferencesContext = usePreferencesContext();

    createEffect(() => {
        console.log("preferencesContext", preferencesContext);
    });

    return (
        <div class="mx-2">
            <h2 class="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Global Settings</h2>

            <div class=" block  rounded-lg border border-gray-200 bg-white p-6 shadow  dark:border-gray-700 dark:bg-gray-800 ">
                <div class=" flex">
                    <div class="flex-auto px-1">
                        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {browser.i18n.getMessage("score_ranking")}
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
        </div>
    );
}
