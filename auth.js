'use strict';
const dotenv = require("dotenv");
dotenv.config({ path: "sample.env" });
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
const { ObjectID } = require('mongodb');
const GitHubStrategy = require('passport-github').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;


module.exports = function(app, userDB) {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    userDB.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      if (err) return console.error(err);
      done(null, doc);
    });
  });
  passport.use('user',new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    userDB.findOne({ $or: [{ email: email }, { username: email }] }, (err, user) => {
        console.log(`User ${email} attempted to log in.`);
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, { message: 'Login failed. User not found.' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: 'Login failed. Incorrect password.' });
        }
        return done(null, user);
    });
}));
  passport.use('admin',new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    userDB.findOne({ $or: [{ email: email , role:'admin' }, { username: email ,role:'admin'}] }, (err, admin) => {
        console.log(`User ${email} attempted to log in.`);
        if (err) {
            return done(err);
        }
        if (!admin) {
            return done(null, false, { message: 'Login failed. User not found.' });
        }
        if (!bcrypt.compareSync(password, admin.password)) {
            return done(null, false, { message: 'Login failed. Incorrect password.' });
        }
        return done(null, admin);
    });
}));

  

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://adem.al-ameenademola.repl.co/auth/google/callback",
    passReqToCallback: true
  },
    function(request, accessToken, refreshToken, profile, cb) {
      console.log(profile);
      //Database logic here with callback containing our user object
      userDB.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            username: profile.displayName,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, new: true },
        (err, doc) => {
          return cb(null, doc.value);
        }
      );

    }
  ));

}