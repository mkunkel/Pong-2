require('colors');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Player = mongoose.model('Player');

// GET /
exports.create = function(req, res){
  console.log('players.create'.italic.underline.bold.magenta);
  // console.log(req.body);
  var player = new Player();
  player.name = req.body.name;
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    player.password = hash;
    player.save(function(err) {
      if (err) {
        console.log(err);
        res.send({status: 'error'});
      } else {
        res.send({status: 'ok'});
      }
    });
  });
};

//PUT /login
exports.login = function(req, res){
  console.log('players.login'.italic.underline.bold.magenta);
  // console.log(req.body);
  var name = req.body.name;
  Player.findOne({name: name}, function(err, player){
    if (player) {
      bcrypt.compare(req.body.password, player.password, function(err, result){
        if (result) {
          req.session.regenerate(function() {
            req.session.playerId = player.id;
            req.session.save(function() {
              res.send({status: 'ok', name: name});
            });
          });
        } else {
          console.log(err + '1');
          res.send({status: 'error'});
        }
      });
    } else {
      console.log(err);
      res.send({status: 'error'});
    }

  });
};

//DELETE /logout
exports.logout = function(req, res){
  console.log('players.logout'.italic.underline.bold.magenta);
  req.session.destroy(function(err){
    res.send({status: 'ok'});
  });
};