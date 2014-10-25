/* global toArrayBuffer */

(function(exports) {

  var actionButton;
  var access_token = null;
  var clientId = 'dbkxce5hlr38ryn';

  function init(elementId) {
    actionButton = document.getElementById(elementId);
    if (!actionButton) {
      console.error('Cannot find dropbox button');
      return;
    }

    actionButton.addEventListener('click', handleAction);
    access_token = localStorage.dropboxToken || null;

    updateUI();
  }

  function updateUI() {
    actionButton.textContent = access_token === null ? 'Login to Dropbox' :
     'Logout from Dropbox';
  }

  function handleAction(evt) {
    if (access_token) {
      logout();
    } else {
      login();
    }
  }

  function logout() {
    access_token = null;
    delete localStorage.dropboxToken;

    updateUI();
  }

  function login() {
    var url = 'https://www.dropbox.com/1/oauth2/authorize?response_type=token&redirect_uri=http://localhost/firefoxos-media-uploader&client_id=' + clientId;
    var dpWindow = window.open(url);
    var timer = window.setInterval(function() {
      if (dpWindow && dpWindow.closed) {
        access_token = localStorage.dropboxToken;
        clearInterval(timer);
        updateUI();
      }
    }, 500);
  }

  function upload(file) {
    if (!access_token) {
      return;
    }

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
    init: init,
    upload: upload
  };
})(window);