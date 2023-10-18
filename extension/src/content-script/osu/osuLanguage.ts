import { Ilanguages } from "@src/utils/language";
import jsonNameToCode from "./nameToLanguage.json";
import { loadLanguage } from "@src/utils/languagesChrome";
import { updateRegionsDropdown } from "./pages/ranking";

const nameToCode = jsonNameToCode as Ilanguages;

export const updateLanguageToOsuLanguage = async () => {
    const buttonWithLanguage = document.querySelector('[data-click-menu-target="nav-mobile-locale"]');
    const language = buttonWithLanguage?.textContent?.trim();
    if (language) {
        const languageCode = nameToCode[language];
        if (languageCode) {
            await loadLanguage(languageCode);
            updateRegionsDropdown();
        }
    }
};
