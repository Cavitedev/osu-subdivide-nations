import { createContext, createSignal, useContext } from "solid-js";

const [constantValue] = createSignal("");
const hashContext = createContext({
    hash: constantValue,
    setHash: (value: string) => {},
    hasSidebar: (): boolean => {
        return false;
    },
});

export function HashContextProvider(props: any) {
    const [hash, setHash] = createSignal("");

    const innerSetHash = (value: string) => {
        setHash(value);
        window.location.hash = value;
    };

    const hasSidebar = () => {
        return hash() === "#settings" || hash() === "";
    };

    window.addEventListener("hashchange", () => innerSetHash(location.hash));

    return (
        <hashContext.Provider value={{ hash: hash, setHash: innerSetHash, hasSidebar: hasSidebar }}>
            {props.children}
        </hashContext.Provider>
    );
}

export function useHashContext() {
    const value = useContext(hashContext);
    if (value === undefined) {
        throw new Error("useMyContext must be used within a MyContext.Provider");
    }
    return value;
}
