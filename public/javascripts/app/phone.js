/* global _, gyro, getValue, createjs, sendAjaxRequest, setTimeout, document, window, io */

$(document).ready(initialize);

var socket;
var player = {};
var game;
var paddleVelocity;
var orientation;
var axis;
var zero = {};
zero.x = 0;
zero.y = 0;
zero.z = 0;

function initialize(){
  $(document).foundation();
  initializeSocketIO();
  player.id = $('#up').data('id');
  $('html').on('touchstart', function(e){e.preventDefault();});
  $('#up').on('touchstart', function(e){changeVelocity(-5, e);});
  $('#up').on('touchend', function(e){changeVelocity(0, e);});
  $('#down').on('touchstart', function(e){changeVelocity(5, e);});
  $('#down').on('touchend', function(e){changeVelocity(0, e);});
  $('#calibrate').on('touchstart', calibrate);
  gyro.startTracking(function(o) {
    $('#x').text((o.x - zero.x).toFixed(2));
    $('#y').text((o.y - zero.y).toFixed(2));
    $('#z').text((o.z - zero.z).toFixed(2));
    socket.emit('log', {point:'before initial', orientation: orientation});
    if (!orientation) {orientation = o.y > 5 ? 'portrait' : 'landscape';}

    socket.emit('log', {point:'before orientation set', orientation: orientation});
    // set orientation
    if (orientation === 'portrait' && o.y < 3.5) {
      orientation = 'landscape';
      axis = 'x';
    } else if (orientation === 'landscape' && o.y > 8.6) {
      orientation = 'portrait';
      axis = 'z';
    }

    socket.emit('log', {point:'after orientation set', orientation: orientation});
    // if
    $('#orientation').text(orientation);
    // o.x, o.y, o.z for accelerometer
    // o.alpha, o.beta, o.gamma for gyro
  });
}

function calibrate() {
  var measurements = gyro.getOrientation();
  zero.x = measurements.x;
  zero.y = measurements.y;
  zero.z = measurements.z;
}

function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';
  socket = io.connect(url);
  socket.on('connected', socketConnected);
  socket.on('playerjoined', socketPlayerJoined);

}

function changeVelocity(velocity, e) {
  paddleVelocity = velocity;
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
