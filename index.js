require('dotenv').config();
const express = require('express');
const passport = require('passport'); 
const connectDb = require('./config/database');
const path = require('path');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

//  Connect to the database
connectDb();

//  Set up view engine & static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

//  Middleware for parsing request data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

//  Session Middleware (Must be before Passport)
app.use(expressSession({
    secret: process.env.SESSION_SECRET || 'default_secret', // Use an environment variable for security
    resave: false,
    saveUninitialized: false
}));

//  Passport Configuration & Middleware
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());  

//  Routes
const userRoute = require('./routes/userRoutes');
app.use('/user', userRoute);

const adminRoute = require('./routes/adminRoutes');
app.use('/admin', adminRoute);

//  Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
