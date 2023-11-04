import { Match, Switch } from "solid-js";
import Sidebar from "../../components/sidebar/Sidebar";
import { useTabContext } from "../../context/tabContext";
import OsuSettings from "./subpages/OsuSettings";
import WybinSettings from "./subpages/WybinSettings";

export default function Settings() {
    const { tab } = useTabContext();

    return (
        <>
            <Sidebar />
            <Switch>
                <Match when={tab() === "" || tab() === "osu"}>{<OsuSettings />}</Match>
                <Match when={tab() === "wybin"}>{<WybinSettings />}</Match>
            </Switch>
        </>
    );
}
