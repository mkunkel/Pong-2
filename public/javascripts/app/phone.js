/* global _, gyro, getValue, createjs, sendAjaxRequest, setTimeout, document, window, io */

$(document).ready(initialize);

var socket;
var player = {};
var game;


function initialize(){
  $(document).foundation();
  initializeSocketIO();
  player.id = $('#up').data('id');
  $('html').on('touchstart', function(e){e.preventDefault();});
  $('#up').on('touchstart', function(e){clickPaddleDirection(-5, e);});
  $('#up').on('touchend', function(e){clickPaddleDirection(0, e);});
  $('#down').on('touchstart', function(e){clickPaddleDirection(5, e);});
  $('#down').on('touchend', function(e){clickPaddleDirection(0, e);});
  gyro.startTracking(function(o) {
    $('#x').text(o.x.toFixed(2));
    $('#y').text(o.y.toFixed(2));
    $('#z').text(o.z.toFixed(2));
    // o.x, o.y, o.z for accelerometer
    // o.alpha, o.beta, o.gamma for gyro
  });
}

function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';
  socket = io.connect(url);
  socket.on('connected', socketConnected);
  socket.on('playerjoined', socketPlayerJoined);

}

function clickPaddleDirection(velocity, e) {
  var tempPaddles = [];
  var opponent = player.index === 0 ? 1 : 0;
  tempPaddles[player.index] = velocity;
  tempPaddles[opponent] = null;
  socket.emit('movepaddle', {game: game.name, paddles: tempPaddles});
  e.preventDefault();
}

function socketPlayerJoined(data) {
  // receiving {game:game, players:game.players}
  console.log('playerjoined');
  game = data.game;
  // debugger;
  player.index = _.findIndex(data.players, {'_id': player.id});
  // alert(player.index);
}

function socketConnected(data){
  socket.emit('phoneid', {phoneId: socket.socket.sessionid, playerId: player.id});
}
