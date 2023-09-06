const updateTitle = () => {
  title =
    "osu! subdivide nations" + " v" + chrome.runtime.getManifest()?.version ??
    "";

  document.querySelector("#header .title").innerHTML = title;
};

const init = () => {
  updateTitle();
};

init();
