type TLanguagesData = {
    [key: string]: {
        message: string;
        description?: string;
    };
}
let secondaryLanguagePromise: Promise<TLanguagesData> | null = null;
let secondaryLoadedLanguage: TLanguagesData | null | undefined = null;
let selectedLanguage: string|undefined = undefined;
export const waitLastLanguageIsLoaded = async () => {
    await secondaryLanguagePromise;
}

export const getLocMsg = (key:string, substitutions: string | string[] | undefined = undefined) => {
    if(secondaryLoadedLanguage?.[key]) {
        return secondaryLoadedLanguage[key].message;
    }else{
        return chrome.i18n.getMessage(key, substitutions);
    }
}

export const loadLanguage = async (lang:string) => {
    console.log("lng");
    const languageFile = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    secondaryLanguagePromise = fetch(languageFile).then(res => res.json()).catch(e => {return null})
    secondaryLoadedLanguage = await secondaryLanguagePromise;
    if(secondaryLoadedLanguage){
        selectedLanguage = lang;
    }else{
        selectedLanguage = undefined;
    }
}

export const getActiveLanguageCode = () => {
    return selectedLanguage;
}

export const getActiveLanguageCodeForKey = (key:string) => {
    return secondaryLoadedLanguage?.[key] ? selectedLanguage : undefined;
}


export const unloadLanguage = () => {
    secondaryLoadedLanguage = null;
    selectedLanguage = undefined;
}