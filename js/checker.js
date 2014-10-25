(function(exports) {

  var picture = navigator.getDeviceStorage('pictures');

  exports.getFilesToSync = function(done) {
    var lastSync = localStorage.lastSync || 0;
    var cursor = picture.enumerate();
    var files = [];

    cursor.onsuccess = function () {
      var file = this.result;
      var shouldSync = file && file.lastModified > lastSync;
      if (shouldSync) files.push(file);
      if (this.done) done(files);
      else this.continue();
    };

    cursor.onerror = function () { console.warn('No file found: ' + this.error); };
  };

  exports.getFilesToSync(function(files) {
    console.log('files', files);
  });

})(window);
