const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/user/auth/google/callback",
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
            // User exists, generate JWT token
            const token = jwt.sign({ userId: existingUser._id }, JWT_SECRET, { expiresIn: '1h' });
            return done(null, { user: existingUser, token });
        }

        // If user doesn't exist, create new user
        const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            password: '', // No password for Google login users
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
        done(null, { user: newUser, token });
    } catch (error) {
        done(error);
    }
}));

passport.serializeUser(() => {});  // Do not store any session-related information
passport.deserializeUser(() => {}); // No session data to deserialize

module.exports = passport;