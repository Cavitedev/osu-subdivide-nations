import { beforeEach, describe, expect, test } from "@jest/globals";
import mockBrowser from "../__mocks__/browser";
import { locMsgToHtml, getLocMsg } from "./languageChrome";

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

    describe("getLocHtml", () => {
        beforeEach(() => {
            const getMessage = (
                messageName: string,
                substitutions: string | string[] | undefined = undefined,
            ): string => {
                if (messageName === "test" || substitutions?.includes("test")) {
                    return "test string";
                } else if (messageName === "link_text" || substitutions?.includes("link_text")) {
                    return "text with link";
                }
                return "";
            };
            mockBrowser.i18n.getMessage.mockImplementation(getMessage);
        });

        test("No replacements returns a span with the text ", () => {
            const translationHtml = locMsgToHtml("test string");
            expect(translationHtml.length).toEqual(1);
            expect(translationHtml[0].textContent).toEqual("test string");
            expect(translationHtml[0].tagName).toEqual("SPAN");
        });

        test("Link in the middle with forced string change returns the 3 elements correctly", () => {
            const link = "https://www.example.com";
            const anchorLink = "text with link";

            const translationHtml = locMsgToHtml("this paragraph contains a {{link_text}} and some other text", [
                { type: "A", link: link, match: "link_text", forcedString: anchorLink },
            ]);
            expect(translationHtml.length).toEqual(3);
            expect(translationHtml[0].tagName).toEqual("SPAN");
            expect(translationHtml[0].textContent).toEqual("this paragraph contains a ");
            expect(translationHtml[1].tagName).toEqual("A");
            expect(translationHtml[1].getAttribute("href")).toEqual(link);
            expect(translationHtml[1].textContent).toEqual(anchorLink);
            expect(translationHtml[2].tagName).toEqual("SPAN");
            expect(translationHtml[2].textContent).toEqual(" and some other text");
        });

        test("Link in the middle without forced string change returns the 3 elements correctly", () => {
            const link = "https://www.example.com";
            const anchorLink = "text with link";

            const translationHtml = locMsgToHtml("this paragraph contains a {{link_text}} and some other text", [
                { type: "A", link: link, match: "link_text" },
            ]);
            expect(translationHtml.length).toEqual(3);
            expect(translationHtml[0].tagName).toEqual("SPAN");
            expect(translationHtml[1].tagName).toEqual("A");
            expect(translationHtml[2].tagName).toEqual("SPAN");
            expect(translationHtml[1].getAttribute("href")).toEqual(link);
            expect(translationHtml[1].textContent).toEqual(anchorLink);
        });

        test("String with the same link twice works fine", () => {
            const link = "https://www.example.com";
            const anchorLink = "text with link";

            const translationHtml = locMsgToHtml(
                "this paragraph contains a {{link_text}} and some other text with the {{link_text}}",
                [{ type: "A", link: link, match: "link_text" }],
            );
            expect(translationHtml.length).toEqual(4);
            expect(translationHtml[0].tagName).toEqual("SPAN");
            expect(translationHtml[1].tagName).toEqual("A");
            expect(translationHtml[2].tagName).toEqual("SPAN");
            expect(translationHtml[3].tagName).toEqual("A");
            expect(translationHtml[3].getAttribute("href")).toEqual(link);
            expect(translationHtml[3].textContent).toEqual(anchorLink);
            expect(translationHtml[2].textContent).toEqual(" and some other text with the ");
        });
    });
});
