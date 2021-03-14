#!/usr/bin/env node
const rollup = require("rollup");
const copy = require("rollup-plugin-copy");
const multiInput = require("rollup-plugin-multi-input");
const config = require("./config");
const path = require("path");
const { getWriteOptions, getGlobs } = require("./utils");
const hotReload = require("./hot-reload-plugin");

// must pass a command line command. For example, `not-enough-buttons build`
const command = process.argv[2];

if (command !== "build" && command !== "watch") {
  throw new Error(
    "Script must receive either build or watch command. Instead, got " + command
  );
}

const isProduction = command === "build";

async function main(INPUT_FOLDER, OUTPUT_FOLDER) {
  // create various globs
  const {
    EVERYTHING,
    JAVASCRIPT,
    NOT_JAVASCRIPT,
    MANIFESTS,
    NOT_MANIFESTS,
  } = getGlobs(INPUT_FOLDER);

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
            transform: (contents, rawFilename) => {
              const filename = rawFilename.toLowerCase();
              if (filename !== "manifest.js" && filename !== "manifest.json") {
                // we don't process non-manifest files
                return contents;
              }

              let manifestJson;
              if (filename === "manifest.js") {
                // the manifest.js file returns a potentially processed json object.
                manifestJson = require(path.resolve(
                  process.cwd(),
                  path.join(INPUT_FOLDER, filename)
                ));
              } else {
                // the manifest.json file contains the final json object.
                manifestJson = JSON.parse(contents.toString());
              }

              // add hotreload scripts.
              if (!isProduction) {
                manifestJson.background = manifestJson.background || {};
                manifestJson.background.scripts =
                  manifestJson.background.scripts || [];
                manifestJson.background.scripts.push(
                  "neb-scripts/hot-reload.js"
                );
              }

              return Buffer.from(JSON.stringify(manifestJson, null, 2), "utf8");
            },
            // bug: doesn't work without the following line
            rename: () => "manifest.json",
          },
        ],
      }),

      multiInput.default(),
      hotReload({
        targets: [{ dest: OUTPUT_FOLDER }],
      }),
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
}

const { INPUT_FOLDER, OUTPUT_FOLDER } = config();

main(INPUT_FOLDER, OUTPUT_FOLDER);
