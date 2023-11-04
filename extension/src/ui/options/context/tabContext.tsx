import { addOrReplaceQueryParam } from "@src/utils/utils";
import { createContext, createSignal, useContext } from "solid-js";

const [constantValue] = createSignal("");
const tabContext = createContext({ tab: constantValue, setTab: (value: string) => {} });

export function TabContextProvider(props: any) {
    const urlParams = new URLSearchParams(window.location.search);

    // Get the value of the "tab" parameter
    const tabParam = urlParams.get("tab") ?? "";

    const [tab, setSignalTab] = createSignal(tabParam);

    const setTab = (newTab: string) => {
        setSignalTab(newTab);
        const url = window.location.href;
        const updatedUrl = addOrReplaceQueryParam(url, "tab", newTab);
        window.history.pushState({}, "", updatedUrl);
    };

    return <tabContext.Provider value={{ tab, setTab }}>{props.children}</tabContext.Provider>;
}

export function useTabContext() {
    const value = useContext(tabContext);
    if (value === undefined) {
        throw new Error("useMyContext must be used within a MyContext.Provider");
    }
    return value;
}
