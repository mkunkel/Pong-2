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

  //Create the game object to be initialized and returned
  var self = {
    'init' : function(stageId, players) {
      //Create a stage by getting a reference to the canvas
      //Stage variable is in closure scope
      stage = new createjs.Stage(stageId);

      // Create ball
      ball = new createjs.Shape();
      ball.graphics.beginFill('#EEEEEE').drawCircle(0, 0, 10);

      // Create paddles
      paddles[0] = new createjs.Shape();
      paddles[0].graphics.beginFill('#EEEEEE').drawRect(0, 0, paddleWidth, heights[0]);
      paddles[1] = new createjs.Shape();
      paddles[1].graphics.beginFill('#EEEEEE').drawRect(rightX, 0, paddleWidth, heights[1]);
      paddles[0].y = paddles[1].y = 200;

      // Create text objects
      score[0] = new createjs.Text(0, 'bold 70px Arial', '#777777');
      score[1] = new createjs.Text(0, 'bold 70px Arial', '#777777');
      var player1 = new createjs.Text(players[0].name, 'bold 50px Arial', '#777777');
      var player2 = new createjs.Text(players[1].name, 'bold 50px Arial', '#777777');

      // Place text objects
      // .getBounds() returns an object containing measurements
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

       //Add all display objects to stage display list.
      stage.addChild(paddles[0], paddles[1], score[0], score[1], player1, player2, ball);
      stage.update();
    },

    'start' : function() {
      // start our timer
      createjs.Ticker.addEventListener('tick', self.update);
      createjs.Ticker.setFPS(40);
      socket.emit('startball', {game: game});
    },


    'keyDown' : function(e) {

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

      // don't bother making sure the game is active before game movement
      // stage will be initialized with a set position for the paddles
      // we aren't preventing default behavior
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
      // keyup, set paddle velocity to 0
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
      // send paddle information to the server
      var tempPaddles = [];
      var locations = [];
      var opponent = player.index === 0 ? 1 : 0;
      tempPaddles[player.index] = velocities[player.index];
      // only send this client's info, send null for opponent
      tempPaddles[opponent] = null;
      locations[player.index] = paddles[player.index].y;
      locations[opponent] = null;
      socket.emit('movepaddle', {game: game, paddles: tempPaddles, locations: locations});
    },
    'stayInBounds': function(test, min, max) {
      // If updated location would be < 0, return 0
      // If updated location would be > stage height, return stage height
      // Else return updated location
      return Math.min(Math.max(test, min), max);
    },
    'newBall' : function(x, y) {
      // start off a new ball, either at the start of the game, or after a point
      // console.log('newBall');
      ball.x = stageWidth / 2;
      ball.y = stageHeight / 2;
      ballVelocity.x = x;
      ballVelocity.y = y;

    },
    'checkCollision' : function(ball, paddle, velocity, paddleHeight, index) {
      // Check if the ball has hit a paddle
      if(ball.y <= paddle.y + paddleHeight && ball.y >= paddle.y) {
        // Ball is above the bottom of the paddle and below the top
        if((index === 0 && ballVelocity.x <= 0) || (index === 1 && ballVelocity.x >= 0)) {
          // Check to make sure that ball velocity hasn't already been updated
          // With a fast ball, it could get updated multiple times and get sped up rapidly
          // In addition to looking like it is vibrating on the paddle
          ballVelocity.x *= -1;
          ballVelocity.x *= 1.3;
          ballVelocity.y *= 1.3;
          if(velocity > 0) {
            ballVelocity.y += 2;
            // console.log('ball down');
          } else if (velocity < 0) {
            ballVelocity.y -= 2;
            // console.log('ball up');
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
      // check if a score condition is present
      if(!scored) {
        if(ball.x - ball.radius <= 0 && player.index === 0) {
          scored = true;
          setTimeout(function(){scored = false;}, 2000);
          // Prevent multiple points per score
          socket.emit('score', {game:game, index: 1});
        } else if(ball.x + ball.radius >= stageWidth && player.index === 1) {
          scored = true;
          setTimeout(function(){scored = false;}, 2000);
          // Prevent multiple points per score
          socket.emit('score', {game:game, index: 0});
        }
      }
    },
    'updatePaddles' : function(newPaddles, locations) {
      // Update paddle velocities
      // locations will be for lag compensation
      if(newPaddles[0] !== null) {velocities[0] = newPaddles[0];}
      // if(locations[0] !== null) {paddles[0].y = locations[0];}
      if(newPaddles[1] !== null) {velocities[1] = newPaddles[1];}
      // if(locations[1] !== null) {paddles[1].y = locations[1];}
    },
    'updateBall' : function(x, y, velocity) {
      // update ball location
      // This is called when the server send a message with updated ball location
      ball.x = x;
      ball.y = y;
      ballVelocity = velocity;
    },
    'updateScore' : function(newScore) {
      // Update the score displays
      score[0].text = newScore[0];
      score[1].text = newScore[1];
    },
    'update' : function() {
      // Update locations of display objects
      // This includes checking for score conditions and collisions
      if (ball.y <= ball.radius && ballVelocity.y < 0 || ball.y >= stageHeight - ball.radius && ballVelocity.y > 0) {ballVelocity.y *= -1;}
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;
      if (ball.x - ball.radius <= paddleWidth) {self.checkCollision(ball, paddles[0], velocities[0], heights[0], 0);}
      if (ball.x + ball.radius >= stageWidth - paddleWidth) {self.checkCollision(ball, paddles[1], velocities[1], heights[1], 1);}
      self.checkScore();
      paddles[0].y = self.stayInBounds(paddles[0].y + velocities[0], 0, stageHeight - heights[0]);
      paddles[1].y = self.stayInBounds(paddles[1].y + velocities[1], 0, stageHeight - heights[1]);
      stage.update();
    }
  };

  return self;
};  //end of returned game object




function initialize(){
  // initialize foundation, sockets and event handlers
  $(document).foundation();
  initializeSocketIO();
  $('#authenticationButton').on('click', clickAuth);
  $('#login').on('click', clickLogin);
  $('#register').on('click', clickRegister);
  $('#startGame').on('click', submitGame);
  if ($('#authenticationButton').hasClass('alert')) {player.name = $('#authenticationButton').text();}
  $('.radio').on('click', function(){$(this).prev().click(); clickRadio();});
  $('input[type=radio]').on('click', clickRadio);
}

function clickRadio(e) {
  // click on a radio button when setting game controls
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
  // click on Login/Sign Up button
  if (!$(this).data('name')) {
    // user isn't logged in, show the form
    $('#gameForm').toggleClass('hidden');
    $('input[name=name]').focus();
  } else {
    // user is logged in, clicking on this button should
    // kill the session and redirect to the home page
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
  // click the login button
  $('#err').html('&nbsp;');
  // set #err.html to a non-breaking space, so it doesn't collapse
  // and ruin the formatting
  var url = '/login';
  var data = $('#gameForm').serialize();
  sendAjaxRequest(url, data, 'POST', 'PUT', e, function(data){
    processLogin(data);
  });
}

function clickRegister(e) {
  // click the register button
  $('#err').html('&nbsp;');
  var url = '/';
  var data = $('#gameForm').serialize();
  sendAjaxRequest(url, data, 'POST', null, e, function(data){
    handleRegistration(data);
  });
}

function handleRegistration(data) {
  // process the server's response to a registration
  if (data.status === 'ok') {
    $('input').val('');
    $('#authentication').toggleClass('hidden');
  } else {
    $('#err').text('Error: please try again');
  }
}

function processLogin(data) {
  // process server's response ot a login
  if (data.status === 'ok') {
    redirect();
  } else {
    $('#authentication input').val('');
    $('#authentication input[type=text]').focus();
    $('#err').text('Wrong email/password');
  }
}

function redirect() {
  // send the user to /
  // server will load the page differently based on if there is an active session
  window.location.href = '/';
}

function submitGame(e){
  // send a new game to the server
  game = $('#newGameForm input[name=game]').val();
  socket.emit('startgame', {game:game, player:player.name});
  e.preventDefault();
}

function initializeSocketIO(){
  // initialize sockets
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';

  socket = io.connect(url);
  socket.on('connected', socketConnected);

  // socket handlers

  //main draw function
  socket.on('gameupdate', function(data){
    game.update(data.l, data.r, data.b);
  });

  // update the paddle velocities from the server
  socket.on('updatepaddles', function(data){
    game.updatePaddles(data.paddles, data.locations);
  });

  // server sent a new ball
  socket.on('newball', function(data) {
    game.newBall(data.x, data.y);
  });

  // server sent updated ball info, display the changes
  socket.on('updateball', function(data) {
    game.updateBall(data.x, data.y, data.velocity);
  });

  // updated score from server, display it
  socket.on('updatescore', function(data) {
    game.updateScore(data.score);
  });

  // help server figure out the latency of this client
  socket.on('updatelatency', function(data){
    socket.emit('updatelatency', {time: data.time});
  });

  // get our game object
  // by calling it here, our sockets have ready access to all game elements
  var game = GameFactory();

  // set up callbacks related to the game
  // these are set here instead of the main initialize function
  // so they only really get called after a game is created
  $('body').on('keydown', game.keyDown);
  $('body').on('keyup', game.keyUp);

  socket.on('playerjoined', function(data){
    // player joined, if there are two players, start the game
    $('#newGameForm').addClass('hidden');
    $('#options').addClass('hidden');
    if (data.players.length === 1) {
      $('#notice')
      .removeClass('hidden')
      .html('Waiting on second player...<br>Game name: <span>' + $('input[name=game]').val() + '</span>');
    } else {
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

