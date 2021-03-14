const path = require("path");

module.exports = class ManifestJsonTransformer {
  constructor(srcDir) {
    this.srcDir = srcDir;
    this.currentDir = process.cwd();
    this.manifestFound = false;
  }

  transform(contents, rawFilename) {
    const filename = rawFilename.toLowerCase();

    const isManifest =
      filename === "manifest.js" || filename === "manifest.json";

    if (!isManifest) {
      // we don't process non-manifest files
      return contents;
    }

    if (this.manifestFound) {
      // warn if this file is a duplicate. process it anyway if it is.
      console.warn(`WARNING: Duplicate manifest file found at:`, filename);
    } else {
      console.log("Manifest file found at: ", filename);
      this.manifestFound = true;
    }

    if (filename === "manifest.js") {
      const fullPath = path.resolve(
        this.currentDir,
        path.join(this.srcDir, filename)
      );
      const obj = require(fullPath);
      console.log(obj);
      return Buffer.from(JSON.stringify(obj, null, 2), "utf8");
    } else {
      return contents;
    }
  }
};
