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
    dropbox.upload(file);
  });
}

dropbox.init('dropbox');

});
