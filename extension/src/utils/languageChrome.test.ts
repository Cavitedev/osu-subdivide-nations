import { beforeEach, describe, expect, test } from "@jest/globals";
import mockBrowser from "../__mocks__/browser";
import { getLocMsg } from "./languageChrome";

describe("Needs message mock", () => {
    beforeEach(() => {
        mockBrowser.i18n.getMessage.mockReset();
    });

    describe("getLocMsg", () => {
        test("No sustitutions returns right translation", () => {
            const getMessage = (
                messageName: string,
                substitutions: string | string[] | undefined = undefined,
            ): string => {
                if (messageName === "test") {
                    return "test string";
                } else {
                    return "";
                }
            };

            mockBrowser.i18n.getMessage.mockImplementation(getMessage);
            const translation = getLocMsg("test");
            expect(translation).toEqual("test string");
        });

        test("Key string is not found but the substitution string is found", () => {
            const getMessage = (
                messageName: string,
                substitutions: string | string[] | undefined = undefined,
            ): string => {
                console.log("test");
                if (messageName === "test" || substitutions?.includes("test")) {
                    return "test string";
                } else {
                    return "";
                }
            };
            mockBrowser.i18n.getMessage.mockImplementation(getMessage);

            const translation = getLocMsg("test0", "test");
            expect(translation).toEqual("test string");
        });
    });
});
