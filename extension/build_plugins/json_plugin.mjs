import fs from "fs/promises";
import path from "path";
import jsonminify from "jsonminify";

export default (options = {}) => ({
  name: "json-plugin",
  setup(build) {
    build.onResolve({ filter: /\.json$/ }, async (args) => {

      // Resolve the path to the JSON file
      const jsonFilePath = path.resolve(args.resolveDir, args.path);

      try {
        // Read the JSON file
        const jsonContents = await fs.readFile(jsonFilePath, "utf8");

        // Minify the JSON content
        const minifiedJson = jsonminify(jsonContents);

        // Add the JSON content as a virtual module
        return {
          path: args.path,
          namespace: "json-plugin",
          pluginData: { json: minifiedJson },
        };
      } catch (error) {
        return null; // File not found or other error
      }
    });

    build.onLoad({ filter: /\.json$/, namespace: "json-plugin" }, async (args) => {
      // Emit the minified JSON content as a module
      console.log(args.path);
      return {
        contents: args.pluginData.json,
        loader: args.path.includes("flags")?  "copy" : "json",
        resolveDir: path.dirname(args.path),
      };
    });
  },
});
