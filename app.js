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
  password : String
});

userSchema.plugin(passpostLocalMongoose);

const User = mongoose.model("User" , userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

})

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

app.listen(3000 , function() { console.log("server started successfully at 3000");} );
