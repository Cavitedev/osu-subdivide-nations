import { JSX } from "solid-js/jsx-runtime";
import PreferenceToggle from "../components/toggle/PreferenceToggle";

export function PreferenceCard(props: {
    title: number | boolean | Node | JSX.ArrayElement | (string & {}) | null | undefined;
    content: number | boolean | Node | JSX.ArrayElement | (string & {}) | null | undefined;
}) {
    return (
        <div class=" block m-1 rounded-lg border border-gray-200 bg-white p-6 shadow  dark:border-gray-700 dark:bg-gray-800 ">
            <div class=" flex">
                <div class="flex-auto px-1">
                    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{props.title}</h5>
                    <p class="font-normal text-gray-700 dark:text-gray-400">{props.content}</p>
                </div>
                <div class="self-end">
                    <PreferenceToggle preference="scoreRanking" />
                </div>
            </div>
        </div>
    );
}
