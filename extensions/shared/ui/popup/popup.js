osuWorldLanguages = {
  BE: "Беларуская",
  CA: "català",
  DE: "Deutsch",
  EL: "Ελληνικά",
  EN: "English",
  "ES-ES": "español",
  FI: "Suomi",
  FR: "français",
  ID: "Bahasa Indonesia",
  IT: "Italiano",
  JA: "日本語",
  KO: "한국어",
  MS: "Melayu",
  NL: "Nederlands",
  PL: "polski",
  "PT-BR": "Português (Brazil)",
  RU: "Русский",
  SR: "српски",
  "SV-SE": "Svenska",
  TR: "Türkçe",
  UK: "Українська",
  VI: "Tiếng Việt",
  "ZH-CN": "简体中文",
  "ZH-TW": "繁體中文（台灣）",
};

const updateTitle = () => {
  title = chrome.runtime.getManifest().name;
  version = " v" + chrome.runtime.getManifest().version;

  document.querySelector("#header .title").innerHTML = title;
  document.querySelector("#header .version").innerHTML = version;
};

const addSupportedLanguages = async () => {
  selectElement = document.querySelector("#region-languages-select");
  selectElement.addEventListener("change", onLanguageUpdate);

  optionTemplate = `<option value="$value">$name</option>`;
  let selectsHtml = "";
  selectsHtml += optionTemplate
    .replace("$value", "def")
    .replace("$name", "System Default");
  selectsHtml += optionTemplate
    .replace("$value", "nat")
    .replace("$name", "Native Language");

  for (const [key, value] of Object.entries(osuWorldLanguages)) {
    selectsHtml += optionTemplate
      .replace("$value", key)
      .replace("$name", value);
  }
  selectElement.innerHTML = selectsHtml;

  currentValue = localStorage.getItem("reg-lang");
  if (currentValue) {
    selectElement.value = currentValue;
  }
};

const onLanguageUpdate = (event) => {
  value = event.target.value;
  localStorage.setItem("reg-lang", value);
};

const init = () => {
  updateTitle();
  addSupportedLanguages();
};

init();
