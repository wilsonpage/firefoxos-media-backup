define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var getNewPictures = require('lib/get-new-pictures');
var services = require('services/index');
var debug = require('debug')('app');

/**
 * Locals
 */

module.exports = App;

function App() {
  this.addFile = this.addFile.bind(this);
  this.flushQueue = this.flushQueue.bind(this);
  this.processJobs = this.processJobs.bind(this);
  this.onPictureChange = this.onPictureChange.bind(this);
  this.storage = { pictures: navigator.getDeviceStorage('pictures') };
  this.storage.pictures.addEventListener('change', this.onPictureChange);
  this.services = {};
  this.setupServices();
  // this.queueNewPictures();
  this.queue = [];
  this.failed = [];
}

App.prototype.setupServices = function() {
  var self = this;
  services.forEach(function(Service) {
    var service = new Service();
    this.services[service.name] = service;
  }, this);
};

App.prototype.onPictureChange = function(e) {
  if (e.reason !== 'created') return;
  debug('picture created: %s', e.path);

  this.addFile(e.path);
  this.flushQueue().then(function() {
    debug('on picture change done');
  });
};

App.prototype.addFile = function(filepath) {
  for (var name in this.services) {
    debug('added %s job', name);
    this.queue.push({
      service: name,
      filepath: filepath
    });
  }
};

App.prototype.executeJob = function(job) {
  return new Promise(function(resolve, reject) {
    var service = this.services[job.service];
    var name = service.name;

    debug('executing job: %s', name);
    this.storage.pictures.get(job.filepath)
      .then(service.upload)
      .then(function() {
        debug('succeed to %s', name);
        resolve();
      })

      .catch(function() {
        debug('failed to %s', name);
        self.failed.push(job);
        resolve();
      });
  }.bind(this));
};

App.prototype.flushQueue = function() {
  if (this.flushing) return;
  debug('flushing %s jobs', this.queue.length);

  this.flushing = true;
  var self = this;

  return this.processJobs()
    .then(function() {
      debug('queue flushed');
      complete();
    });

  function complete() {
    self.flushing = false;
  }
};

App.prototype.queueNewPictures = function() {
  getNewPictures().then(function(files) {
    debug('got new pictures', files);
    files.forEach(this.addFile);
  }.bind(this));
};

App.prototype.processJobs = function() {
  // return new Promise(function(resolve, reject) {
    debug('process jobs');

    var last = Promise.resolve();
    var self = this;
    var job;

    while (this.queue.length) {
      job = this.queue.shift();
      last = last.then(function() {
        return self.executeJob(job);
      });
    }

    return last;
  // });
};

App.prototype.notify = function(file) {
  var mbs = file.size / (1024 * 1024);
  var body = mbs.toFixed(2) + 'MB';
  var notification = new Notification('File uploaded', { body: body });
  debug('notify', notification);
};

});
