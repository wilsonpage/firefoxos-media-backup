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

module.exports = Box;

function Box() {
  this.setupUI();
}

Box.prototype.loggedIn = function() {
  debug('Am I logged in %s', !!this.getToken());
  return !!this.getToken();
};

Box.prototype.getToken = function() {
  var token = localStorage.box ?
   JSON.parse(localStorage.box).access_token :
   null;
  debug('Token is %s', token);
  this.access_token = token;

  return token;
};

Box.prototype.name = 'Box';

Box.prototype.setupUI = function() {
  if (this.button) {
    // UI already initialized
    return;
  }

  this.button = document.getElementById('box');
  if (!this.button) {
    console.error('Cannot find box button');
    return;
  }

  this.getToken();

  this.button.addEventListener('click', handleAction.bind(null, this));
  this.updateUI();
};

Box.prototype.updateUI = function() {
  this.button.textContent = this.loggedIn() ?
   'Logout from Box' :
   'Login to Box';

  debug('button updated: %s', this.button.textContent, this.loggedIn());
};

function handleAction(obj) {
  if (obj.loggedIn()) {
    obj.logout();
  } else {
    obj.login();
  }
}

Box.prototype.logout = function() {
  this.access_token = null;
  delete localStorage.box;

  this.updateUI();
};

Box.prototype.login = function() {
  var url = 'https://api.box.com/oauth2/authorize?response_type=code&redirect_uri=http://localhost/box&client_id=' + clientId + '&state=' + Date.now();
  var dpWindow = window.open(url);
  var timer = window.setInterval((function() {
    debug('window closed check');
    if (dpWindow && dpWindow.closed) {
      debug('window was closed');
      clearInterval(timer);
      this.updateUI();
    }
  }).bind(this), 500);

  debug('login window opened: %s', url);
};

Box.prototype.upload = function(file) {
  return new Promise((function(resolve, reject) {
    if (!this.getToken()) {
      return Promise.reject('not logged in box');
    }
    debug('Uploading to box');

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
    request.setRequestHeader('Authorization', 'Bearer ' + this.getToken());
    request.send(formData);

    request.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        debug('upload progress: %s', (e.loaded / e.total) * 100);
      }
    };

    request.onload = function(e) {
      debug('Upload to box ok');
      resolve();
    };

    request.onerror = function(e) {
      debug('Upload to box ko: %s', e.message);
      reject(e);
    };
  }).bind(this));
};

});
