import { getLocMsg } from "@src/utils/languageChrome";
import NavbarListItem from "./NavbarListItem";
import { useHashContext } from "../../context/hashContext";
import ThemeToggle from "./ThemeToggle";
import { getManifestTitle } from "@src/utils/manifestUtils";

export default function Navbar() {
    const { hasSidebar } = useHashContext();

    return (
        <nav class=" bg-white border-gray-200 dark:bg-gray-900 " classList={{ "sm:ml-64": hasSidebar() }}>
            <div class="max-w-screen-xl flex items-center justify-between mx-auto px-4 py-2">
                <button
                    data-drawer-target="default-sidebar"
                    data-drawer-toggle="default-sidebar"
                    aria-controls="default-sidebar"
                    type="button"
                    class="inline-flex items-center p-2 mr-2 mt-2 ml-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                >
                    <span class="sr-only">{getLocMsg("open_sidebar")}</span>
                    <svg
                        class="w-6 h-6"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            clip-rule="evenodd"
                            fill-rule="evenodd"
                            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                        ></path>
                    </svg>
                </button>

                <a href="https://osu.ppy.sh/community/forums/topics/1837728" class="contents items-center">
                    <img src="../../../icons/128.png" class="h-8 mr-3" alt="osu! subdive nations logo" />
                    <span class="truncate self-center text-2xl font-semibold whitespace-nowrap dark:text-white underline">
                        {getManifestTitle()}
                    </span>
                </a>
                <div class="flex-auto"></div>
                <ThemeToggle />
                <button
                    data-collapse-toggle="navbar-default"
                    type="button"
                    class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    aria-controls="navbar-default"
                    aria-expanded="false"
                >
                    <span class="sr-only">Open main menu</span>
                    <svg
                        class="w-5 h-5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 17 14"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M1 1h15M1 7h15M1 13h15"
                        />
                    </svg>
                </button>

                <div class="hidden w-full md:block md:w-auto" id="navbar-default">
                    <ul class="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                        <NavbarListItem hash="settings" text={getLocMsg("settings")} />
                        <NavbarListItem hash="about" text={getLocMsg("about")} />
                    </ul>
                </div>
            </div>
        </nav>
    );
}
