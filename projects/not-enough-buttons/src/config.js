module.exports = function config(opts = {}) {
  const defaults = {
    INPUT_FOLDER: "src",
    OUTPUT_FOLDER: "dist",
  };

  return Object.assign(defaults, opts);
};
