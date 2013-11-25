var mongoose = require('mongoose');
var Player = mongoose.model('Player');

exports.findPlayer = function(req, res, next) {
  if (req.session.playerId) {
    console.log('playerId present');
    Player.findById(req.session.playerId, function(err, player) {
      console.log('callback');
      if (player) {
        console.log('player found');
        res.locals.player = player;
        next();
      }
    });
  } else {
    console.log('no playerId');
    next();
  }
};