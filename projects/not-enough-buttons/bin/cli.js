#!/usr/bin/env node
const rollup = require("rollup");
const copy = require("rollup-plugin-copy");
const multiInput = require("rollup-plugin-multi-input");
const ManifestJsonTransformer = require("../utils/ManifestJsonTransformer");

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
  const bundle = await rollup.rollup({
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
  });

  console.log(bundle.watchFiles);

  await bundle.write({
    dir: OUTPUT_FOLDER,
    // format: "esm"
  });

  await bundle.close();
})();
