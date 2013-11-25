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
    // console.log(player);
    fn(err, player);
  });
};

exports.findPlayerBySocket = function(socket, fn){
  Player.findOne({socketId:socket.id}, function(err, player){
    console.log(player);
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

exports.updatePaddles = function(sockets, game, paddles, fn) {

  for(var i = 0; i < game.players.length; i++){
    if(sockets[game.players[i].socketId]){
      sockets[game.players[i].socketId].emit('updatepaddles', {paddles: paddles});
    }
  }
  fn();
};

exports.updateScore = function(sockets, game, index, fn) {
  game.score[index] += 1;
  for(var i = 0; i < game.players.length; i++){
    if(sockets[game.players[i].socketId]){
      sockets[game.players[i].socketId].emit('updatescore', {score: game.score});
    }
  }
  game.markModified('score');
  game.save(function(err, game){
    fn(err,game);
  });
};

exports.updateBall = function(sockets, socket, game, ballX, ballY, velocity, fn) {
  console.log('updateBall');
  for(var i = 0; i < game.players.length; i++){
    if(game.players[i].socketId !== socket.id) {
      if(sockets[game.players[i].socketId]){
        for(var n = 0; n < game.players[i].latency; n++){
          ballX += velocity.x;
          ballY += velocity.y;
        }
        sockets[game.players[i].socketId].emit('updateball', {x:ballX, y:ballY, velocity:velocity});
      }
    }
  }
  fn();
};

exports.updateLatency = function(sockets, game, fn) {
  console.log('updateLatency');
  for(var i = 0; i < game.players.length; i++){
    sockets[game.players[i].socketId].emit('updatelatency', {time:Date.now()});
  }
  fn();
};

exports.saveLatency = function(player, time, fn) {
  player.latency = (Date.now() - time) / 25;
  player.save(function(err, player) {
    fn();
  });
};

exports.emitBall = function(sockets, game, x, y, fn){
  // console.log('emitBall');
  for(var i = 0; i < game.players.length; i++){
    if(sockets[game.players[i].socketId]){
      sockets[game.players[i].socketId].emit('newball', {game:game, players:game.players, x:x, y:y});
    }
  }
  fn();
};

exports.emitPlayers = function(sockets, game, fn){
  // console.log('emitPlayers');
  for(var i = 0; i < game.players.length; i++){
    if(sockets[game.players[i].socketId]){
      sockets[game.players[i].socketId].emit('playerjoined', {game:game, players:game.players});
    }
  }
  fn();
};

exports.emitGame = function(sockets, game){
  // console.log(game);
  game.leftPaddle[0].y += game.leftPaddle[0].v;
  game.rightPaddle[0].y += game.rightPaddle[0].v;
  var l = game.leftPaddle[0];
  // console.log(l);
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
  // console.log('attachPlayer');
  if (game.players.length === 2) {
    return new Error('This game already has two players');
  } else {
    game.players.push(player);
    game.save(function(err, game){
      fn(err, game);
    });
  }
};