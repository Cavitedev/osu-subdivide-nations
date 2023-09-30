import * as tools from "@src/tools";

(async () => {
  console.log("osu_content.ts 16");

  let someVar = "2";
  console.log(someVar);

  const src = chrome.runtime.getURL("../tools.js");
  

  console.log(tools.isNumber("5"));
})();
