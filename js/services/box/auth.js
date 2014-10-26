var clientId = 'd6yiir9yqxx2s5spbcxpsjyiogfoy9bv';
var clientSecret = 'g26GvMkIOkFZhyiHCe24xC0ppW0TJyZv';
var params = document.location.search.substr(1).split('&');
params.forEach(function(param) {
  var keyValue = param.split('=');
  if (keyValue.length === 2) {
    if (keyValue[0] === 'code') {
      var code = keyValue[1];
      alert('Code: ' + code);
      var request = new XMLHttpRequest({ mozSystem: true });

      request.open('POST', 'https://api.box.com/oauth2/token');
      var data = new FormData();
      data.append('grant_type', 'authorization_code');
      data.append('code', code);
      data.append('client_id', clientId);
      data.append('client_secret', clientSecret);
      request.send(data);

      request.onload = function(e) {
        localStorage.box = request.responseText;
        window.close();
      };

      request.onerror = function(e) {
        console.log('error', e);
        window.close();
      };
    }
  }
});