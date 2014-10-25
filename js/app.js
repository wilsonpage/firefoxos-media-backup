var pictures = navigator.getDeviceStorage('pictures');

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
    window.dropbox.upload(file);
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

dropbox.init('dropbox');
