import solid from 'vite-plugin-solid'
import { defineConfig } from "vite";
import webExtension from "@samrum/vite-plugin-web-extension";
import path from "path";
import { TtargetBrowser, getManifest } from "./src/manifest";
import zipPack from "vite-plugin-zip-pack";

// https://vitejs.dev/config/
export default defineConfig(() => {
    let browser;

    const args = process.argv.slice(2);

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("--browser=")) {
            browser = args[i].split("--browser=")[1];
        }
    }

    if (browser === "chromium" || browser === "firefox") {
        return {
            ...buildFor(browser),
        };
    }else{
        return {
            ...buildFor("chromium"),
        };
    }
});

const buildFor = (mode: TtargetBrowser) => {
    return {
        plugins: [
            solid(),
            webExtension({
                manifest: getManifest(mode as TtargetBrowser),
            }),
            zipPack({
                inDir: `build/${mode}`,
                outDir: `build`,
                outFileName: `${mode}.zip`,
            })
        ],
        resolve: {
            alias: {
                "@src": path.resolve(__dirname, "./src"),
            },
        },
        build: {
            outDir: `build/${mode}`,
        },
    };
};
