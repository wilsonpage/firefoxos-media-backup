define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('service:dropbox');

/**
 * Locals
 */

var clientId = 'dbkxce5hlr38ryn';
var access_token = null;
var actionButton = null;

function init() {
  access_token = localStorage.dropboxToken;
}

function startUI(elementId) {
  if (actionButton !== null) {
    // UI already initialized
    return;
  }

  actionButton = document.getElementById(elementId);
  if (!actionButton) {
    console.error('Cannot find dropbox button');
    return;
  }

  init();

  actionButton.addEventListener('click', handleAction);  
  updateUI();
}

function updateUI() {
  actionButton.textContent = access_token ? 'Logout from Dropbox' : 'Login to Dropbox';
  debug('button updated: %s', actionButton.textContent, access_token ? 1 : 0);
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
  var url = 'https://www.dropbox.com/1/oauth2/authorize?response_type=token&redirect_uri=http://localhost/firefoxos-media-uploader&client_id=' + clientId + '&state=' + Date.now();
  var dpWindow = window.open(url);
  var timer = window.setInterval(function() {
    debug('window closed check');
    if (dpWindow && dpWindow.closed) {
      debug('window was closed');
      init();
      clearInterval(timer);
      updateUI();
    }
  }, 500);

  debug('login window opened: %s', url);
}

function upload(file) {
  return new Promise(function(resolve, reject) {
    if (!access_token) return reject('not logged in');

    toArrayBuffer(file, function(data) {
      var request = new XMLHttpRequest({ mozSystem: true });
      var path = 'Camera Uploads/' + Date.now() + '.jpg';

      request.open('PUT', 'https://api-content.dropbox.com/1/files_put/auto/' + encodeURI(path));
      request.setRequestHeader('Authorization', 'Bearer ' + access_token);
      request.send(data);

      request.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          debug('upload progress: %s', (e.loaded / e.total) * 100);
        }
      };

      request.onload = function(e) {
        debug('request done');
        resolve(file);
      };

      request.onerror = function(e) {
        debug('request errored');
        reject('error', e);
      };
    });
  });
}

function toArrayBuffer(file, done) {
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function() {
    console.log(reader.result);
    done(reader.result);
  };
}

module.exports = {
  init: init,
  startUI: startUI,
  upload: upload
};

});
