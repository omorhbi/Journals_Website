// slew of required modules and models
require('./db');
const mongoose = require('mongoose');
const myJournals = mongoose.model('MyJournal');
const journals = mongoose.model('Journal');
const express = require('express');
const user = mongoose.model('User');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require ('bcryptjs');
const passport = require('passport');

// initialize app
const app = express();

// Passport config
require('./passport/passport')(passport);

app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'hbs');

// sessions
const session = require('express-session');
const sessionOptions = {
	secret: 'secret cookie object',
	resave: true,
	saveUninitialized: true,
	cookie: {secure: false}
};
app.use(session(sessionOptions));

// middleware

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// body parser setup
app.use(express.urlencoded({extended: false}));


// set up cookie handling
app.use(cookieParser());

// set up the cookie
app.use(function(req, res, next){
	const cookie = req.cookies.cookieName;
	if (cookie === undefined){
		// set new cookie
		res.cookie('journal', 'session');
		console.log('Success');
	}
	else{
		console.log('cookie exists', cookie);
	}
	next();
});

// global variables
const date = new Date();


function filter(req, res){ // filters thru search
	const searchResults = req.query;
	const results = {};
	for (const key in searchResults){
		if(searchResults[key] === ""){
			continue;
		}
		else{
			const resultsKey = key.substr(0, key.length);
			results[resultsKey] = searchResults[key];
		}
	}
	console.log(results);
	return results;
}

function authenticated() {
  return function(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.redirect('/login');
    }
    else {
      next();
    }
  }
}
// route handlers here

app.get('/', function(req, res){
	res.redirect('/login');
});

app.get('/login', function(req, res){
	res.render('login');
});

app.post('/login', function(req, res, next){
	const newUsername = req.body.usernameQ;
	const newPassword = req.body.passwordQ;
	const newPassword2 = req.body.passwordQ2;

	let errors = [];

	if (newPassword !== newPassword2){
		errors.push({msg: 'passwords do not match'});
	}

	if(errors.length > 0){
		res.render('login', {
			errors,
			newUsername,
			newPassword,
			newPassword2
		});
	}
	else if (errors.length < 1 && newUsername && newPassword 
		&& newPassword2){
		user.findOne({username: newUsername}, function (err, users){
			if (err){
				console.log(err);
			}

			if (users){
				errors.push({msg: 'username exists already'});
				res.render('login', {
					errors,
					newUsername,
					newPassword,
					newPassword2
				});
			}
			else {
				const newUser = new user({
					username: newUsername,
					password: newPassword,
					journals: myJournals._id
				});

				// hash password
				bcrypt.genSalt(10, (err, salt) => 
					bcrypt.hash(newUser.password, salt, (err, hash) => {
						if(err){
							//console.log('error1');
							console.log(err);
						}
						// set password to hashed
						newUser.password = hash;
						// save user
						newUser.save(function(err, users){
							if (err){
								console.log(err);
							}
							else{
								res.redirect('/journals');
							}
						})
				}));
			}
		});
	}
	else if (req.body.password && req.body.username){
		passport.authenticate('local', function (err, loggedUser) {
			if (err){
				//console.log('error2');
				return next(err);
			}
			// if user does not exist
			if (!loggedUser) {
				console.log('no user');
				res.render('login');
			}
			// if user exists
			if (loggedUser){
				req.logIn(loggedUser, function(err){
					if (err){
						return next(err);
						}
					return res.redirect('journals/myjournals');
				});
			}
		})(req, res, next);
	}		

});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/journals');
});

app.get('/journals', function(req, res){
	const search = filter(req, res);
	journals.find(search, function(err, journals){
		if (err){
			console.log(err);
		}

		else{
			res.render('journals', {journals: journals});
		}
	});
});

app.get('/journals/myjournals', authenticated(), function(req, res){
	//userJournals = req.user.journals;
	myJournals.find({}, function(err, myJournals){
		if (err){
			console.log(err);
		}
		res.render('myJournals', {myJournals: req.user.journals});
	
	});
});

app.get('/journals/create', authenticated(), function (req, res, next){
	res.render('create');
});

app.post('/journals/create', function(req, res){

	const addJournal = new journals({
		title: req.body.title,
		body: req.body.body,
		tags: req.body.tags,
		createdAt: date.toDateString(),
		isPrivate: req.body.isPrivate
	});

	const addMyJournal = new myJournals({
		title: req.body.title,
		body: req.body.body,
		tags: req.body.tags,
		createdAt: date.toDateString(),
		isPrivate: req.body.isPrivate
	});

	if (req.body.isPrivate === 'false'){
		addJournal.save(function(err, journals){
			if (err){
				console.log(err);
				res.render('create');
			}
			else{
				console.log("success3");
				addMyJournal.save(function(err, myJournals){
					if (err){
						//console.log('error2');
						res.render('create');
					}
					else{
						req.user.journals.push(myJournals);
						req.user.save(function(err, saved){
							console.log(req.user.journals);
						});
						//console.log("success1");
						res.redirect('/journals/myjournals');
					}
				});
			}
		});
	}

	else if (req.body.isPrivate === 'true') {
		addMyJournal.save(function(err, myJournals){
			if (err){
				console.log(err);
				res.render('create');
			}
			else{
				req.user.journals.push(myJournals);
				req.user.save(function(err, saved){
					console.log(req.user.journals);
				});
				//console.log('success2');
				res.redirect('/journals/myjournals');
			}
		});
	}
});

app.listen(process.env.PORT || 3000);