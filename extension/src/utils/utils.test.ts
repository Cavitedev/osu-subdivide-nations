import {expect, test} from '@jest/globals';
import { idFromOsuProfileUrl } from "./utils";


test("Actual osu profile url returns id", () => {
    expect(idFromOsuProfileUrl("https://osu.ppy.sh/users/123456")).toBe("123456");
})