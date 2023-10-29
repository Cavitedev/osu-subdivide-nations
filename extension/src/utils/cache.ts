import browser from "webextension-polyfill";
export const saveInCache = async (url: string, data: object) => {
    try {
        return browser.storage.local.set({ [url]: data });
    } catch (e) {
        console.error(`Error storing: ${data} in ${url} Error:${e}`);
    }
};

export const loadFromCache = async (url: string): Promise<any | null> => {
    try {
        const storageReturn = await browser.storage.local.get([url]);
        if (!storageReturn || Object.keys(storageReturn).length === 0) {
            return null;
        } else {
            return storageReturn[url];
        }
    } catch (e) {
        console.error(`Error loading: ${url} Error:${e}`);
    }
};

export const loadMultipleUrlsFromCache = async <T>(urls: string[]): Promise<Record<string, T> | null> => {
    try {
        const storageReturn = await browser.storage.local.get(urls);
        if (!storageReturn || Object.keys(storageReturn).length === 0) {
            return null;
        } else {
            return storageReturn;
        }
    } catch (e) {
        console.error(`Error loading: ${urls} Error:${e}`);
        return null;
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
