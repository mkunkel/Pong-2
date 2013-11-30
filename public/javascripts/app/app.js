/* global _, getValue, createjs, sendAjaxRequest, setTimeout, document, window, io */




$(document).ready(initialize);

var socket;
var player = {};
var color;
var game;
var controls = 'arrows';
var upKey = 38;
var downKey = 40;

var GameFactory = function() {
  var stage = {};
  var stageWidth = 1000;
  var stageHeight = 500;
  var paddleWidth = 25;
  var paddles = [];
  var score = [0,0];
  var heights = [100, 100];
  var velocities = [0,0];
  var rightX = parseInt($('#gameCanvas').attr('width'), 10) - paddleWidth;
  var ballVelocity = {};
  var scored = false;

  var ball = {};
  // debugger;
  //Create the game object to be initialized and returned
  var self = {
    'init' : function(stageId, players) {
      //Create a stage by getting a reference to the canvas
      //Stage variable is in closure scope
      stage = new createjs.Stage(stageId);

      //Create a Shape DisplayObject.  Make it a method like start
      ball = new createjs.Shape();
      ball.graphics.beginFill('#EEEEEE').drawCircle(0, 0, 10);
      paddles[0] = new createjs.Shape();
      paddles[0].graphics.beginFill('#EEEEEE').drawRect(0, 0, paddleWidth, heights[0]);
      paddles[1] = new createjs.Shape();
      paddles[1].graphics.beginFill('#EEEEEE').drawRect(rightX, 0, paddleWidth, heights[1]);
      paddles[0].y = paddles[1].y = 200;
      // console.log(paddles[0].y);
      score[0] = new createjs.Text(0, 'bold 70px Arial', '#777777');
      score[1] = new createjs.Text(0, 'bold 70px Arial', '#777777');
      var player1 = new createjs.Text(players[0].name, 'bold 50px Arial', '#777777');
      var player2 = new createjs.Text(players[1].name, 'bold 50px Arial', '#777777');
      var player1Bounds = player1.getBounds();
      var player2Bounds = player2.getBounds();
      score[0].y = score[1].y = 50;
      player1.y = player2.y = 10;
      score[0].x = stageWidth / 5;
      score[1].x = (stageWidth / 5) * 4;
      player1.x = (stageWidth / 5) - (player1Bounds.width / 2);
      player2.x = ((stageWidth / 5) * 4) - (player2Bounds.width / 2);
      //Set position of Shape instance.
      ball.x = ball.y = 50;
      ball.radius = 10;
       //Add Shape instance to stage display list.
      stage.addChild(paddles[0], paddles[1], score[0], score[1], player1, player2, ball);
      stage.update();
    },

      // set the stage!
    'start' : function() {
      // reset ball to [0,0,40] .. or whatever the default is
      // set score to zero, whatever else you need to do
      // Update stage will render next frame
      createjs.Ticker.addEventListener('tick', self.update);
      createjs.Ticker.setFPS(40);
      // stage.update();
      socket.emit('startball', {game: game});
    }, //end of start()

      //handle your keypress!
    'keyDown' : function(e) {
      //handle your keypress here

      if(!$('#options').hasClass('hidden') && $('input[type=radio]:checked').val() === 'custom') {
        // user is setting custom keys
        var key = String.fromCharCode(e.which);
        if($('#upKey').hasClass('config')){
          $('#downKey').text($('#upKey').text()).addClass('config');
          $('#upKey').text(key).removeClass('config');
          upKey = e.which;
        } else if($('#downKey').hasClass('config')) {
          $('#downKey').text(key).removeClass('config');
          downKey = e.which;
        }
      }

      switch (e.which) {
        case upKey: // UP
          if(velocities[player.index] !== -5) {
            // console.log('up');
            velocities[player.index] = -5;
            self.emitPaddles();
          }
          break;
        case downKey: // DOWN
          if (velocities[player.index] !== 5) {
            velocities[player.index] = 5;
            self.emitPaddles();
          }
      }
    },
    'keyUp' : function(e) {
      if (e.which === upKey || e.which === downKey) {
        // console.log(e.which);
        if (velocities[player.index]) {
          velocities[player.index] = 0;
          self.emitPaddles();
        }
      }
      // console.log(paddles[0]);
    },
    'emitPaddles' : function() {
      var tempPaddles = [];
      var opponent = player.index === 0 ? 1 : 0;
      tempPaddles[player.index] = velocities[player.index];
      tempPaddles[opponent] = null;
      socket.emit('movepaddle', {game: game, paddles: tempPaddles});
    },
    'stayInBounds': function(test, min, max) {
      return Math.min(Math.max(test, min), max);
    },
    'newBall' : function(x, y) {
      console.log('newBall');
      ball.x = stageWidth / 2;
      ball.y = stageHeight / 2;
      ballVelocity.x = x;
      ballVelocity.y = y;

    },
    'checkCollision' : function(ball, paddle, velocity, paddleHeight, index) {
      if(ball.y <= paddle.y + paddleHeight && ball.y >= paddle.y) {
        if((index === 0 && ballVelocity.x <= 0) || (index === 1 && ballVelocity.x >= 0)) {
          ballVelocity.x *= -1;
          ballVelocity.x *= 1.3;
          ballVelocity.y *= 1.3;
          if(velocity > 0) {
            ballVelocity.y += 2;
            console.log('ball down');
          } else if (velocity < 0) {
            ballVelocity.y -= 2;
            console.log('ball up');
          }
          if(index === player.index){
            // only submit to server if ball strikes the client's paddle
            // will allow server to sync when the defending client changes
            socket.emit('ballstrike', {game:game, x:ball.x, y:ball.y, velocity:ballVelocity});
          }
        }
      }
    },
    'checkScore' : function() {
      if(!scored) {
        if(ball.x - ball.radius <= 0 && player.index === 0) {
          scored = true;
          setTimeout(function(){scored = false;}, 2000);
          socket.emit('score', {game:game, index: 1});
        } else if(ball.x + ball.radius >= stageWidth && player.index === 1) {
          scored = true;
          setTimeout(function(){scored = false;}, 2000);
          socket.emit('score', {game:game, index: 0});
        }
      }
    },
    'updatePaddles' : function(paddles) {
      if(paddles[0] !== null) {velocities[0] = paddles[0];}
      if(paddles[1] !== null) {velocities[1] = paddles[1];}

    },
    'updateBall' : function(x, y, velocity) {
      ball.x = x;
      ball.y = y;
      ballVelocity = velocity;
    },
    'updateScore' : function(newScore) {
      console.log(newScore);
      score[0].text = newScore[0];
      score[1].text = newScore[1];
    },
    'update' : function() {


      // console.log(ball.x);
      if (ball.y <= ball.radius && ballVelocity.y < 0 || ball.y >= stageHeight - ball.radius && ballVelocity.y > 0) {ballVelocity.y *= -1;}
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;
      if (ball.x - ball.radius <= paddleWidth) {self.checkCollision(ball, paddles[0], velocities[0], heights[0], 0);}
      if (ball.x + ball.radius >= stageWidth - paddleWidth) {self.checkCollision(ball, paddles[1], velocities[1], heights[1], 1);}
      self.checkScore();
      // console.log(paddles[0].y + ' - ' + velocities[0]);
      paddles[0].y = self.stayInBounds(paddles[0].y + velocities[0], 0, stageHeight - heights[0]);
      // debugger;
      paddles[1].y = self.stayInBounds(paddles[1].y + velocities[1], 0, stageHeight - heights[1]);
      // console.log(createjs.Ticker.getMeasuredFPS());
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
  $('input[type=radio]').on('click', clickRadio);
}

function clickRadio(e) {
  var methods = {
    arrows : function(){
      controls = 'arrows';
      $('#phoneControls').addClass('hidden');
      $('#customControls').addClass('hidden');
      upKey = 38;
      downKey = 40;
    },
    custom : function(){
      controls = 'custom';
      $('#phoneControls').addClass('hidden');
      $('#customControls').removeClass('hidden');
      $('#upKey').addClass('config').text('Press key to set');
    },
    phone: function(){
      controls = 'phone';
      $('#phoneControls').removeClass('hidden');
      $('#customControls').addClass('hidden');
    }
  };

  methods[$('input[type=radio]:checked').val()]();
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
  $('#err').html('&nbsp;');
  var url = '/login';
  var data = $('#gameForm').serialize();
  console.log(data);
  sendAjaxRequest(url, data, 'POST', 'PUT', e, function(data){
    processLogin(data);
  });
}

function clickRegister(e) {
  $('#err').html('&nbsp;');
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
    // console.log(data);
    game.newBall(data.x, data.y);
  });

  socket.on('updateball', function(data) {
    // console.log(data);
    game.updateBall(data.x, data.y, data.velocity);
  });

  socket.on('updatescore', function(data) {
    // console.log(data);
    game.updateScore(data.score);
  });

  socket.on('updatelatency', function(data){
    socket.emit('updatelatency', {time: data.time});
    console.log('updatelatency');
  });

  //get our game obj
  var game = GameFactory();
  //set up callbacks related to the game
  $('#startGame').on('click', submitGame);
  $('body').on('keydown', game.keyDown);
  $('body').on('keyup', game.keyUp);

  socket.on('playerjoined', function(data){
    // console.log(data);
    $('#newGameForm').addClass('hidden');
    $('#options').addClass('hidden');
    if (data.players.length === 1) {
      $('#notice').removeClass('hidden').children('span').text('Waiting on second player...');
    } else {
      // console.log(data);
      player.index = _.findIndex(data.players, {'name': player.name});
      $('#notice').addClass('hidden');
      $('#gameContainer').removeClass('hidden');
      game.init('gameCanvas', data.players);
      game.start();
    }

  });

}

function socketConnected(data){
  console.log(data);
}

