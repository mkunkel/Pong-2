var mongoose = require('mongoose');
var __ = require('lodash');

function randomize() {
  return __.sample(__.range(10));
}

var Player = mongoose.Schema({
  name:      String,
  socketId:  String,
  createdAt: {type: Date, default: Date.now}
});

mongoose.model('Player', Player);