define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var getNewPictures = require('lib/get-new-pictures');
var services = require('services/index');
var debug = require('debug')('app');
var runEveryMinutes = 6 * 60;

function setupAlarms() {
  return new Promise(function(resolve, reject) {
    var req = navigator.mozAlarms.getAll();
    req.onsuccess = function() {
      this.result.forEach(function(alarm) {
        navigator.mozAlarms.remove(alarm);
      });

      // Each 6 hours
      var nextTick = new Date(Date.now() + 60000 * runEveryMinutes);

      debug('Setting up alarm for %s', nextTick);
      var setAlarmReq = navigator.mozAlarms.add(nextTick,
       'ignoreTimezone', {});
      setAlarmReq.onsuccess = resolve;
      setAlarmReq.onerror = reject;
    };
    req.onerror = reject;
  });
}

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

  setupAlarms();

  this.queueNewPictures()
    .then(this.flushQueue)
    .catch(debug);
}

App.prototype.setupServices = function() {
  var self = this;
  services.forEach(function(Service) {
    debug('Setting up service %s', Service.prototype.name);
    var service = new Service();
    this.services[service.name] = service;
  }, this);
};

App.prototype.onPictureChange = function(e) {
  if (e.reason !== 'created') return;
  debug('picture created: %s', e.path);
  this.addFile(e.path);
  this.flushQueue().catch(debug);
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
      .then(service.upload.bind(service))
      .then(function(file) {
        debug('succeed to %s', name);
        job.file = file;
        resolve(job);
      })

      .catch(function(err) {
        debug('failed to %s: %s', name, err);
        if (err === 'xhr') self.failed.push(job);
        resolve(job);
      });
  }.bind(this));
};

App.prototype.online = function() {
  return navigator.onLine;
};

App.prototype.flushQueue = function() {
  return new Promise(function(resolve, reject) {
    if (this.flushing) return reject('flush in progress');
    if (!this.online()) return reject('not online');

    debug('flushing %s jobs', this.queue.length);

    this.flushing = true;
    var length = this.queue.length;
    var self = this;

    this.processJobs()
      .then(function(successful) {
        debug('queue flushed', successful);
        self.flushing = false;
        self.notify(successful);
        self.setLastSync(Date.now());
        self.onFinished();
        resolve();
      });
  }.bind(this));
};

App.prototype.queueNewPictures = function() {
  var lastSync = this.getLastSync();
  var self = this;

  return getNewPictures(lastSync).then(function(files) {
    debug('got new pictures', files);
    files.forEach(self.addFile);
  });
};

App.prototype.getLastSync = function() {
  return Number(localStorage.lastSync);
};

App.prototype.setLastSync = function(value) {
  debug('set last sync: value', value);
  localStorage.lastSync = value;
};

App.prototype.onFinished = function() {
  if (App.prototype.startedByAlarm) {
    debug('closing app cause the app was open via alarm');
    window.close();
  }
}

App.prototype.processJobs = function() {
  return new Promise(function(resolve, reject) {
    debug('process %s jobs', this.queue.length);

    var queue = this.queue;
    var successful = [];
    var self = this;
    var files = {};

    queue.reduce(function(last, job, i) {
      return last.then(function() {
        return self.executeJob(job).then(function() {
          if (!files[job.filepath]) {
            files[job.filepath] = true;
            successful.push(job);
          }
        });
      });
    }, Promise.resolve()).then(function() {
      resolve(successful);
    });
  }.bind(this));
};

App.prototype.removeJob = function(job) {
  this.queue.splice(this.queue.indexOf(job), 1);
};

App.prototype.notify = function(jobs) {
  var length = jobs && jobs.length;
  if (!length) return;
  var files = 'File' + (length > 1 ? 's' : '');
  var size = jobs.reduce(function(prev, job) { return prev + job.file.size; }, 0);
  var mbs = size / (1024 * 1024);
  var body = mbs.toFixed(2) + 'MB';
  var notification = new Notification(length + ' ' + files +  ' uploaded', { body: body });
  debug('notify', notification);
};

navigator.mozSetMessageHandler("alarm", function (mozAlarm) {
  App.prototype.startedByAlarm = true;
});

});
