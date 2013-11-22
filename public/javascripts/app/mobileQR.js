function generateQR(userName) {
  var baseUrl = 'http://localhost:3000/';
  var QRbaseUrl = 'https://chart.googleapis.com/chart';
  $.get(QRbaseUrl, {
      ch1: baseUrl + userName,
      cht: 'qr',
      chs: '256x256'
    }, 'json', function(data){console.log(this);});
}

function injectQR(data) {
  // debugger;
}

