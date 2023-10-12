import browser from "webextension-polyfill";
export const saveInCache = async (url: string, data: object) => {
    return browser.storage.local.set({ [url]: data });
};

export const loadFromCache = async (url: string): Promise<any | null> => {
    const storageReturn = await browser.storage.local.get([url]);
    if (!storageReturn || Object.keys(storageReturn).length === 0) {
        return null;
    } else {
        return storageReturn[url];
    }
};

export const cleanInvalidatedCacheConditionally = async () => {
    const cacheClean = (await loadFromCache("cacheClean")) as number | null;
    if (!cacheClean || cacheClean < Date.now()) cleanInvalidatedCache();
};

export const cleanInvalidatedCache = async () => {
    const items = await browser.storage.local.get();

    const now = Date.now();
    const itemEntries = Object.entries(items);
    if (itemEntries.length === 0) return;
    const cleanKeys = itemEntries
        .filter(([_, value]) => value.expireDate < now && !value?.preserve)
        .map(([key, _]) => key);
    await browser.storage.local.remove(cleanKeys);

    const newDate = Date.now() + 604800000; // 1 week
    await browser.storage.local.set({ cacheClean: newDate });
};

export const cleanCache = async () => {
    return browser.storage.local.clear();
};
