import Settings from "./pages/Settings";
import { Match, Switch, createSignal } from "solid-js";

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
                <Match when={"" === hash()}>{<Settings />}</Match>
                <Match when={"#settings" === hash()}>{<Settings />}</Match>
            </Switch>
        </div>
    );
}
