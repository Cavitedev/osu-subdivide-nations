import browser from "webextension-polyfill";
export type Tpreferences = {
    lang: string;
    darkMode: boolean;
    scoreRanking: boolean;
};

export let preferences: Tpreferences = {
    lang: "en",
    darkMode: true,
    scoreRanking: true,
};
// const preferencesPromise: Promise<Tpreferences> = browser.storage.sync.get() as Promise<Tpreferences>;
// preferencesPromise.then((prefs) => {
//     preferences = prefs;
// });

export const loadPreferences = async () => {
    preferences = (await browser.storage.sync.get()) as Tpreferences;
    return preferences;
};

export const getPreference = (key: keyof Tpreferences) => {
    return preferences[key] as Tpreferences[keyof Tpreferences];
};

export const setPreference = async <K extends keyof Tpreferences>(key: K, val: Tpreferences[K]) => {
    preferences[key] = val;
    return browser.storage.sync.set({ [key]: val });
};
