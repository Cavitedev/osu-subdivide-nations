type TLanguagesData = {
    [key: string]: {
        message: string;
        description?: string;
    };
}
let secondaryLoadedLanguage: TLanguagesData | null | undefined = null;

export const getLocMsg = (key:string, substitutions: string | string[] | undefined) => {
    if(secondaryLoadedLanguage && secondaryLoadedLanguage[key]) {
        return secondaryLoadedLanguage[key].message;
    }else{
        return chrome.i18n.getMessage(key, substitutions);
    }
}

export const loadLanguage = async (lang:string) => {
    console.log("lng");
    const languageFile = chrome.runtime.getURL(`_locales/${lang}/messages.json`);

    secondaryLoadedLanguage = (await fetch(languageFile).then(res => res.json()).catch(e => {return null})) as TLanguagesData | undefined;
}

export const unloadLanguage = () => {
    secondaryLoadedLanguage = null;
}