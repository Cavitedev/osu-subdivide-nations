import { Mock } from "node:test";
import { expireHeader } from "./fetchUtils";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import mockBrowser from "../__mocks__/browser";
import { osuWorldUser, osuWorldUsers } from "./osuWorld";

describe("Osu World", () => {
    beforeEach(() => {
        mockBrowser.storage.local.get.mockReset();
    });

    describe("osuWorldUser", () => {
        test("Cache no placement, does not need placement, use cache", async () => {
            const mockFetch = jest.fn(() =>
                Promise.resolve({
                    json: () =>
                        Promise.resolve({
                            id: 4871211,
                            username: "nekonyo",
                            country_id: "ES",
                            region_id: "ES-CM",
                            placement: 1,
                        }),
                }),
            );
            global.fetch = mockFetch.bind(global.fetch);

            const getStorage = async (): Promise<Record<string, any>> => {
                return {
                    "https://osuworld.octo.moe/api/users/4871211": {
                        data: {
                            id: 4871211,
                            username: "nekonyo mock",
                            country_id: "ES",
                            region_id: "ES-CM",
                        },
                        [expireHeader]: Date.now() + 1000000,
                    },
                };
            };

            mockBrowser.storage.local.get.mockImplementation(getStorage);

            const userNoPlacement = await osuWorldUser("4871211");
            expect(mockFetch).toBeCalledTimes(0);
            expect(userNoPlacement.data).toEqual({
                id: 4871211,
                username: "nekonyo mock",
                country_id: "ES",
                region_id: "ES-CM",
            });
        });

        test("Cache has no placement, needs placement, force fetch", async () => {
            const mockUserFetch = jest.fn(() =>
                Promise.resolve({
                    json: () =>
                        Promise.resolve({
                            id: 4871211,
                            username: "nekonyo",
                            country_id: "ES",
                            region_id: "ES-CM",
                            placement: 1,
                        }),
                }),
            );
            global.fetch = mockUserFetch.bind(global.fetch);

            const getStorage = async (): Promise<Record<string, any>> => {
                return {
                    "https://osuworld.octo.moe/api/users/4871211": {
                        data: {
                            id: 4871211,
                            username: "nekonyo mock",
                            country_id: "ES",
                            region_id: "ES-CM",
                        },
                        [expireHeader]: Date.now() + 1000000,
                    },
                };
            };

            mockBrowser.storage.local.get.mockImplementation(getStorage);

            const userPlacement = await osuWorldUser("4871211", "taiko");
            expect(userPlacement.data).toEqual({
                id: 4871211,
                username: "nekonyo",
                country_id: "ES",
                region_id: "ES-CM",
                placement: 1,
            });
            expectToHaveBeenCalledWithFirstArg(mockUserFetch, "https://osuworld.octo.moe/api/users/4871211?mode=taiko");
        });
    });

    describe("osuWorldUsers", () => {
        test("No cache, a group of ids returns some users", async () => {
            const mockFetch = jest.fn(() =>
                Promise.resolve({
                    json: () =>
                        Promise.resolve([
                            {
                                id: 4871211,
                                username: "nekonyo mock",
                                country_id: "ES",
                                region_id: "ES-CM",
                            },
                            {
                                id: 1,
                                username: "x",
                                country_id: "y",
                                region_id: "y-z",
                            },
                        ]),
                }),
            );
            global.fetch = mockFetch.bind(global.fetch);

            const users = await osuWorldUsers(["4871211", "1"], new AbortController().signal);
            expect(users).toEqual({
                data: [
                    {
                        id: 4871211,
                        username: "nekonyo mock",
                        country_id: "ES",
                        region_id: "ES-CM",
                    },
                    {
                        id: 1,
                        username: "x",
                        country_id: "y",
                        region_id: "y-z",
                    },
                ],
            });

            expectToHaveBeenCalledWithFirstArg(mockFetch, "https://osuworld.octo.moe/api/subdiv/users?ids=4871211,1");
        });

        test("One of the ids is cached. Request only one of them", async () => {
            const mockFetch = jest.fn(() =>
                Promise.resolve({
                    json: () =>
                        Promise.resolve([
                            {
                                id: 1,
                                username: "x",
                                country_id: "y",
                                region_id: "y-z",
                            },
                        ]),
                }),
            );
            global.fetch = mockFetch.bind(global.fetch);

            const getStorage = async (): Promise<Record<string, any>> => {
                return {
                    "https://osuworld.octo.moe/api/users/4871211": {
                        data: {
                            id: 4871211,
                            username: "nekonyo mock",
                            country_id: "ES",
                            region_id: "ES-CM",
                        },

                        [expireHeader]: Date.now() + 1000000,
                    },
                };
            };

            mockBrowser.storage.local.get.mockImplementation(getStorage);

            const users = await osuWorldUsers(["4871211", "1"], new AbortController().signal);
            expectToHaveBeenCalledWithFirstArg(mockFetch, "https://osuworld.octo.moe/api/subdiv/users?ids=1");

            expect(users).toEqual({
                data: [
                    {
                        id: 4871211,
                        username: "nekonyo mock",
                        country_id: "ES",
                        region_id: "ES-CM",
                    },
                    {
                        id: 1,
                        username: "x",
                        country_id: "y",
                        region_id: "y-z",
                    },
                ],
            });
        });
    });

    function expectToHaveBeenCalledWithFirstArg(mockFunction: Mock<any>, expectedFirstArg: any) {
        const calls = mockFunction.mock.calls;
        if (calls.length === 0) {
            throw new Error("Function was not called.");
        }

        const firstCallArgs = calls[0]; // Get arguments of the first call
        if (firstCallArgs.length === 0) {
            throw new Error("Function was called without any arguments.");
        }

        const actualFirstArg = firstCallArgs[0];
        expect(actualFirstArg).toEqual(expectedFirstArg);
    }
});
