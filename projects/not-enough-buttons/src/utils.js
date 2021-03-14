module.exports = {
  getWriteOptions: (OUTPUT_FOLDER) => ({
    dir: OUTPUT_FOLDER,
  }),
  getGlobs: (INPUT_FOLDER) => {
    const fromInput = (string) => INPUT_FOLDER + "/" + string;

    const EVERYTHING = fromInput("**/*.*");
    const JAVASCRIPT = fromInput("**/*.js");
    const NOT_JAVASCRIPT = "!" + JAVASCRIPT;
    const MANIFESTS = [fromInput("manifest.js"), fromInput("manifest.json")];
    const NOT_MANIFESTS = MANIFESTS.map((str) => "!" + str);

    return {
      EVERYTHING,
      JAVASCRIPT,
      NOT_JAVASCRIPT,
      MANIFESTS,
      NOT_MANIFESTS,
    };
  },
};
