#!/usr/bin/env node
const rollup = require("rollup");
const copy = require("rollup-plugin-copy");
const multiInput = require("rollup-plugin-multi-input");

const OUTPUT_FILE = "dist";
const JAVASCRIPT_GLOB = "src/**/*.js";

(async function main() {
  const bundle = await rollup.rollup({
    input: [JAVASCRIPT_GLOB],
    plugins: [
      copy({
        targets: [
          { src: ["src/**/*.*", `!${JAVASCRIPT_GLOB}`], dest: OUTPUT_FILE },
        ],
      }),
      multiInput.default(),
    ],
  });
  console.log(bundle.watchFiles);

  await bundle.write({
    dir: OUTPUT_FILE,
    // format: "esm"
  });

  await bundle.close();
})();
