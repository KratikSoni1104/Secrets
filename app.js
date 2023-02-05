//jshint esversion:6

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const session = require("express-session");
const passport = require("passport");
const passpostLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();
app.set('view engine' , 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));

app.use(session({
    secret: "Our Little Secret.",
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery' , true);
mongoose.connect("mongodb://127.0.0.1/userDB");

const userSchema = new mongoose.Schema({
  email : String,
  password : String,
  googleId : String,
  secret: String
});

userSchema.plugin(passpostLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User" , userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user , done) {

  done(null , user.id);

});

passport.deserializeUser(function(id , done) {

  User.findById(id , function(err , user) {
    done(err , user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }
));

app.get('/auth/google/secrets',
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get("/" , function(req , res){
  res.render("home");
});

app.get("/register" , function(req , res){
  res.render("register");
});

app.get("/login" , function(req , res){
  res.render("login");
});

app.get("/secrets" , function(req , res) {

  if(req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login")
  }

});

app.get("/submit" , function(req , res) {
  if(req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login")
  }
});

app.post("/submit" , function(req , res) {
  const secret = req.body.secret;

  console.log(req.googleId);

  // User.findById(req.user.id , function(err , foundUser) {
  //   if(err) {
  //     console.log(err);
  //   } else {
  //     if(foundUser) {
  //       foundUser.secret = secret;
  //       foundUser.save(function() {
  //         res.redirect("/secrets");
  //       })
  //     }
  //   }
  // })
});

app.post("/register" , function(req , res) {

  User.register({username: req.body.username} , req.body.password , function(err , user) {
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req , res , function(err) {
        res.redirect("/secrets");
      })
    }
  });

});

app.post("/login" , function(req , res) {

    const user = new User({
      email : req.body.username,
      password  :req.body.password
    });

    req.login(user , function(err) {
      if(err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req , res , function(err) {
          res.redirect("/secrets");
        })
      }
    })
});

app.get("/logout" , function(req , res) {
  req.logout(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  })
});

app.listen(3000 , function() { console.log("server started successfully at 3000");} );
