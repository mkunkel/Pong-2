exports.index = function(req, res){
  res.render('home/index', {title: 'Pong 2.0', player: res.locals.player, playerId: req.session.playerId});
};
