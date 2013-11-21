var mongoose = require('mongoose');

var Game = mongoose.Schema({
  name:         {type: String, required: true},
  players:      [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}],
  score:        [Number],
  createdAt:    {type: Date, default: Date.now}
});

Game.pre('save', function(next){
  if(!this.score.length) {
    this.score = [0, 0];
    this.save();
    // console.log('save ' + this.leftPaddle);
  }

  next();
});

mongoose.model('Game', Game);