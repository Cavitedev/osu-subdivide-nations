import * as tools from "../tools";


(async () => {
  console.log("osu_content.ts 16");

  chrome.runtime.onMessage.addListener(async (obj, sender, respone) => {
    console.log("Received message content");
  })
  console.log(tools.isNumber("5"));
})();
