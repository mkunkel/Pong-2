/* global _, getValue, document, window, io */



$(document).ready(initialize);

var socket;
var player;
var color;
var game;

function initialize(){
  $(document).foundation();
  initializeSocketIO();
  $('#authenticationButton').on('click', clickAuth);
  // $('body').on('keyup', keypressMove);
}

function clickAuth() {
  $('#gameForm').toggleClass('hidden');
}



function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';

  socket = io.connect(url);
  socket.on('connected', socketConnected);
  // socket.on('playerjoined', socketPlayerJoined);

}

function socketConnected(data){
  console.log(data);
}