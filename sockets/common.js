/* global setInterval */

var async = require('async');
var __ = require('lodash');
var m = require('../lib/mechanics');
var io;
var timer;

exports.connection = function(socket){
  io = this;
  socket.emit('connected', {status: 'connected'});
  socket.on('disconnect', socketDisconnect);
  socket.on('startgame', socketStartGame);
  socket.on('startball', socketStartBall);
  socket.on('movepaddle', socketMovePaddle);
  socket.on('ballstrike', socketBallStrike);
  socket.on('updatelatency', socketSaveLatency);
  socket.on('score', function(data) {
    // console.log('got score');
    socketScore(data);
  });
};

function socketSaveLatency(data) {
  console.log('socketSaveLatency');
  var socket = this;
  async.waterfall([
    function(fn){m.findPlayerBySocket(socket, fn);},
    function(player, fn){m.saveLatency(player, data.time, fn);}
  ]);
}

function socketStartGame(data){
  var storage = {};
  var socket = this;
  console.log('socketStartGame');
  // console.log(socket);
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){if(!game){m.newGame(data.game,fn);}else{fn(null,game);}},
    function(game,fn){storage.game=game;fn();},
    function(fn){m.findPlayer(data.player,fn);},
    function(player,fn){m.resetPlayer(player,socket,fn);},
    function(player,fn){storage.player=player;fn();},
    function(fn){fn(null,__.any(storage.game.players,function(p){return p.id===storage.player.id;}));},
    function(isFound,fn){if(!isFound){m.attachPlayer(storage.game,storage.player,fn);}else{fn(null,storage.game);}},
    function(game,fn){m.findGame(data.game,fn);},
    // function(game,fn){if(game.players.length===2){timer = setInterval(function(){m.emitGame(io.sockets,game);}, 100);fn(null, game);}else{fn(null, game);}},
    function(game,fn){m.emitPlayers(io.sockets,game,fn);}
  ]);
}

function socketStartBall(data) {
  console.log('socketStartBall');
  var velocity = randomXy(null);
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){m.emitBall(io.sockets,game, velocity.x, velocity.y,fn);}
  ]);

}

function socketBallStrike(data) {
  var storage = {};
  var socket = this;
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){storage.game=game;fn();},
    function(fn){m.updateBall(io.sockets, socket, storage.game, data.x, data.y, data.velocity,fn);},
    function(fn){m.updateLatency(io.sockets, storage.game, fn);}
  ]);
}

function socketMovePaddle(data) {
  var storage = {};
  var socket = this;
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){m.updatePaddles(io.sockets, game, data.paddles, fn);}
  ]);
}

function socketScore(data) {
  // console.log('score');
  // toward determines which way the ball will spawn
  // ball should spawn away from the index passed in
  var toward = data.index === 0 ? 'right' : 'left';
  var velocity = randomXy(toward);
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){m.updateScore(io.sockets, game, data.index, fn);},
    function(game,fn){m.emitBall(io.sockets,game, velocity.x, velocity.y,fn);}
  ]);
}

function socketDisconnect(data){
  console.log(data);
}

function randomXy(toward) {
  var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
  if (toward === 'left') {
    plusOrMinus = -1;
  } else if (toward ==='right') {
    plusOrMinus = 1;
  }
  var x = Math.floor(Math.random()*2 + 1) * plusOrMinus;
  x += 2 * plusOrMinus;
  plusOrMinus = Math.random() < 0.5 ? -1 : 1;
  var y = Math.floor(Math.random()*2 + 1) * plusOrMinus;
  // console.log(x);

  return {x:x, y:y};
}