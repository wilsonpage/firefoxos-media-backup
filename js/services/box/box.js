define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('service:box');

/**
 * Locals
 */

var clientId = 'd6yiir9yqxx2s5spbcxpsjyiogfoy9bv';
var access_token = null;
var actionButton = null;

function init() {
  access_token = localStorage.box ? JSON.parse(localStorage.box).access_token : null;
}

function startUI(elementId) {
  if (actionButton !== null) {
    // UI already initialized
    return;
  }

  actionButton = document.getElementById(elementId);
  if (!actionButton) {
    console.error('Cannot find box button');
    return;
  }

  init();

  actionButton.addEventListener('click', handleAction);  
  updateUI();
}

function updateUI() {
  actionButton.textContent = access_token ? 'Logout from Box' : 'Login to Box';
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
  delete localStorage.box;

  updateUI();
}

function login() {
  var url = 'https://api.box.com/oauth2/authorize?response_type=code&redirect_uri=http://localhost/box&client_id=' + clientId + '&state=' + Date.now();
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
  if (!access_token) {
    return;
  }

  var request = new XMLHttpRequest({ mozSystem: true });
  var path = Date.now() + '.jpg';

  var formData = new FormData();
  formData.append('file', file, path);
  formData.append('attributes', JSON.stringify({
    'name': path,
    'parent': {
      'id': '0'
    }
  }));

  request.open('POST', 'https://upload.box.com/api/2.0/files/content');
  request.setRequestHeader('Authorization', 'Bearer ' + access_token);
  request.send(formData);

  request.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      debug('upload progress: %s', (e.loaded / e.total) * 100);
    }
  };

  request.onload = function(e) {
    console.log('load', e);
  };

  request.onerror = function(e) {
    console.log('error', e);
  };
}


module.exports = {
  init: init,
  startUI: startUI,
  upload: upload
};

});
