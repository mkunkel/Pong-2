/* global _, getValue, createjs, sendAjaxRequest, setTimeout, document, window, io */

$(document).ready(initialize);

var socket;
var player = {};
var game;


function initialize(){
  $(document).foundation();
  initializeSocketIO();
  player.id = $('#up').data('id');
}

function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';
  socket = io.connect(url);
  socket.on('connected', socketConnected);
  socket.on('playerjoined', socketPlayerJoined);

}

function socketPlayerJoined(data) {
  // receiving {game:game, players:game.players}
  game = data.game;
  player.index = _.findIndex(data.players, {'id': player.id});
  alert(player.index);
}

function socketConnected(data){
  socket.emit('phoneid', {phoneId: socket.socket.sessionid, playerId: player.id});
}
