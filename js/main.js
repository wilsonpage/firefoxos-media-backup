
requirejs.config({
  baseUrl: 'js',

  paths: {
    'debug': '../bower_components/debug/index'
  }
});

require(['app']);
