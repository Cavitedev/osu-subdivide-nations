import { Tpreferences, loadPreferences, preferences, setPreference } from "@src/utils/preferences";
import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const preferencesContext = createContext({
    preferences: preferences,
    ["setPreference"]: (key: keyof Tpreferences, value: any) => {
        console.error("Wrong set preference");
    },
});

export function PreferencesContextProvider(props: any) {
    const [preferencesSolid, setPreferencesSolid] = createStore(preferences);
    setPreferencesSolid("scoreRanking", false);

    const innerSetPreference = (key: keyof Tpreferences, value: any) => {
        const lastPref = preferencesSolid[key];
        setPreferencesSolid(key, value);
        setPreference(key, value).catch((e) => {
            console.error(e);
            setPreferencesSolid(key, lastPref);
        });
    };

    loadPreferences().then((prefs) => {
        setPreferencesSolid(prefs);
    });

    return (
        <preferencesContext.Provider
            value={{
                preferences: preferencesSolid,
                ["setPreference"]: innerSetPreference,
            }}
        >
            {props.children}
        </preferencesContext.Provider>
    );
}

export function usePreferencesContext() {
    const value = useContext(preferencesContext);
    if (value === undefined) {
        throw new Error("useMyContext must be used within a MyContext.Provider");
    }
    return value;
}
