import { describe, expect, test } from "@jest/globals";
import fs from "fs-extra";
import { IflagsData } from "./utils/flagsJsonUtils";

function readJsonFile(filePath: string) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  describe("Test flags.json content", () => {
    const flagsJson = readJsonFile("./public/flags.json") as IflagsData;
    test("Flags.json is not empty", () => {
        expect(Object.keys(flagsJson).length).toBeGreaterThan(0);
    });
    describe("Test flag links", () => {

        const flagLinks = Object.values(flagsJson).flatMap((country) => Object.values(country.regions).flatMap((region) => region.flag));
        test("Link does not commons wikimedia", () => {
            flagLinks.forEach((link) => {
                expect(link).not.toContain("commons.wikimedia.org");
            })
        })
        test("Valid extension", () => {
            const regex = /\.svg|\.png|\.jpg|\.jpeg|\.gif/;
            flagLinks.forEach((link) => {
                expect(link).toMatch(regex);
            })
        })
    });

    describe("Test native names", () => {

        const nativeNames = Object.values(flagsJson).flatMap((country) => Object.values(country.regions).flatMap((region) => region.nativeName));

        test("Native names cannot contain /", () => {
            nativeNames.forEach((name) => {
                expect(name).not.toContain("/");
            })
        });

        test("Native names cannot contain |", () => {
            nativeNames.forEach((name) => {
                expect(name).not.toContain("|");
            })
        });

    });

  });