var express  = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('passportapp', ['users']);
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

router.get('/login', function(req,res){
	res.render("login");
});


router.get('/register', function(req,res){
	res.render("register");
});

router.post('/register', function(req,res){

	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	req.checkBody('name', 'Name Field is required').notEmpty();	
	req.checkBody('email', 'Email Field is required').notEmpty();	
	req.checkBody('email', 'Please enter valid email').isEmail();	
	req.checkBody('username', 'Username Field is required').notEmpty();	
	req.checkBody('password', 'Password Field is required').notEmpty();
	req.checkBody('password2', 'Passwords dont match').equals(req.body.password);

	var errors =  req.validationErrors();

	if(errors){
		console.log("Form has errors...");
		res.render('register', {
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		});
	} else{
		var newUser = {
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		}

		console.log("--1---"+JSON.stringify(newUser));

		bcrypt.genSalt(10, function(err, salt){
			if(err){
				console.log("Error in outer hashing--",err);
			}
			else{
				bcrypt.hash(newUser.password, salt, function(err, hash){
					if(err){
						console.log("Error in hashing",err);
					}
					else{
						newUser.password = hash;
						newUser.password2 = hash;
						db.users.insert(newUser, function(err, doc){
							if(err){
								res.send(err);
							}
							else{
								console.log("user added...");

								//Success message

								req.flash('success', "You are registered and can now log in");
								res.location('/users/login');
								res.redirect('/users/login');
							}
						})
					}
				})
			}
		})
	}	
});

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  db.users.findOne({_id: mongojs.ObjectId(id)}, function(err, user){
  	done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done){
	db.users.findOne({username: username}, function(err, user){
		if(err){
			return done(err);
		}
		if(!user){
			return done(null, false, {message: "Incorrect Username"});
		}

		bcrypt.compare(password, user.password, function(err, isMatch){
			if(err){
				return done(err);
			}
			if(isMatch){
				return done(null, user);
			} else {
				return done(null, false, {message: "Incorrect Password"});
			}
		});
	});
}));

router.post('/login',
 passport.authenticate('local',
  { successRedirect: '/',
	  failureRedirect: '/users/login',
	  failureFlash: "Invalid username  or password" }),
	   function(req, res){
			console.log("Auth successful");
			res.redirect('/');
 });

router.get('/logout', function(req, res){
	req.logout();
	req.flash("success", "You have logged out.")
	res.redirect('/users/login');
});

module.exports = router;