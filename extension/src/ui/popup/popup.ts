import { cleanCache, cleanInvalidatedCache } from "@src/utils/cache";
import { lastAvailableLanguages } from "./../../utils/language";
import {
  systemDefaultCode,
  nativeLanguageCode,
  getLanguage,
  setLanguage,
  availableLanguagesOsuWorld,
  Ilanguages,
} from "@src/utils/language";

const updateTitle = () => {

  const createdBy = chrome.i18n.getMessage("created_by");
  const splitted = createdBy.split("{{developer}}");
  
  const span1 = document.createElement("span");
  span1.innerText = splitted[0];

  const developerLink = document.createElement("a");
  developerLink.innerText = "Cavitedev";
  developerLink.href = "https://github.com/Cavitedev"
  developerLink.setAttribute("target", "_blank");

  const span2 = document.createElement("span");
  span2.innerText = splitted[1];

  const copyrightElement = document.querySelector(".copyright");
  copyrightElement?.appendChild(span1);
  copyrightElement?.appendChild(developerLink);
  copyrightElement?.appendChild(span2);

  const title = chrome.runtime.getManifest().name;
  const version = " v" + chrome.runtime.getManifest().version;

  (document.querySelector("#header .title") as HTMLElement).innerText = title;
  (document.querySelector("#header .version") as HTMLElement).innerText = version;
};

const addSupportedLanguages = async () => {
  const languagesLabel = document.querySelector(
    "#language-option-label"
  ) as HTMLDivElement;
  languagesLabel.innerText = chrome.i18n.getMessage("region_language");

  const selectElement = document.querySelector(
    "#region-languages-select"
  ) as HTMLSelectElement;
  selectElement.addEventListener("change", onLanguageUpdate);

  getLanguage().then((lang) => {
    selectElement.value = lang;
  });

  let cachedLanguages = await lastAvailableLanguages();
  if (cachedLanguages) {
    fillSelectLanguages(cachedLanguages.data!, selectElement);
    if (!cachedLanguages.expired) {
      return;
    }
  }

  const osuWorldLanguages = await availableLanguagesOsuWorld();
  fillSelectLanguages(osuWorldLanguages, selectElement);
};

const fillSelectLanguages = (osuWorldLanguages: Ilanguages,  selectElement: HTMLSelectElement) => {
  const optionTemplate = document.createElement("option") as HTMLOptionElement;

  // Create and set the system default option
  const systemDefaultOption = optionTemplate.cloneNode(true) as HTMLOptionElement;
  systemDefaultOption.value = systemDefaultCode;
  systemDefaultOption.textContent = chrome.i18n.getMessage("system_default");

  // Create and set the native language option
  const nativeLanguageOption = optionTemplate.cloneNode(true) as HTMLOptionElement;
  nativeLanguageOption.value = nativeLanguageCode;
  nativeLanguageOption.textContent = chrome.i18n.getMessage("native_language");

  // Append the system default and native language options to the select element
  selectElement.appendChild(systemDefaultOption);
  selectElement.appendChild(nativeLanguageOption);

  // Loop through osuWorldLanguages and create and append options
  for (const [key, value] of Object.entries(osuWorldLanguages)) {
    const option = optionTemplate.cloneNode(true) as HTMLOptionElement;
    option.value = key;
    option.textContent = value;
    selectElement.appendChild(option);
  }
};

const onLanguageUpdate = async (event: Event) => {
  const value = (event!.target as HTMLSelectElement).value;
  await setLanguage(value);
};

const addCacheButtonBehavior = () => {
  const button = document.querySelector("#cache-button") as HTMLButtonElement;
  button.querySelector("span")!.textContent =
    chrome.i18n.getMessage("clean_cache");

  const cacheMessage = document.querySelector(
    "#cache-message"
  ) as HTMLDivElement;
  cacheMessage.textContent = chrome.i18n.getMessage("cache_cleaned");

  button.addEventListener("click", async (e) => {
    await cleanCache();
    if (!cacheMessage.classList.contains("hidden")) {
      return;
    }

    cacheMessage.style.display = "block";
    cacheMessage.classList.add("animated-text");
    setTimeout(() => {
      cacheMessage.style.display = "none";
    }, 4950);
  });
};

const init = () => {
  updateTitle();
  addSupportedLanguages();
  addCacheButtonBehavior();
  cleanInvalidatedCache();
};

init();
