import { getLocMsg, locMsgToHtml } from "@src/utils/languageChrome";
import { JSX } from "solid-js/jsx-runtime";

export default function SettingsLayout(props: {
    websiteName: string;
    link: string;
    children?: number | boolean | Node | JSX.ArrayElement | (string & {}) | null | undefined;
}) {
    const title = locMsgToHtml(getLocMsg("website_settings"), [
        { type: "A", link: props.link, match: "Website", forcedString: props.websiteName },
    ]);

    return (
        <div class="mx-2">
            <h2 class="mb-2 ml-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
            {props.children}
        </div>
    );
}
