var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Player = mongoose.model('Player');

exports.findGame = function(name, fn){
  Game.findOne({name:name}).populate('players').exec(function(err, game){
    fn(err, game);
  });
};

exports.newGame = function(name, fn){
  new Game({name:name}).save(function(err, game){
    Game.findById(game.id).populate('players').exec(function(err, game){
      fn(err, game);
    });
  });
};

exports.findPlayer = function(name, fn){
  Player.findOne({name:name}, function(err, player){
    fn(err, player);
  });
};

exports.newPlayer = function(name, color, fn){
  new Player({name:name, color:color}).save(function(err, player){
    fn(err, player);
  });
};

exports.resetPlayer = function(player, socket, fn){
  player.socketId = socket.id;
  player.health = 100;
  player.save(function(err, player){
    fn(err, player);
  });
};

exports.attachPlayer = function(game, player, fn){
  game.players.push(player);
  game.save(function(err, game){
    fn(err, game);
  });
};

exports.updatePaddles = function(game, leftPaddle, rightPaddle, fn) {
  // console.log(leftPaddle);
  leftPaddle = leftPaddle ? leftPaddle : 0;
  game.leftPaddle[0].v = leftPaddle;
  game.markModified('leftPaddle');
  console.log(game.leftPaddle[0]);

  rightPaddle = rightPaddle ? rightPaddle : 0;
  game.rightPaddle[0].v = rightPaddle;
  game.markModified('rightPaddle');

  // console.log(game);
  game.save(function(err, game) {
    // console.log(game);
    fn(err, game);
  });
};

exports.redirectBall = function(game, x, y, fn) {
  // x and y will come in as -1, or 1
  // multiply current values by these to reverse or maintain trajectory.
  game.ball.x *= x;
  game.ball.y *= y;
  game.markModified('ball');
  game.save(function(err, game) {
    fn(err, game);
  });
};

exports.emitPlayers = function(sockets, game, fn){
  console.log('emitPlayers');
  for(var i = 0; i < game.players.length; i++){
    if(sockets[game.players[i].socketId]){
      sockets[game.players[i].socketId].emit('playerjoined', {game:game, players:game.players});
    }
  }
  fn();
};

exports.emitGame = function(sockets, game){
  game.leftPaddle[0].y += game.leftPaddle[0].v;
  game.rightPaddle[0].y += game.rightPaddle[0].v;
  var l = game.leftPaddle[0];
  console.log(l);
  var r = game.rightPaddle[0];
  var b = game.ball[0];
  // console.log(game);
  for(var i = 0; i < game.players.length; i++){
    if(sockets[game.players[i].socketId]){
      sockets[game.players[i].socketId].emit('gameupdate', {l:l, r:r, b:b});
    }
  }
  game.markModified('leftPaddle');
  game.markModified('rightPaddle');
  game.markModified('ball');
  game.save(function(err, game) {
    // console.log(game);
  });
};

exports.attachPlayer = function(game, player, fn){
  console.log('attachPlayer');
  if (game.players.length === 2) {
    return new Error('This game already has two players');
  } else {
    game.players.push(player);
    game.save(function(err, game){
      fn(err, game);
    });
  }
};