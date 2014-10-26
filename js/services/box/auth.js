var params = document.location.hash.substr(1).split('&');
params.forEach(function(param) {
  var keyValue = param.split('=');
  if (keyValue.length === 2) {
    if (keyValue[0] === 'access_token') {
      localStorage.dropboxToken = keyValue[1];
    }
  }
});
window.close();