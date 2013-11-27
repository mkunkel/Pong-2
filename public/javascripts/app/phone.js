/* global _, gyro, getValue, createjs, sendAjaxRequest, setTimeout, document, window, io */

$(document).ready(initialize);

var socket;
var player = {};
var game;
var paddleVelocity;
var orient;
var axis;
var zero = {};
zero.x = 0;
zero.y = 0;
zero.z = 0;

function initialize(){
  $(document).foundation();
  initializeSocketIO();
  player.id = $('#up').data('id');
  // $('html:not(input)').on('touchstart', function(e){e.preventDefault();});
  $('#up').on('touchstart', function(e){changeVelocity(-5, e);});
  $('#up').on('touchend', function(e){changeVelocity(0, e);});
  $('#down').on('touchstart', function(e){changeVelocity(5, e);});
  $('#down').on('touchend', function(e){changeVelocity(0, e);});
}

function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';
  socket = io.connect(url);
  socket.on('connected', socketConnected);
  socket.on('playerjoined', socketPlayerJoined);

}

function changeVelocity(velocity, e) {
  console.log(e);
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
  gyro.startTracking(function(o) {
    $('#x').text((o.x - zero.x).toFixed(2));
    $('#y').text((o.y - zero.y).toFixed(2));
    $('#z').text((o.z - zero.z).toFixed(2));
    // socket.emit('log', {point:'before initial', orientation: orientation});
    // if (!orient) {orient = 'portrait';}

    // socket.emit('log', {point:'before orientation set', orientation: orient});
    // set orientation
    // if (orient === 'portrait' && o.y < 3.5 && o.z < 6) {
    //   orient = 'landscape';
    //   axis = 'x';
    // } else if (orient === 'landscape' && o.y > 8.6) {
    //   orient = 'portrait';
    //   axis = 'z';
    // }

    // if(o[axis] > 2 && paddleVelocity !== -5 && $('#position').text() !== 'up') {
    //   $('#position').text('up');
    //   paddleVelocity = -5;
    // } else if(o[axis] < -2 && paddleVelocity !== 5 && $('#position').text() !== 'down') {
    //   $('#position').text('down');
    //   paddleVelocity = 5;
    // } else if (paddleVelocity !== 0 && $('#position').text() !== 'stop') {
    //   $('#position').text('stop');
    //   paddleVelocity = 0;
    // }
    if ($('input:checked').length) {
      if(o.y < -3 && paddleVelocity !== 5) {
        paddleVelocity = 5;
        changeVelocity(paddleVelocity);
      } else if(o.y > 3 && paddleVelocity !== -5) {
        paddleVelocity = -5;
        changeVelocity(paddleVelocity);
      } else if(o.y > -3 && o.y < 3 && paddleVelocity !== 0) {
        paddleVelocity = 0;
        changeVelocity(paddleVelocity);
      }
    }
    // socket.emit('log', {point:'after orientation set', orientation: orient});
    // if
    $('#orientation').text(orient);
    // o.x, o.y, o.z for accelerometer
    // o.alpha, o.beta, o.gamma for gyro
  });
}
