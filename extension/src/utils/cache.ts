export const saveInCache = async (url:string, data:object) => {
    return chrome.storage.local.set({ [url]: data });
  }
  
  export const loadFromCache =async  (url:string): Promise<any | null> => {
    const storageReturn = await chrome.storage.local.get([url]);
    if(!storageReturn ||  Object.keys(storageReturn).length === 0){
      return null;
    }else{
      return storageReturn[url];
    }
  }
  

export const cleanInvalidatedCacheConditionally = async () => {

    const bytesThresholdClean = 4000000; // 4MB
    const storage = await chrome.storage.local.getBytesInUse();
    if(storage > bytesThresholdClean){
        cleanInvalidatedCache();
    }
}

export const cleanInvalidatedCache =  () => {
  return chrome.storage.local.get((items) => {
      const now = Date.now();
      const itemEntries = Object.entries(items);
      if(itemEntries.length === 0) return;
      const cleanKeys = itemEntries.filter(([key, value]) => value.expireDate < now && !value?.preserve).map(([key,value]) => key)
      chrome.storage.local.remove(cleanKeys);
    })

}

export const cleanCache = async () => {
  return chrome.storage.local.clear();
}