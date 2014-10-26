define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('service:box');

/**
 * Locals
 */

var clientId = 'dbkxce5hlr38ryn';

/**
 * Exports
 */

module.exports = Box;

function Box() {
  // this.setupUI();
}

Box.prototype.name = 'Box';

Box.prototype.loggedIn = function() {
  return !!this.getToken();
};

Box.prototype.getToken = function() {
  return localStorage.dropboxToken;
};

Box.prototype.setToken = function(token) {
  localStorage.dropboxToken = token;
  debug('token set: %s', token);
};

Box.prototype.setupUI = function() {
  this.button = document.getElementById('Box');
  if (!this.button) return console.error('Cannot find Box button');
  this.button.addEventListener('click', this.onButtonClick);
  this.updateUI();
  debug('UI setup');
};

Box.prototype.updateUI = function() {
  if (!this.button) return;

  var text = this.loggedIn()
    ? 'Logout from Box'
    : 'Login to Box';

  this.button.textContent = text;
  debug('button updated: %s', text);
};

Box.prototype.onButtonClick = function() {
  debug('button click');
  if (this.loggedIn()) this.logout();
  else this.login();
};

Box.prototype.login  =function() {
  var url = 'https://www.Box.com/1/oauth2/authorize?response_type=token&redirect_uri=http://localhost/firefoxos-media-uploader&client_id=' + clientId + '&state=' + Date.now();
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
};

Box.prototype.logout = function() {
  delete localStorage.dropboxToken;
  this.updateUI();
};

Box.prototype.upload = function(file) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, 500);
  });
};

function toArrayBuffer(file, done) {
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function() { done(reader.result); };
}

});
