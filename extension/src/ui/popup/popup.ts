import { cleanCache, cleanInvalidatedCache } from '@src/utils/cache';
import { lastAvailableLanguages } from './../../utils/language';
import { systemDefaultCode, nativeLanguageCode, getLanguage, setLanguage, availableLanguagesOsuWorld, Ilanguages } from "@src/utils/language";



const updateTitle = () => {
  const title = chrome.runtime.getManifest().name;
  const version = " v" + chrome.runtime.getManifest().version;

  document.querySelector("#header .title")!.innerHTML = title;
  document.querySelector("#header .version")!.innerHTML = version;
};

const addSupportedLanguages = async () => {
  const languagesLabel = document.querySelector("#language-option-label") as HTMLDivElement;
  languagesLabel.innerText = chrome.i18n.getMessage("regions_language");

  const selectElement = document.querySelector("#region-languages-select") as HTMLSelectElement;
  selectElement.addEventListener("change", onLanguageUpdate);

  getLanguage().then(lang => {
    selectElement.value = lang;
  })

  let cachedLanguages = await lastAvailableLanguages();
  if(cachedLanguages) {
      fillSelectLanguages(cachedLanguages.data!, selectElement);
      if(!cachedLanguages.expired) {
        return;
      }
  } 

  const osuWorldLanguages = await availableLanguagesOsuWorld();
  fillSelectLanguages(osuWorldLanguages, selectElement);
};


const fillSelectLanguages = (osuWorldLanguages: Ilanguages,  selectElement: HTMLSelectElement) => {
  const optionTemplate = `<option value="$value">$name</option>`;
  let selectsHtml = "";
  selectsHtml += optionTemplate
    .replace("$value", systemDefaultCode)
    .replace("$name", "System Default");
  selectsHtml += optionTemplate
    .replace("$value", nativeLanguageCode)
    .replace("$name", "Native Language");


  for (const [key, value] of Object.entries(osuWorldLanguages)) {
    selectsHtml += optionTemplate
      .replace("$value", key)
      .replace("$name", value);
  }
  selectElement.innerHTML = selectsHtml;
  return selectsHtml;
}


const onLanguageUpdate = async (event: Event) => {
  const value = (event!.target as HTMLSelectElement).value;
  await setLanguage(value);
};

const addCacheButtonBehavior = () => {
  const button = document.querySelector("#cache-button") as HTMLButtonElement;
  button.querySelector("span")!.textContent = chrome.i18n.getMessage("clean_cache");

  const cacheMessage = document.querySelector("#cache-message") as HTMLDivElement;
  cacheMessage.textContent = chrome.i18n.getMessage("cache_cleaned");

  button.addEventListener("click", async (e) => {
    await cleanCache();
    if(!cacheMessage.classList.contains("hidden")) {return;}

    cacheMessage.style.display = "block";
    cacheMessage.classList.add("animated-text");
    setTimeout(() => {
      cacheMessage.style.display = "none";
    }, 4950);
  });
}

const init = () => {
  console.log("pop up init");
  updateTitle();
  addSupportedLanguages();
  addCacheButtonBehavior();
  cleanInvalidatedCache();
};

init();

