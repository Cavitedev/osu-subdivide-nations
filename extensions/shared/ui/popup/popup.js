import { fetchWithCache } from "../../tools.js";

const updateTitle = () => {
  const title = chrome.runtime.getManifest().name;
  const version = " v" + chrome.runtime.getManifest().version;

  document.querySelector("#header .title").innerHTML = title;
  document.querySelector("#header .version").innerHTML = version;
};

const addSupportedLanguages = async () => {
  const selectElement = document.querySelector("#region-languages-select");
  selectElement.addEventListener("change", onLanguageUpdate);

  const optionTemplate = `<option value="$value">$name</option>`;
  let selectsHtml = "";
  selectsHtml += optionTemplate
    .replace("$value", "def")
    .replace("$name", "System Default");
  selectsHtml += optionTemplate
    .replace("$value", "nat")
    .replace("$name", "Native Language");

  const osuWorldLanguages = await availableLanguagesOsuWorld();
  for (const [key, value] of Object.entries(osuWorldLanguages)) {
    selectsHtml += optionTemplate
      .replace("$value", key)
      .replace("$name", value);
  }
  selectElement.innerHTML = selectsHtml;

  const currentValue = localStorage.getItem("reg-lang");
  if (currentValue) {
    selectElement.value = currentValue;
  }
};

const availableLanguagesOsuWorld = async () => {
  // 1 day cache
  return fetchWithCache(
    "https://osuworld.octo.moe/locales/languages.json",
    86400000
  );
};



const onLanguageUpdate = (event) => {
  const value = event.target.value;
  localStorage.setItem("reg-lang", value);
};

const init = () => {
  updateTitle();
  addSupportedLanguages();
};

init();
