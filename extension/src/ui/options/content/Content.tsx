import Settings from "./pages/Settings";
import { Match, Switch, createSignal } from "solid-js";

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
        <div>
            <Switch>
                {Object.entries(hashToPage).map(([hashRoute, page]) => (
                    <Match when={hashRoute === hash()}>{page}</Match>
                ))}
            </Switch>
        </div>
    );
}
