#!/usr/bin/env node
const rollup = require("rollup");
const copy = require("rollup-plugin-copy");
const multiInput = require("rollup-plugin-multi-input");
const ManifestJsonTransformer = require("../utils/ManifestJsonTransformer");
const config = require("./config");
const { getWriteOptions } = require("./utils");

// must pass a command line command. For example, `not-enough-buttons build`
const command = process.argv[2];

switch (command) {
  case "build":
  case "watch":
    break;
  default:
    if (!command) {
      throw new Error("Must pass either build or watch command.");
    } else {
      throw new Error("Unknown command " + command);
    }
}

const { INPUT_FOLDER, OUTPUT_FOLDER } = config();

(async function main() {
  const manifestJsonTransformer = new ManifestJsonTransformer(INPUT_FOLDER);

  // create various globs
  const fromInput = (string) => INPUT_FOLDER + "/" + string;
  const EVERYTHING = fromInput("**/*.*");
  const JAVASCRIPT = fromInput("**/*.js");
  const NOT_JAVASCRIPT = "!" + JAVASCRIPT;
  const MANIFESTS = [fromInput("manifest.js"), fromInput("manifest.json")];
  const NOT_MANIFESTS = MANIFESTS.map((str) => "!" + str);

  const rollupOptions = {
    input: [JAVASCRIPT],
    plugins: [
      copy({
        targets: [
          {
            src: [EVERYTHING, NOT_JAVASCRIPT, ...NOT_MANIFESTS],
            dest: OUTPUT_FOLDER,
          },
        ],
      }),
      // copy manifest.json, process manifest.js
      copy({
        targets: [
          {
            src: MANIFESTS,
            dest: OUTPUT_FOLDER,
            transform: (contents, filename) =>
              manifestJsonTransformer.transform(contents, filename),
            // bug: doesn't work without the following line
            rename: () => "manifest.json",
          },
        ],
      }),
      multiInput.default(),
    ],
  };

  if (command === "watch") {
    const watcher = rollup.watch({
      ...rollupOptions,
      output: [getWriteOptions(OUTPUT_FOLDER)],
    });

    watcher.on("event", ({ result, code, error }) => {
      const handlers = {
        START: () => {
          console.log("Building...");
          manifestJsonTransformer.reset();
        },
        BUNDLE_END: () => result.close(),
        ERROR: () => {
          console.error(error);
          result.close();
        },
        BUNDLE_START: null,
        END: null,
      };

      const handler = handlers[code];
      handler && handler();
    });
  } else {
    const bundle = await rollup.rollup(rollupOptions);
    console.log(bundle.watchFiles);
    await bundle.write(getWriteOptions(OUTPUT_FOLDER));
    await bundle.close();
  }
})();
