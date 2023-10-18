import { saveInCache, loadFromCache } from "./cache";

export const expireHeader = "expireDate";

export interface IFetchError {
    error: string;
}

export interface IfetchResponse<T> {
    data?: T;
    error?: {
        code: string;
        url?: string;
        userId?: string;
        mode?: string;
    };
    cache?: boolean;
    expireDate?: number;
    preserve?: boolean;
}

export type fetchOptions = {
    signal?: AbortSignal;
}

export type fetchCacheOptions = {
    preserve?: boolean;
} & fetchOptions;

export const genExpireDate = (expireTime: number) => Date.now() + expireTime;

const pendingRequests: { [key: string]: Promise<object> } = {};

const fetchAndSaveInCache = async (
    url: string,
    expireTime: number,
    options: fetchCacheOptions,
): Promise<IfetchResponse<object>> => {
    const { preserve, signal } = options;
    return fetch(url, { signal: signal })
        .then(async (res) => {
            const jsonResponse = await res.json();
            if (!jsonResponse)
                return {
                    error: {
                        code: noData,
                        url: url,
                    },
                };
            const cachedResponse: IfetchResponse<object> = {};
            cachedResponse["data"] = jsonResponse;
            if(expireTime > 0){
                cachedResponse[expireHeader] = genExpireDate(expireTime);
            }
            if (preserve) {
                cachedResponse["preserve"] = true;
            }
            saveInCache(url, cachedResponse);
            return cachedResponse;
        })
        .catch((err) => {
            //AbortError
            if (err.code === 20) {
                return {};
            }
            return { error: { code: cannotFetchError, url: url } };
        });
};

/**
 *
 * @param url Url to fetch
 * @param expireTime Time in milliseconds to expire the cache
 * @param preserve Whether the cache should be cleaned or not
 * @returns
 */
export const fetchWithCache = async (
    url: string,
    expireTime: number,
    options: fetchCacheOptions = {},
): Promise<IfetchResponse<object>> => {
    if (pendingRequests[url] !== undefined) {
        return pendingRequests[url];
    }

    const cachedItem = (await loadFromCache(url)) as IfetchResponse<object> | undefined;
    if (cachedItem) {
        const expireDate = cachedItem[expireHeader]!;
        if (expireDate < Date.now()) {
            return fetchAndSaveInCache(url, expireTime, options);
        }
        cachedItem["cache"] = true;
        return cachedItem;
    } else {
        const fetchPromise = fetchAndSaveInCache(url, expireTime, options);
        pendingRequests[url] = fetchPromise;
        const result = await fetchPromise;
        delete pendingRequests[url];
        return result;
    }
};

export const fetchWithoutCache = async (url: string, options: fetchOptions = {}) => {
    if (pendingRequests[url] !== undefined) {
        return pendingRequests[url];
    }
    const fetchPromise = fetchAndSaveInCache(url, 0, options);
    pendingRequests[url] = fetchPromise;
    const result = await fetchPromise;
    delete pendingRequests[url];
    return result;
}

export const unknownUserError = "unknown_user";
const cannotFetchError = "cannot_fetch";
const noData = "no_data";
export const noId = "no_id";
export const noMode = "no_mode";

export const fetchErrorToText = (response: IfetchResponse<object> | undefined) => {
    if (!response?.error?.code) return "";
    const error = response.error;
    switch (error.code) {
        case unknownUserError:
            return "Unknown user " + error.userId;
        case cannotFetchError:
            return "Cannot fetch " + error.url;
        case noData:
            return "No data for " + error.url;
        case noId:
            return "No player ID found";
        case noMode:
            return "No mode found when paring url " + error.mode;
        default:
            return "Unknown error";
    }
};

export const fetchWithMinimumWaitTime = async <T>(
    dataPromise: Promise<IfetchResponse<T>>,
    waitTime: number,
): Promise<IfetchResponse<T>> => {
    const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, waitTime);
    }) as Promise<IfetchResponse<T>>;

    return Promise.race([dataPromise, waitPromise])
        .then(async (result) => {
            const hasCache = result && result["cache"];
            const hasError = result && result["error"];
            if (hasError) {
                return result;
            }
            if (hasCache) {
                return result;
            } else {
                await waitPromise;
                return await dataPromise;
            }
        })
        .then((result) => {
            return result as IfetchResponse<T>;
        });
};
