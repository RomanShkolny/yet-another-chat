const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcrypt');
const saltRounds = 10;

const users = require('./controllers/users');

const config = require('./config');

passport.use(new FacebookStrategy({
    clientID: config.facebookClientID,
    clientSecret: config.facebookClientSecret,
    callbackURL: config.facebookCallbackURL
  },
  async function(accessToken, refreshToken, profile, done) {
    try
    {
      const user = await users.findOrInsertFacebookUser(profile);
      return done(null, user);
    }
    catch(err)
    {
      return done(err);
    }
  }
));

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'passwd'
  },
  async function(username, password, done) {
  	try
  	{
  		const user = await users.findLocalUser(username);
  		if (user && bcrypt.compare(password, user.hash))
  			return done(null, user);
  		else
			return done(null, false, { message: 'Incorrect credentials' });
  	}
  	catch(err)
  	{
  		return done(err);
  	}
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function(id, done) {
  try
  {
    const user = await users.getUserByObjectId(id);
    done(null, user);
  }
  catch(err)
  {
    done(err, null);
  }
});

passport.registerLocalUser = async function (username, password) {
	const hash = await bcrypt.hash(password, saltRounds);
	return await users.registerLocalUser(username, hash);
}

passport.getUserByObjectId = async function(objectId) {
	return await users.getUserByObjectId(objectId);
}

exports.passport = passport;