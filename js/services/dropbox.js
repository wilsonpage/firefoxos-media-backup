/* global toArrayBuffer */

(function(exports) {

  var access_token = '1IYGUISlje0AAAAAAAA1Y-r8y_V0D7cFAVTpCzX4XgSniAo75OD2DUJ1VQC2rWom';

  function upload(file) {
    var reader = new FileReader();

    toArrayBuffer(file, function(data) {
      var request = new XMLHttpRequest({ mozSystem: true });
      var path = 'Camera Uploads/' + Date.now() + '.jpg';

      request.open('PUT', 'https://api-content.dropbox.com/1/files_put/auto/' + encodeURI(path));
      request.setRequestHeader('Authorization', 'Bearer ' + access_token);
      request.send(data);

      request.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          console.log((e.loaded / e.total) * 100);
        }
      };

      request.onload = function(e) {
        console.log('load', e);
      };

      request.onerror = function(e) {
        console.log('error', e);
      };
    });
  }

  window.dropbox = {
    upload: upload
  };
})(window);