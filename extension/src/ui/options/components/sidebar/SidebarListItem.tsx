import { JSX } from "solid-js/jsx-runtime";
import { useTabContext } from "../../context/tabContext";

export default function SidebarListItem(props: {
    tab: string;
    label: number | boolean | Node | JSX.ArrayElement | (string & {}) | null | undefined;
}) {
    const { tab, setTab } = useTabContext();

    const active = () => {
        return tab() === `${props.tab}` || (tab() === "" && props.tab === "osu");
    };

    return (
        <li>
            <a
                href={`#`}
                onClick={(e) => {
                    e.preventDefault();
                    setTab(props.tab);
                }}
                class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                classList={{ "bg-gray-200 dark:bg-gray-600": active() }}
            >
                <span class="ml-3">{props.label}</span>
            </a>
        </li>
    );
}
