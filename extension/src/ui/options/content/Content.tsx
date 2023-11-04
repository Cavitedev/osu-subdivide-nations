import { useHashContext } from "../context/hashContext";
import Settings from "./pages/Settings";
import { Match, Switch } from "solid-js";

export default function Content() {
    const { hash } = useHashContext();

    return (
        <div class="p-4 sm:ml-64 max-w-3xl">
            <Switch>
                <Match when={"" === hash()}>{<Settings />}</Match>
                <Match when={"#settings" === hash()}>{<Settings />}</Match>
            </Switch>
        </div>
    );
}
