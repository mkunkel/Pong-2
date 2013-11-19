var mongoose = require('mongoose');

var Game = mongoose.Schema({
  name:         String,
  players:      [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}],
  leftPaddle:   [{}],
  rightPaddle:  [{}],
  ball:         [{}],

  createdAt:    {type: Date, default: Date.now}
});

Game.pre('save', function(next){
  // console.log(this.leftPaddle);
  if(!this.leftPaddle.length) {
    var leftPaddle = {};
    var rightPaddle = {};
    var ball = {};
    leftPaddle.v = rightPaddle.v = 0;
    leftPaddle.h = rightPaddle.h = 100;
    leftPaddle.w = rightPaddle.w = 25;
    leftPaddle.y = rightPaddle.y = 200;
    ball.x = 500;
    ball.y = 250;
    ball.r = 10;
    this.leftPaddle.push(leftPaddle);
    this.rightPaddle.push(rightPaddle);
    this.ball.push(ball);
    this.markModified();
    this.save();
    // console.log('save ' + this.leftPaddle);
  }
  next();
});

mongoose.model('Game', Game);