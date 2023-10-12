import fs from "fs-extra";
import path from "path";
import jsonminify from "jsonminify";
import { glob } from "glob";

export default ({ resolveFrom }) => ({
  name: "json-plugin-copy",
  setup(build) {
    build.onStart(async () => {
      const outdir = build.initialOptions.outdir;

      const cwd = process.cwd();

      const relativePath = path.relative(cwd, resolveFrom);

      const files = await glob(resolveFrom + ".json");

      for (const file of files){
        const jsonFilePath = path.resolve(cwd, file);
        const jsonContents = await fs.readFile(jsonFilePath, "utf8");
        let minifiedJson = jsonminify(jsonContents);
        if(!minifiedJson) minifiedJson = "{}";

        const outFilePath = path.resolve(outdir, file).replace("\\src", "");
        fs.outputFileSync(outFilePath, minifiedJson, {
          encoding: "utf8",
        });
      }

    });
  },
});
