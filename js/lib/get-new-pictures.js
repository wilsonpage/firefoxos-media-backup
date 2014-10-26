define(function(require, exports, module) {
'use strict';

var debug = require('debug')('get-new-pictures');
var picture = navigator.getDeviceStorage('pictures');

module.exports = function(since, done) {
  return new Promise(function(resolve, reject) {
    debug('get pictures since: %s', since);
    since = Number(since || 0);

    var cursor = picture.enumerate();
    var files = [];

    cursor.onsuccess = function () {
      if (this.done) return resolve(files);
      var file = this.result;
      var isNew = Number(file.lastModified) > since;
      debug(Number(file.lastModified) - since);
      var shouldSync = isNew && !hidden(file);
      if (shouldSync) files.push(file);
      debug('file: %s, isNew: %s, shouldSync: %s', file.name, isNew, shouldSync, file.lastModified);
      this.continue();
    };

    cursor.onerror = function () { reject(this.error); };
  });
};

function hidden(file) {
  if (!file) return;
  var filename = nameFromPath(file.name);
  return filename[0] === '.';
}

function nameFromPath(path) {
  var lastSlash = path.lastIndexOf('/') + 1;
  return path.slice(lastSlash);
}

});
