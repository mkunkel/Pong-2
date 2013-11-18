/* global _, getValue, createjs, sendAjaxRequest, document, window, io */



$(document).ready(initialize);

var socket;
var player;
var color;
var game;

var GameFactory = function() {
  var stage = {};
  var leftPaddle = {};
  var leftY = 0;
  var leftVelocity = 0;

  var circle = {};
  //Create the game object to be initialized and returned
  var self = {
    'init' : function(stageId) {
      //Create a stage by getting a reference to the canvas
      //Stage variable is in closure scope
      stage = new createjs.Stage(stageId);

      //Create a Shape DisplayObject.  Make it a method like start
      circle = new createjs.Shape();
      circle.graphics.beginFill('red').drawCircle(0, 0, 10);
      leftPaddle = new createjs.Shape();
      leftPaddle.graphics.beginFill('blue').drawRect(0, leftY, 25, 100);
      //Set position of Shape instance.
      circle.x = circle.y = 50;
       //Add Shape instance to stage display list.
      stage.addChild(circle, leftPaddle);
      stage.update();
    },

      // set the stage!
    'start' : function() {
      // reset circle to [0,0,40] .. or whatever the default is
      // set score to zero, whatever else you need to do
      // Update stage will render next frame
      createjs.Ticker.addEventListener('tick', self.update);
      stage.update();
    }, //end of start()

      //handle your keypress!
    'keyDown' : function(e) {
      //handle your keypress here
      switch (e.which) {
        case 38: // UP
          leftVelocity = -5;
          break;
        case 40: // DOWN
          leftVelocity = 5;
      }
    },
    'keyUp' : function(e) {
      leftVelocity = 0;
    },
    'update' : function() {
      leftPaddle.y += leftVelocity;
      stage.update();
    }
  };

  return self;
};  //end of returned game object




function initialize(){

  $(document).foundation();
  initializeSocketIO();
  $('#authenticationButton').on('click', clickAuth);
  $('#login').on('click', clickLogin);
  $('#register').on('click', clickRegister);

  //get our game obj
  var game = GameFactory();
  game.init('gameCanvas');
  //set up callbacks related to the game
  $('#gameStartButton').on('click', game.start);
  $('body').on('keydown', game.keyDown);
  $('*').on('keyup', game.keyUp);
}

function clickAuth(e) {
  if (!$(this).data('name')) {
    $('#gameForm').toggleClass('hidden');
    $('input[name=name]').focus();
  } else {
    var url = '/logout';
    sendAjaxRequest(url, {}, 'POST', 'DELETE', e, function(data){
      if (data.status) {
        redirect();
      }
    });
  }
  e.preventDefault();
}

function clickLogin(e) {
  $('#err').text(' ');
  var url = '/login';
  var data = $('#gameForm').serialize();
  console.log(data);
  sendAjaxRequest(url, data, 'POST', 'PUT', e, function(data){
    processLogin(data);
  });
}

function clickRegister(e) {
  $('#err').text(' ');
  var url = '/';
  var data = $('#gameForm').serialize();
  console.log(data);
  sendAjaxRequest(url, data, 'POST', null, e, function(data){
    handleRegistration(data);
  });
}

function handleRegistration(data) {
  if (data.status === 'ok') {
    $('input').val('');
    $('#authentication').toggleClass('hidden');
  } else {
    $('#err').text('Error: please try again');
  }
}

function processLogin(data) {
  if (data.status === 'ok') {
    redirect();
  } else {
    $('#authentication input').val('');
    $('#authentication input[type=text]').focus();
    $('#err').text('Wrong email/password');
  }
}

function redirect() {
  window.location.href = '/';
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