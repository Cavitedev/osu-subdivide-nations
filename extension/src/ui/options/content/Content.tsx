import { useHashContext } from "../context/hashContext";
import { TabContextProvider } from "../context/tabContext";
import Settings from "./pages/Settings";
import { Match, Switch } from "solid-js";

export default function Content() {
    const { hash } = useHashContext();

    return (
        <TabContextProvider>
            <div class="p-4 sm:ml-64 max-w-3xl">
                <Switch>
                    <Match when={["#settings", ""].includes(hash())}>{<Settings />}</Match>
                </Switch>
            </div>
        </TabContextProvider>
    );
}
