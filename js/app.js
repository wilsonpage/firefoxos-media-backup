define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var dropbox = require('services/dropbox/dropbox');
var debug = require('debug')('app');

/**
 * Locals
 */

var pictures = navigator.getDeviceStorage('pictures');

pictures.addEventListener('change', onChange);

function onChange(e) {
  if (e.reason === 'created') { onCreated(e); }
}

function onCreated(e) {
  debug('picture created: %s', e.path);
  pictures.get(e.path).then(function(file) {
    dropbox.upload(file).then(notify);
  });
}

function notify(file) {
  var mbs = file.size / (1024 * 1024);
  var body = mbs.toFixed(2) + 'MB';
  var notification = new Notification('File uploaded', { body: body });
  debug('notify', notification);
}

dropbox.startUI('dropbox');

});
