/* global _, getValue, createjs, sendAjaxRequest, setTimeout, document, window, io */

$(document).ready(initialize);

var socket;
var player = {};
var game;


function initialize(){
  $(document).foundation();
  initializeSocketIO();
  player.id = $('#up').data('id');
  $('#up').on('mousedown', function(){clickPaddleDirection(-5);});
  $('#up').on('mouseup', function(){clickPaddleDirection(0);});
  $('#down').on('mousedown', function(){clickPaddleDirection(5);});
  $('#down').on('mouseup', function(){clickPaddleDirection(0);});
}

function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';
  socket = io.connect(url);
  socket.on('connected', socketConnected);
  socket.on('playerjoined', socketPlayerJoined);

}

function clickPaddleDirection(velocity) {
  var tempPaddles = [];
  var opponent = player.index === 0 ? 1 : 0;
  tempPaddles[player.index] = velocity;
  tempPaddles[opponent] = null;
  socket.emit('movepaddle', {game: game.name, paddles: tempPaddles});
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
