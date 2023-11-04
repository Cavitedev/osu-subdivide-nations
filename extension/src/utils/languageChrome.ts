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
    type: string;
    match: string;
    link?: string;
    forcedString?: string;
};

export const locMsgToHtml = (msg: string, htmlReplacements?: TLocHtml[] | undefined): HTMLElement[] => {
    if (!msg) return [];
    const firstReplacement = htmlReplacements?.pop();

    if (!firstReplacement) {
        const spanEl = document.createElement("span");
        spanEl.textContent = msg;
        return [spanEl];
    }

    const splittedArray = msg.split(`{{${firstReplacement.match}}}`);
    const middleFillEl = splittedSubstitute(firstReplacement);

    const returnElements: HTMLElement[] = [];
    for (let i = 0; i < splittedArray.length; i++) {
        const recursiveElements = locMsgToHtml(splittedArray[i], htmlReplacements);
        returnElements.push(...recursiveElements);
        if (i < splittedArray.length - 1) {
            returnElements.push(middleFillEl.cloneNode(true) as HTMLElement);
        }
    }

    return returnElements;
};

const splittedSubstitute = (replacement: TLocHtml) => {
    if (replacement.type === "A") {
        const anchor = document.createElement("a");
        if (replacement.link) {
            anchor.href = replacement.link;
            anchor.setAttribute("target", "_blank");
        }
        if (replacement.forcedString) {
            anchor.textContent = replacement.forcedString;
        } else {
            const substituteStr = getLocMsg(replacement.match);
            anchor.textContent = substituteStr;
        }
        return anchor;
    }

    return document.createElement("span");
};

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
