import browser from "webextension-polyfill";

export const getManifestTitle = () => {
    return browser.runtime.getManifest().name;
};
