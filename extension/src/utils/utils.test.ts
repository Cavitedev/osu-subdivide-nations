import { describe, expect, test } from "@jest/globals";
import { convertToGroupsOf5, countryCodeFromRegion, idFromOsuProfileUrl } from "./utils";

describe("convertToGroupsOfFive", () => {
    test("1st group", () => {
        expect(convertToGroupsOf5(1)).toEqual([1, 2, 3, 4, 5]);
    });
    test("2nd group", () => {
        expect(convertToGroupsOf5(2)).toEqual([6, 7, 8, 9, 10]);
    });
});

describe("idFromOsuProfileUrl", () => {
    // Gets id from osu link url. It doesn't work for other websites
    test("Actual osu profile url returns id", () => {
        expect(idFromOsuProfileUrl("https://osu.ppy.sh/users/123456")).toBe("123456");
    });
    test("Simple link returns id too", () => {
        expect(idFromOsuProfileUrl("https://osu.ppy.sh/u/123456")).toBe("123456");
    });
    test("Works with http", () => {
        expect(idFromOsuProfileUrl("http://osu.ppy.sh/users/123456")).toBe("123456");
    });
    test("Works with old page", () => {
        expect(idFromOsuProfileUrl("https://old.ppy.sh/users/123456")).toBe("123456");
    });
    test("Works even if other mod is selected", () => {
        expect(idFromOsuProfileUrl("https://old.ppy.sh/users/123456/fruits")).toBe("123456");
    });
    test("Null if null", () => {
        expect(idFromOsuProfileUrl(null)).toBe(null);
    });
    test("Null if undefined", () => {
        expect(idFromOsuProfileUrl(undefined)).toBe(null);
    });
    test("Null if the link is empty string", () => {
        expect(idFromOsuProfileUrl("")).toBe(null);
    });
    test("Null if the link is not osu link", () => {
        expect(idFromOsuProfileUrl("https://google.com")).toBe(null);
    });
    test("Null on beatmap page", () => {
        expect(idFromOsuProfileUrl("https://osu.ppy.sh/beatmapsets/2065632")).toBe(null);
    });
    test("Null on typo url", () => {
        expect(idFromOsuProfileUrl("https://oss.ppy.sh/u/123456")).toBe(null);
    });
    test("Null on typo url 2", () => {
        expect(idFromOsuProfileUrl("https://osu.ppy.sh/userss/123456")).toBe(null);
    });

    test("Null if id is not a number", () => {
        expect(idFromOsuProfileUrl("https://osu.ppy.sh/users/x1")).toBe(null);
    });
});

describe("Country from region", () => {
    test("Hyphen region", () =>  {
        expect(countryCodeFromRegion("CN-BJ")).toBe("CN");
    })

    test("Number Region", () =>  {
        expect(countryCodeFromRegion("PT16")).toBe("PT");
    })

});