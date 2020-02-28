require('../db');

const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const user = mongoose.model('User');

// log ins don't exactly work currently
module.exports = function(passport){
	passport.use(
		new LocalStrategy({ username: 'username' }, (username, password, done) => {
			//match user
			user.findOne({username: username}, function(err, users){
				if (!users){
					return done(null, false, { message: 'That username is not registered'});
				}

				// match password
				bcrypt.compare(password, users.password, (err, isMatch) =>{
					if (err){
						console.log(err);
					}

					if (isMatch){
						/*passport.serializeUser(function(users, done){
								done(null, users.id);
						});*/
						return done(null, users);
					}

					else {
						return done(null, false, {message: 'incorrect password'});
					}
				});
			});
		}));

	passport.serializeUser(function(users, done){
		done(null, users.id);
	});

	passport.deserializeUser(function(id, done){
		user.findById(id, function (err, users){
			done(err, users);
		});
	});
}