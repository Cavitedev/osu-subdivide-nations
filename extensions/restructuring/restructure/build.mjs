import esbuild from "esbuild";
import fs from "fs-extra";
import { copy } from "esbuild-plugin-copy";

const outdir = "build";
const tmp_dir = "tmp_build";

async function deleteOldDir() {
  await fs.remove(outdir);
}

async function runEsbuild(buildPath, manifestPath) {
  await esbuild.build({
    entryPoints: ["src/content-script/osu_content.ts"],
    bundle: true,
    outdir: buildPath,

    assetNames: "[assets/[name]-[hash]]",
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
  });
}

async function copyFiles(entryPoints, targetDir) {
  await fs.ensureDir(targetDir);
  await Promise.all(
    entryPoints.map(async (entryPoint) => {
      await fs.copy(entryPoint.src, `${targetDir}/${entryPoint.dst}`);
    })
  );
}

async function build() {
  await deleteOldDir();
  await runEsbuild(`./${outdir}/chromium`, "src/manifest_chromium.json");
  await runEsbuild(`./${outdir}/firefox`, "src/manifest_firefox.json");


  console.log("Build success");
}

build();
