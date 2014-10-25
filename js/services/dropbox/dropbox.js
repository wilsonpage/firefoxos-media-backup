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
var actionButton;

function init(elementId) {
  actionButton = document.getElementById(elementId);
  if (!actionButton) {
    console.error('Cannot find dropbox button');
    return;
  }

  actionButton.addEventListener('click', handleAction);
  access_token = localStorage.dropboxToken;

  updateUI();
}

function updateUI() {
  actionButton.textContent = access_token === null ? 'Login to Dropbox' :
   'Logout from Dropbox';
  debug('button updated: %s', actionButton.textContent);
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
    debug('window closed check');
    if (dpWindow.closed) {
      debug('window was closed');
      access_token = localStorage.dropboxToken;
      clearInterval(timer);
      updateUI();
    }
  }, 500);

  debug('login window opened');
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
  upload: upload
};

});