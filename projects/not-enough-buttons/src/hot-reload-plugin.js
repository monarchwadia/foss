const fs = require("fs");
const { basename } = require("path");
const path = require("path");

const hotReload = (options = {}) => {
  const { targets = [], hook = "buildEnd" } = options;

  return {
    name: "hot-reload",
    [hook]: () => {
      targets.forEach(async (target) => {
        fs.mkdirSync(path.join(target.dest, "neb-scripts"), {
          recursive: true,
        });
        const destPath = path.join(target.dest, "neb-scripts", "hot-reload.js");
        fs.writeFileSync(
          destPath,
          `
// All credit goes to https://github.com/xpl/crx-hotreload
const filesInDirectory = dir => new Promise (resolve =>
  dir.createReader ().readEntries (entries =>
      Promise.all (entries.filter (e => e.name[0] !== '.').map (e =>
          e.isDirectory
              ? filesInDirectory (e)
              : new Promise (resolve => e.file (resolve))
      ))
      .then (files => [].concat (...files))
      .then (resolve)
  )
)

const timestampForFilesInDirectory = dir =>
      filesInDirectory (dir).then (files =>
          files.map (f => f.name + f.lastModifiedDate).join ())

const watchChanges = (dir, lastTimestamp) => {
  timestampForFilesInDirectory (dir).then (timestamp => {
      if (!lastTimestamp || (lastTimestamp === timestamp)) {
          setTimeout (() => watchChanges (dir, timestamp), 1000) // retry after 1s
      } else {
          chrome.runtime.reload ()
      }
  })
}

chrome.management.getSelf (self => {
  if (self.installType === 'development') {
      chrome.runtime.getPackageDirectoryEntry (dir => watchChanges (dir))
      chrome.tabs.query ({ active: true, lastFocusedWindow: true }, tabs => { // NB: see https://github.com/xpl/crx-hotreload/issues/5
          if (tabs[0]) {
              chrome.tabs.reload (tabs[0].id)
          }
      })
  }
})
`
        );
      });
    },
  };
};

module.exports = hotReload;
