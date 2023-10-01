export const saveInCache = async (url:string, data:object) => {
    return chrome.storage.local.set({ [url]: data });
  }
  
  export const loadFromCache =async  (url:string): Promise<any | null> => {
    const storageReturn = await chrome.storage.local.get([url]);
    if(Object.keys(storageReturn).length === 0){
      return null;
    }else{
      return storageReturn[url];
    }
  }
  
const lastCacheCleanKey = "lastCacheClean";

export const cleanCacheConditionally = async () => {
    const lastClean = await loadFromCache(lastCacheCleanKey);
    if(!lastClean || lastClean.expire < Date.now()){
        await chrome.storage.local.clear();
        await saveInCache(lastCacheCleanKey, {expire: Date.now() + 604800000}); // 7 days
    }
}