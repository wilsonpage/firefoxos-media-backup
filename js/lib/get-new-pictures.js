define(function(require, exports, module) {
'use strict';

var picture = navigator.getDeviceStorage('pictures');

module.exports = function(since, done) {
  return new Promise(function(resolve, reject) {
    since = since || 0;

    var cursor = picture.enumerate();
    var files = [];

    cursor.onsuccess = function () {
      var file = this.result;
      var shouldSync = file && file.lastModified > since;
      if (shouldSync) files.push(file);
      if (this.done) resolve(files);
      else this.continue();
    };

    cursor.onerror = function () { reject(this.error); };
  });
};

});
