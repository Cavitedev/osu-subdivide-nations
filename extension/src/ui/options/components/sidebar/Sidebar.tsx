import { getLocMsg } from "@src/utils/languageChrome";

import SidebarListItem from "./SidebarListItem";

export default function Sidebar() {
    return (
        <>
            <aside
                id="default-sidebar"
                class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
                aria-label="Sidebar"
            >
                <div class="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-slate-800">
                    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {getLocMsg("setting")}
                    </h5>
                    <ul class="space-y-2 font-medium">
                        <SidebarListItem tab="osu" label="osu!" />
                        <SidebarListItem tab="wybin" label={"wyBin"} />
                    </ul>
                </div>
            </aside>
        </>
    );
}
