define(function(require, exports, module) {
'use strict';

var picture = navigator.getDeviceStorage('pictures');

module.exports = function(since, done) {
  var lastBackup = since || 0;
  var cursor = picture.enumerate();
  var files = [];

  cursor.onsuccess = function () {
    var file = this.result;
    var shouldSync = file && file.lastModified > lastBackup;
    if (shouldSync) files.push(file);
    if (this.done) done(files);
    else this.continue();
  };

  cursor.onerror = function () { console.warn('No file found: ' + this.error); };
};

});
