const { inputFolder } = require("./config");

const JAVASCRIPT_GLOB = fromInput("**/*.js");
const MANIFEST_GLOBS = [
  // don't do manifest.js, that's done in a custom plugin
  fromInput("manifest.js"),
  fromInput("manifest.json"),
];
const NOT_MANIFEST_GLOBS = MANIFEST_GLOBS.map((str) => "!" + str);

module.exports = {
  fromInput: (string) => INPUT_FOLDER + "/" + string,
};
