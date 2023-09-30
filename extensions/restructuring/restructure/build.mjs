import esbuild from "esbuild";
import fs from "fs-extra";
import { copy } from "esbuild-plugin-copy";

const outdir = "build";

async function deleteOldDir() {
  await fs.remove(outdir);
}

async function runEsbuild({ buildPath, manifestPath, watch = false }) {
  const esbuildOptions = {
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
    ],
  };

  return watch
    ? esbuild.context(esbuildOptions)
    : esbuild.build(esbuildOptions);
}

async function build() {
  const args = process.argv.slice(2);

  let isChrome = args.includes("--chromium");
  let isFirefox = args.includes("--firefox");
  if (!isChrome && !isFirefox) {
    isChrome = true;
    isFirefox = true;
  }

  const isWatch = args.includes("--watch");
  await deleteOldDir();

  let chromeBuild, firefoxBuild;
  if (isChrome) {
    chromeBuild = await runEsbuild({
      buildPath: `./${outdir}/chromium`,
      manifestPath: "src/manifest_chromium.json",
      watch: isWatch,
    });
  } else if (isFirefox) {
    firefoxBuild = await runEsbuild({
      buildPath: `./${outdir}/firefox`,
      manifestPath: "src/manifest_firefox.json",
      watch: isWatch,
    });
  }

  console.log("Build success");

  if (isWatch) {
    await Promise.all([chromeBuild?.watch(), firefoxBuild?.watch()]);
    console.log("Watching for changes...");
  }
}

build();
