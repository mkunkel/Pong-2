/* global _, getValue, createjs, sendAjaxRequest, document, window, io */



$(document).ready(initialize);

var socket;
var player;
var color;
var game;

var GameFactory = function() {
  var stage = {};
  var paddleWidth = 25;
  var leftPaddle = {};
  var leftY = 0;
  var leftVelocity = 0;
  var rightPaddle = {};
  var rightY = 0;
  var rightX = parseInt($('#gameCanvas').attr('width'), 10) - paddleWidth;
  var rightVelocity = 0;


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
      leftPaddle.graphics.beginFill('blue').drawRect(0, leftY, paddleWidth, 100);
      rightPaddle = new createjs.Shape();
      rightPaddle.graphics.beginFill('blue').drawRect(rightX, rightY, paddleWidth, 100);
      //Set position of Shape instance.
      circle.x = circle.y = 50;
       //Add Shape instance to stage display list.
      stage.addChild(circle, leftPaddle, rightPaddle);
      stage.update();
    },

      // set the stage!
    'start' : function() {
      // reset circle to [0,0,40] .. or whatever the default is
      // set score to zero, whatever else you need to do
      // Update stage will render next frame
      // createjs.Ticker.addEventListener('tick', self.update);
      // stage.update();
      // socket.emit('')
    }, //end of start()

      //handle your keypress!
    'keyDown' : function(e) {
      //handle your keypress here
      switch (e.which) {
        case 38: // UP
          if(leftVelocity !== -5) {
            leftVelocity = -5;
            socket.emit('movepaddle', {game: game, l:leftVelocity});
          }
          break;
        case 40: // DOWN
          if (leftVelocity !== 5) {
            leftVelocity = 5;
            socket.emit('movepaddle', {game: game, l:leftVelocity});
          }
      }
    },
    'keyUp' : function(e) {
      if (e.which === 38 || e.which === 40) {
        // console.log(e.which);
        if (leftVelocity) {
          leftVelocity = 0;
          socket.emit('movepaddle', {game: game, l:leftVelocity});
        }
      }
      // console.log(leftPaddle);
    },
    'update' : function(l, r, b) {
      leftPaddle.y = l.y;
      rightPaddle.y = r.y;
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
  if ($('#authenticationButton').hasClass('alert')) {player = $('#authenticationButton').text();}

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

function submitGame(e){
  game = $('#newGameForm input[name=game]').val();
  socket.emit('startgame', {game:game, player:player});
  e.preventDefault();
}

function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';

  socket = io.connect(url);
  socket.on('connected', socketConnected);

  //main draw function
  socket.on('gameupdate', function(data){
    game.update(data.l, data.r, data.b);
  });

  //get our game obj
  var game = GameFactory();
  game.init('gameCanvas');
  //set up callbacks related to the game
  $('#startGame').on('click', submitGame);
  $('body').on('keydown', game.keyDown);
  $('body').on('keyup', game.keyUp);

  socket.on('playerjoined', socketPlayerJoined);

}


function socketPlayerJoined(data) {
  $('#newGameForm').addClass('hidden');
  if (data.players.length === 1) {
    $('#notice').removeClass('hidden').children('span').text('Waiting on second player...');
  } else {
    // console.log(data);
    $('#notice').addClass('hidden');
    $('#gameContainer').removeClass('hidden');
  }

}



function socketConnected(data){
  console.log(data);
}

