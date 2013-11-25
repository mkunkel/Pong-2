var mongoose = require('mongoose');
// var __ = require('lodash');
var uniqueValidator = require('mongoose-unique-validator');

// function randomize() {
//   return __.sample(__.range(10));
// }

var Player = mongoose.Schema({
  name:      {type: String, required: true, unique: true},
  password:  {type: String, required: true},
  socketId:  String,
  phoneId:   String,
  latency:   {type:Number, default: 0},
  createdAt: {type: Date, default: Date.now}
});

Player.plugin(uniqueValidator);
mongoose.model('Player', Player);