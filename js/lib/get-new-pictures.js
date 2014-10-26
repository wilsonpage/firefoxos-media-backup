define(function(require, exports, module) {
'use strict';

var debug = require('debug')('get-new-pictures');
var picture = navigator.getDeviceStorage('pictures');

module.exports = function(since, done) {
  return new Promise(function(resolve, reject) {
    since = since || 0;

    var cursor = picture.enumerate();
    var files = [];

    cursor.onsuccess = function () {
      if (this.done) return resolve(files);
      var file = this.result;
      var isNew = file.lastModified > since;
      var shouldSync = isNew && !hidden(file);
      if (shouldSync) files.push(file);
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
