// GET /
exports.create = function(req, res){
  console.log('users.create'.italic.underline.bold.magenta);
  var user = new User();
  user.email = req.body.email;
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    user.password = hash;
    user.save(function(err) {
      if (err) {
        res.send({status: 'error'});
      } else {
        res.send({status: 'ok'});
      }
    });
  });
};

//PUT /login
exports.login = function(req, res){
  console.log('users.login'.italic.underline.bold.magenta);
  var email = req.body.email;
  User.findOne({email: email}, function(err, user){
    if (user) {
      bcrypt.compare(req.body.password, user.password, function(err, result){
        if (result) {
          req.session.regenerate(function() {
            req.session.userId = user.id;
            req.session.save(function() {
              res.send({status: 'ok', email: email});
            });
          });
        } else {
          res.send({status: 'error'});
        }
      });
    } else {
      res.send({status: 'error'});
    }

  });
};

//DELETE /logout
exports.logout = function(req, res){
  console.log('users.logout'.italic.underline.bold.magenta);
  req.session.destroy(function(err){
    res.send({status: 'ok'});
  });
};