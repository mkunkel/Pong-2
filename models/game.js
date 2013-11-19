var mongoose = require('mongoose');

var Game = mongoose.Schema({
  name:         String,
  players:      [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}],
  leftPaddle:   [{}],
  rightPaddle:  [{}],
  ball:         [{}],

  createdAt:    {type: Date, default: Date.now}
});

mongoose.model('Game', Game);