#!/usr/bin/env node
const rollup = require("rollup");
const copy = require("rollup-plugin-copy");
const multiInput = require("rollup-plugin-multi-input");
const ManifestJsonTransformer = require("../utils/ManifestJsonTransformer");

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

const INPUT_FOLDER = "src";
const OUTPUT_FOLDER = "dist";

const fromInput = (string) => INPUT_FOLDER + "/" + string;

const JAVASCRIPT_GLOB = fromInput("**/*.js");
const MANIFEST_GLOBS = [
  // don't do manifest.js, that's done in a custom plugin
  fromInput("manifest.js"),
  fromInput("manifest.json"),
];
const NOT_MANIFEST_GLOBS = MANIFEST_GLOBS.map((str) => "!" + str);

const manifestJsonTransformer = new ManifestJsonTransformer(INPUT_FOLDER);

(async function main() {
  const rollupOptions = {
    input: [JAVASCRIPT_GLOB],
    plugins: [
      copy({
        targets: [
          {
            src: [
              fromInput("**/*.*"),
              `!${JAVASCRIPT_GLOB}`,
              ...NOT_MANIFEST_GLOBS,
            ],
            dest: OUTPUT_FOLDER,
          },
        ],
      }),
      // copy manifest.json, process manifest.js
      copy({
        targets: [
          {
            src: MANIFEST_GLOBS,
            dest: OUTPUT_FOLDER,
            transform: (contents, filename) =>
              manifestJsonTransformer.transform(contents, filename),
            // doesn't work without the following line
            rename: () => "manifest.json",
          },
        ],
      }),
      multiInput.default(),
    ],
  };

  const writeOptions = {
    dir: OUTPUT_FOLDER,
    // format: "esm"
  };

  if (command === "watch") {
    const watcher = rollup.watch({
      ...rollupOptions,
      output: [writeOptions],
    });
    watcher.on("event", ({ result, code, error }) => {
      switch (code) {
        case "START":
          console.log("Building...");
          manifestJsonTransformer.reset();
          break;
        case "BUNDLE_START":
          break;
        case "BUNDLE_END":
          result.close();
          break;
        case "END":
          break;
        case "ERROR":
          console.error(error);
          result.close();
          break;
      }
    });
  } else {
    const bundle = await rollup.rollup(rollupOptions);
    console.log(bundle.watchFiles);
    await bundle.write(writeOptions);
    await bundle.close();
  }
})();
