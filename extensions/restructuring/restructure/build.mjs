import esbuild from "esbuild";
import fs from "fs-extra";


const outdir = "build";

async function deleteOldDir() {
  await fs.remove(outdir);
}

async function runEsbuild() {
  await esbuild.build({
    entryPoints: ["src/content-script/osu_content.ts"],
    bundle: true,
    outdir: outdir,
  });
}

async function build() {
  await deleteOldDir();
  await runEsbuild();
  console.log("Build success");
}

build();
