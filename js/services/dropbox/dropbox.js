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

/**
 * Exports
 */

module.exports = Dropbox;

function Dropbox() {
  this.setupUI();
}

Dropbox.prototype.name = 'Dropbox';

Dropbox.prototype.loggedIn = function() {
  return !!this.getToken();
};

Dropbox.prototype.getToken = function() {
  return localStorage.dropboxToken;
};

Dropbox.prototype.setToken = function(token) {
  localStorage.dropboxToken = token;
  debug('token set: %s', token);
};

Dropbox.prototype.setupUI = function() {
  this.button = document.getElementById('dropbox');
  if (!this.button) return console.error('Cannot find dropbox button');
  this.button.addEventListener('click', this.onButtonClick.bind(this));
  this.updateUI();
  debug('UI setup');
};

Dropbox.prototype.updateUI = function() {
  if (!this.button) return;

  var text = this.loggedIn()
    ? 'Logout from Dropbox'
    : 'Login to Dropbox';

  this.button.textContent = text;
  debug('button updated: %s', text);
};

Dropbox.prototype.onButtonClick = function() {
  debug('button click');
  if (this.loggedIn()) this.logout();
  else this.login();
};

Dropbox.prototype.login  =function() {
  var url = 'https://www.dropbox.com/1/oauth2/authorize?response_type=token&redirect_uri=http://localhost/firefoxos-media-uploader&client_id=' + clientId + '&state=' + Date.now();
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

Dropbox.prototype.logout = function() {
  delete localStorage.dropboxToken;
  this.updateUI();
};

Dropbox.prototype.upload = function(file) {
  return new Promise(function(resolve, reject) {
    debug('upload', file);

    if (!this.loggedIn()) return reject('not logged in');

    // return setTimeout(resolve, 300);

    toArrayBuffer(file, function(data) {
      var request = new XMLHttpRequest({ mozSystem: true });
      var path = 'Camera Uploads/' + Date.now() + '.jpg';

      request.open('PUT', 'https://api-content.dropbox.com/1/files_put/auto/' + encodeURI(path));
      request.setRequestHeader('Authorization', 'Bearer ' + this.getToken());
      request.send(data);
      debug('request opened');

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
        debug('request errored', e);
        reject('error', e);
      };
    }.bind(this));
  }.bind(this));
};

function toArrayBuffer(file, done) {
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function() { done(reader.result); };
}

});
