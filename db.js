const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// is the environment variable, NODE_ENV, set to PRODUCTION?
let dbconf;


// A public journal
// includes the user who created the journal and when it was created
// includes how many likes it has and includes its tags

const Journal = new mongoose.Schema({
	title: {type: String, required: true},
	body: {type: String, required: true},
	tags: {type: String},
	createdAt: {type: Date, required: true},
	isPrivate: {type: Boolean, default: false, required: false}
});

// Te user's colelction of created journals
// The user can select their post to be private or not
// The user can tell if their post got tweeted or not
// includes how many likes it has and includes its tags

const MyJournal = new mongoose.Schema({
	title: {type: String, required: true},
	body: {type: String, required: true},
	tags: {type: String},
	createdAt: {type: Date, required: true},
	isPrivate: {type: Boolean, default: false},
});

// users
// my site requires authentication
// so users should have a username and password
// if not, can continue into the site as a guest
// the users field holds references to their journals and their likes

const User = new mongoose.Schema({
	// username provided by authenticatio module
	// password hash provided by authentication module
	username: {type: String, required: true},
	password: {type: String, required: true},
	journals: [MyJournal]
});

if (process.env.NODE_ENV === 'PRODUCTION'){
	// if we're in PRODUCTION mode, then read the configuration from a file
	const fs = require('fs');
	const path = require('path');
	const fn = path.join(__dirname, 'config.json');
	const data = fs.readFileSync(fn);

	// parse the json from the configuration file
	const conf = JSON.parse(data);
	dbconf = conf.dbconf;
}

else {
	// if we're not in PRODUCTION mode
	console.log('not in production');
	dbconf = 'mongodb://localhost/om665';
}

mongoose.model('MyJournal', MyJournal);
mongoose.model('Journal', Journal);
mongoose.model('User', User);
mongoose.connect(dbconf,{useNewUrlParser: true, useUnifiedTopology: true});