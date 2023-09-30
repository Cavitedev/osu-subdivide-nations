import esbuild from "esbuild";
import fs from "fs-extra";
import { copy } from "esbuild-plugin-copy";
import { refreshChrome } from "./build_plugins/refresh_chrome.mjs";

const outdir = "build";

async function deleteOldDir() {
  await fs.remove(outdir);
}

async function runEsbuild(buildPath, manifestPath) {
  return esbuild.context({
    entryPoints: ["src/content-script/osu_content.ts"],
    bundle: true,
    outdir: buildPath,
    plugins: [
      copy({
        assets: {
          from: ["./src/assets/**"],
          to: ["./assets"],
        },
      }),
      copy({
        assets: {
          from: [manifestPath],
          to: ["./manifest.json"],
        },
      }),
      refreshChrome,
    ],
  });
}


async function build() {
  await deleteOldDir();
  const chromeBuild =  await runEsbuild(`./${outdir}/chromium`, "src/manifest_chromium.json");
  const firefoxBuild = await runEsbuild(`./${outdir}/firefox`, "src/manifest_firefox.json");
  console.log("Build success");
  chromeBuild.watch();
  await firefoxBuild.watch();

}

build();
