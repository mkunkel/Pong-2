
// GET /phone/:id
exports.index = function(req, res){
  res.render('phone/index', {title: 'Pong 2.0', player: res.locals.player, playerId: req.params.id});
};
