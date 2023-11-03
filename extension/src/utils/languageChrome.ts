import browser from "webextension-polyfill";

type TLanguagesData = {
    [key: string]: {
        message: string;
        description?: string;
    };
};
let secondaryLanguagePromise: Promise<TLanguagesData> | null = null;
let secondaryLoadedLanguage: TLanguagesData | null | undefined = null;
let selectedLanguage: string | undefined = undefined;
export const waitLastLanguageIsLoaded = async () => {
    await secondaryLanguagePromise;
};

export const getLocMsg = (key: string, substitutions: string | string[] | undefined = undefined) => {
    if (secondaryLoadedLanguage?.[key]) {
        return secondaryLoadedLanguage[key].message;
    }
    if (substitutions) {
        for (const substitution of substitutions) {
            if (secondaryLoadedLanguage?.[substitution]) {
                return secondaryLoadedLanguage[substitution].message;
            }
        }
    }

    return browser.i18n.getMessage(key, substitutions);
};

type TLocHtml = {
    [key: string]: {
        type: string;
        link?: string;
        forcedString?: string;
    };
};

export const getLocHtml = (key: string, substitutions: string | string[] | undefined = undefined, htmlReplacements: TLocHtml) => {

    const originalMessage = getLocMsg(key, substitutions);


    const splitted = originalMessage.split("{{developer}}");
    const span1 = document.createElement("span");
    span1.innerText = splitted[0];

    const developerLink = document.createElement("a");
    developerLink.innerText = "Cavitedev";
    developerLink.href = "https://github.com/Cavitedev";
    developerLink.setAttribute("target", "_blank");

    const span2 = document.createElement("span");
    span2.innerText = splitted[1];

}

export const loadLanguage = async (lang: string) => {
    const splittedLang = lang.split("-");
    if (splittedLang.length > 1) {
        lang = splittedLang[0] + "_" + splittedLang[1].toUpperCase();
    }

    if (lang === selectedLanguage) return;

    const languageFile = browser.runtime.getURL(`_locales/${lang}/messages.json`);
    secondaryLanguagePromise = fetch(languageFile)
        .then((res) => res.json())
        .catch(() => {
            return null;
        });
    secondaryLoadedLanguage = await secondaryLanguagePromise;
    if (secondaryLoadedLanguage) {
        selectedLanguage = lang;
    } else {
        selectedLanguage = undefined;
    }
};

export const getActiveLanguageCode = () => {
    return selectedLanguage;
};

export const getActiveLanguageCodeForKey = (key: string) => {
    return secondaryLoadedLanguage?.[key] ? selectedLanguage : undefined;
};

export const unloadLanguage = () => {
    secondaryLoadedLanguage = null;
    selectedLanguage = undefined;
};
