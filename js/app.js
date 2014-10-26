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
  this.removeJob = this.removeJob.bind(this);
  this.flushQueue = this.flushQueue.bind(this);
  this.processJobs = this.processJobs.bind(this);
  this.onPictureChange = this.onPictureChange.bind(this);
  this.storage = { pictures: navigator.getDeviceStorage('pictures') };
  this.storage.pictures.addEventListener('change', this.onPictureChange);
  this.services = {};
  this.setupServices();
  this.queue = [];
  this.failed = [];

  this.queueNewPictures()
    .then(this.flushQueue);
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

App.prototype.addFile = function(param) {
  var filepath = param instanceof File ? param.name : param;
  for (var name in this.services) {
    debug('added %s job for %s', name, filepath);
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
    var self = this;

    debug('executing job: %s', name);
    this.storage.pictures.get(job.filepath)
      .then(service.upload)
      .then(function() {
        debug('succeed to %s', name);
        resolve(job);
      })

      .catch(function() {
        debug('failed to %s', name);
        self.failed.push(job);
        resolve(job);
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
  var lastSync = this.getLastSync();
  var self = this;
  return getNewPictures(lastSync).then(function(files) {
    debug('got new pictures', files);
    files.forEach(self.addFile);
    self.setLastSync(Date.now());
  });
};

App.prototype.getLastSync = function() {
  return Number(localStorage.lastSync);
};

App.prototype.setLastSync = function(value) {
  localStorage.lastSync = value;
};

App.prototype.processJobs = function() {
  debug('process %s jobs', this.queue.length);
  var queue = this.queue;
  var self = this;

  return queue.reduce(function(last, job, i) {
    return last.then(function() {
      return self.executeJob(job)
        .then(self.removeJob);
    });
  }, Promise.resolve());
};

App.prototype.removeJob = function(job) {
  this.queue.splice(this.queue.indexOf(job), 1);
};

App.prototype.notify = function(file) {
  var mbs = file.size / (1024 * 1024);
  var body = mbs.toFixed(2) + 'MB';
  var notification = new Notification('File uploaded', { body: body });
  debug('notify', notification);
};

});
