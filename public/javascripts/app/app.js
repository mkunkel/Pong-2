/* global _, getValue, createjs, sendAjaxRequest, document, window, io */



$(document).ready(initialize);

var socket;
var player = {};
var color;
var game;

var GameFactory = function() {
  var stage = {};
  var stageWidth = 1000;
  var stageHeight = 500;
  var paddleWidth = 25;
  var paddles = [];
  var heights = [100, 100];
  var velocities = [0,0];
  var rightX = parseInt($('#gameCanvas').attr('width'), 10) - paddleWidth;
  var ballVelocity = {};


  var ball = {};
  // debugger;
  //Create the game object to be initialized and returned
  var self = {
    'init' : function(stageId) {
      //Create a stage by getting a reference to the canvas
      //Stage variable is in closure scope
      stage = new createjs.Stage(stageId);

      //Create a Shape DisplayObject.  Make it a method like start
      ball = new createjs.Shape();
      ball.graphics.beginFill('red').drawCircle(0, 0, 10);
      paddles[0] = new createjs.Shape();
      paddles[0].graphics.beginFill('blue').drawRect(0, 0, paddleWidth, heights[0]);
      paddles[1] = new createjs.Shape();
      paddles[1].graphics.beginFill('blue').drawRect(rightX, 0, paddleWidth, heights[1]);
      paddles[0].y = paddles[1].y = 200;
      //Set position of Shape instance.
      ball.x = ball.y = 50;
      ball.radius = 10;
       //Add Shape instance to stage display list.
      stage.addChild(ball, paddles[0], paddles[1]);
      stage.update();
    },

      // set the stage!
    'start' : function() {
      // reset ball to [0,0,40] .. or whatever the default is
      // set score to zero, whatever else you need to do
      // Update stage will render next frame
      createjs.Ticker.addEventListener('tick', self.update);

      // stage.update();
      socket.emit('startball', {game: game});
    }, //end of start()

      //handle your keypress!
    'keyDown' : function(e) {
      //handle your keypress here

      switch (e.which) {
        case 38: // UP
          if(velocities[player.index] !== -5) {
            velocities[player.index] = -5;
            self.emitPaddles();
          }
          break;
        case 40: // DOWN
          if (velocities[player.index] !== 5) {
            velocities[player.index] = 5;
            self.emitPaddles();
          }
      }
    },
    'keyUp' : function(e) {
      if (e.which === 38 || e.which === 40) {
        // console.log(e.which);
        if (velocities[player.index]) {
          velocities[player.index] = 0;
          self.emitPaddles();
        }
      }
      // console.log(paddles[0]);
    },
    'emitPaddles' : function() {
      var paddles = [];
      var opponent = player.index === 0 ? 1 : 0;
      paddles[player.index] = velocities[player.index];
      paddles[opponent] = null;
      socket.emit('movepaddle', {game: game, paddles: paddles});
    },
    'stayInBounds': function(test, min, max) {
      return Math.min(Math.max(test, min), max);
    },
    'newBall' : function(x, y) {
      ball.x = stageWidth / 2;
      ball.y = stageHeight / 2;
      ballVelocity.x = x;
      ballVelocity.y = y;
    },
    'checkCollision' : function(ball, paddle, paddleHeight) {
      if(ball.y <= paddle.y + paddleHeight && ball.y >= paddle.y) {
        console.log('hit');
        ballVelocity.x *= -1;
      }
    },
    'updatePaddles' : function(paddles) {
      if(paddles[0] !== null) {velocities[0] = paddles[0];}
      if(paddles[1] !== null) {velocities[1] = paddles[1];}
    },
    'update' : function() {



      // REMOVE THIS LINE WHEN MOVING TO TWO PLAYER ENVIRONMENT
      // rightVelocity = leftVelocity;
      // REMOVE THIS LINE WHEN MOVING TO TWO PLAYER ENVIRONMENT
      // console.log(ball.x);
      if (ball.y <= ball.radius || ball.y >= stageHeight - ball.radius) {ballVelocity.y *= -1;}
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;
      if (ball.x - ball.radius <= paddleWidth) {self.checkCollision(ball, paddles[0], heights[0]);}
      if (ball.x + ball.radius >= stageWidth - paddleWidth) {self.checkCollision(ball, paddles[1], heights[1]);}
      paddles[0].y = self.stayInBounds(paddles[0].y + velocities[0], 0, stageHeight - heights[0]);
      paddles[1].y = self.stayInBounds(paddles[1].y + velocities[1], 0, stageHeight - heights[1]);
      // console.log(paddles[0].y);
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
  if ($('#authenticationButton').hasClass('alert')) {player.name = $('#authenticationButton').text();}

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
  socket.emit('startgame', {game:game, player:player.name});
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

  socket.on('updatepaddles', function(data){
    game.updatePaddles(data.paddles);
  });

  socket.on('newball', function(data) {
    console.log(data);
    game.newBall(data.x, data.y);
  });

  //get our game obj
  var game = GameFactory();
  game.init('gameCanvas');
  //set up callbacks related to the game
  $('#startGame').on('click', submitGame);
  $('body').on('keydown', game.keyDown);
  $('body').on('keyup', game.keyUp);

  socket.on('playerjoined', function(data){
    console.log(data);
    $('#newGameForm').addClass('hidden');
    if (data.players.length === 1) {
      $('#notice').removeClass('hidden').children('span').text('Waiting on second player...');
    } else {
      // console.log(data);
      player.index = _.findIndex(data.players, {'name': player.name});
      $('#notice').addClass('hidden');
      $('#gameContainer').removeClass('hidden');
      game.start();
    }

  });

}

function socketConnected(data){
  console.log(data);
}

