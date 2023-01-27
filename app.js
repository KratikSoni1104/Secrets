//jshint esversion:6

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");

const app = express();
app.set('view engine' , 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));

mongoose.set('strictQuery' , true);
mongoose.connect("mongodb://127.0.0.1/userDB");

const userSchema = new mongoose.Schema({
  email : String,
  password : String
});

const User = mongoose.model("User" , userSchema);

app.get("/" , function(req , res){
  res.render("home");
});

app.get("/register" , function(req , res){
  res.render("register");
});

app.get("/login" , function(req , res){
  res.render("login");
});

app.post("/register" , function(req , res) {

  const newUser = new User({
    email : req.body.username,
    password : md5(req.body.password)
  });

  newUser.save(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  })
});

app.post("/login" , function(req , res) {
  const username = req.body.username;
  const password = md5(req.body.password);

  User.findOne(
    {email : username},
    function(err , foundUser) {
      if(err) {
        console.log(err);
      } else {
        if(foundUser) {
          if(foundUser.password === password) {
            res.render("secrets");
          }
        }
      }
    }
  );

});

app.listen(3000 , function() { console.log("server started successfully at 3000");} );
