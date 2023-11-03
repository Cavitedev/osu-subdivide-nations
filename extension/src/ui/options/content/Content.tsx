import Settings from "./pages/Settings";
import { Match, Switch, createSignal, For } from "solid-js";

const hashToPage = {
    "#settings": <Settings />,
};

export default function Content() {
    const [hash, setHash] = createSignal(location.hash);

    function updateHashValue() {
        setHash(location.hash);
    }
    updateHashValue();
    window.addEventListener("hashchange", updateHashValue);

    return (
        <div class="flex-auto">
            <Switch>
                <For each={Object.entries(hashToPage)}>
                    {([hashRoute, page]) => <Match when={hashRoute === hash()}>{page}</Match>}
                </For>
            </Switch>
        </div>
    );
}
