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
};

function socketStartGame(data){
  var storage = {};
  var socket = this;
  console.log('socketStartGame');
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
    function(game,fn){if(game.players.length===2){timer = setInterval(function(){m.emitGame(io.sockets,game);}, 100);fn(null, game);}else{fn(null, game);}},
    function(game,fn){m.emitPlayers(io.sockets,game,fn);}
  ]);
}

function socketStartBall(data) {
  console.log('socketStartBall');
  var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
  if (data.toward === 'left') {
    plusOrMinus = -1;
  } else if (data.toward ==='right') {
    plusOrMinus = 1;
  }
  var x = Math.floor(Math.random()*2 +1) * plusOrMinus;
  plusOrMinus = Math.random() < 0.5 ? -1 : 1;
  var y = Math.floor(Math.random()*2 + 1) * plusOrMinus;
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){m.emitBall(io.sockets,game, x, y,fn);}
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

function socketRedirectBall(data) {
  var storage = {};
  var socket = this;

  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){storage.game=game;fn();},
    function(fn){m.redirectBall(storage.game, data.ball.x, data.ball.y, fn);}
  ]);
}

function socketDisconnect(data){
  console.log(data);
}