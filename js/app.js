
// (function() {

var pictures = navigator.getDeviceStorage('pictures');
var access_token = '1IYGUISlje0AAAAAAAA1Y-r8y_V0D7cFAVTpCzX4XgSniAo75OD2DUJ1VQC2rWom';

pictures.addEventListener('change', onChange);

function onChange(e) {
  if (e.reason === 'created') { onCreated(e); }
}


function onCreated(e) {
  pictures.get(e.path).then(function(file) {
    console.log(file);
    var image = document.createElement('img');
    image.src = URL.createObjectURL(file);
    document.body.appendChild(image);
    upload(file);
  });
}

// function get(path) {
//   return new Promise(function(resolve, reject) {
//     var request =
//   });
// }
//
//


function upload(file) {
  var reader = new FileReader();

  toArrayBuffer(file, function(data) {
    var request = new XMLHttpRequest({ mozSystem: true });
    var path = 'Camera Uploads/' + Date.now() + '.jpg';

    request.open('PUT', 'https://api-content.dropbox.com/1/files_put/auto/' + encodeURI(path));
    request.setRequestHeader('Authorization', 'Bearer ' + access_token);
    request.send(data);

    request.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        console.log((e.loaded / e.total) * 100);
      }
    };

    request.onload = function(e) {
      console.log('load', e);
    };

    request.onerror = function(e) {
      console.log('error', e);
    };
  });
}

function toArrayBuffer(file, done) {
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function() {
    console.log(reader.result);
    done(reader.result);
  };
}

function getAccountInfo(access_token) {
  var request = new XMLHttpRequest({ mozSystem: true });

  request.onerror = function(e) {
    console.log('error', e);
  };

  request.onload = function(e) {
    console.log('load', JSON.parse(request.response));
  };

  request.open('get', 'https://api.dropbox.com/1/account/info');
  request.setRequestHeader('Authorization', 'Bearer ' + access_token);
  request.send();
}





// })();
//