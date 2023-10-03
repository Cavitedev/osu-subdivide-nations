import { addFlagUser } from "@src/content-script/osu/flagHtml";
import { idFromProfileUrl, nextFunctionId, runningId } from "./content";

// https://osu.ppy.sh/home/friends
const setActualFriendsObserver = new MutationObserver((_) => {
    updateFlagsFriends();
    setActualFriendsObserver.disconnect();
  });
  
  const updateFlagsFriendsObserver = new MutationObserver((_) => {
    updateFlagsFriends();
  });
  
  export const updateFlagsFriends = async () => {
    const functionId = nextFunctionId();
  
  
    const allFriendsElement = document.querySelector(".t-changelog-stream--all");
    if (allFriendsElement) {
    updateFlagsFriendsObserver.observe(document.querySelector(".t-changelog-stream--all")!, {
      attributes: true,
      attributeFilter: ['href']
    });
  }else{
    setActualFriendsObserver.observe(document.querySelector(".js-react--friends-index")!, {
      childList: true,
    });
    return;
  }
  
    const friendsList = document
      .querySelector(".user-list")!.querySelectorAll(".user-card__details");
  
    for (let item of friendsList) {
      if (functionId != runningId) {
        return;
      }
      const playerNameElement = item.querySelector(".user-card__username") as HTMLElement;
      const playerId = idFromProfileUrl(playerNameElement.getAttribute("href")!);
      await addFlagUser(item as HTMLElement, playerId, true, true);
    }
  };