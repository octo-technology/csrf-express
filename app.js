// CSRF

// Define TCP port
const PORT = process.env.PORT || 3000;

// Import from Node.js standard library
const fs = require('fs');
const path = require('path');

// Import from third part package
var bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const pug = require('pug');
const sqlite3 = require('sqlite3');

// Create an express application
const app = express();

// Enable trust proxy to use Secure cookie
app.set('trust proxy', 1)

// Cookie settings for CSRF hands-on
const cookieConfig = {
  path: '/', 
  httpOnly: true,
  secure: true,
  maxAge: 600000,
  sameSite: 'none'
};

// Session settings
var sessionConfig = {
  cookie: cookieConfig,
  resave: false,
  saveUninitialized: false,
  secret: 'mySecret'
};

// Enable module
app.use(session(sessionConfig));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '/static')));

// Create user database
var db = new sqlite3.Database(':memory:');
db.serialize(function() {
  db.run("CREATE TABLE user (username TEXT, password TEXT, name TEXT)");
  db.run("INSERT INTO user VALUES ('user', 'user123', 'User')");
  db.run("INSERT INTO user VALUES ('client', 'client123', 'Client')");
  db.run("INSERT INTO user VALUES ('admin', 'admin123', 'App Administrator')");
});

// Build pug template
const viewAccount = pug.compileFile('view/account.pug');
const viewLogin = pug.compileFile('view/login.pug');
const viewOrder = pug.compileFile('view/order.pug');
const viewOrderConfirm = pug.compileFile('view/order_confirm.pug');

app.get('/', (req, res) => {

  // Get current session
  let session = req.session;
  
  if(session.username){
    // User already log in
    console.log(session.username);
    res.redirect("/account");
  }else{
    res.redirect("/login");
  }

});

// Login endpoint
app.get('/account', (req, res) => {

  // Get current session
  let session = req.session;
  
  if(session.username){
    let content = viewAccount({name: session.username});
    res.send(content);
  }else{
    res.redirect("/login");
  }
});


// Login endpoint
app.get('/login', (req, res) => {
   
  // Get current session
  let session = req.session;
  
  if(session.username){
    // User already log in
    res.redirect("/account");
  }else{
    let content = viewLogin();
    res.send(content);
  }

});

app.post('/login', (req, res) => {

  // Get current session
  let session = req.session;
  
  if(session.username){
    res.redirect("/account");
  }else{

    let username = req.body.username;
    let password = req.body.password;
    let query = "SELECT name FROM user where username = ? and password = ?";
    
    db.get(query , [username, password], function(err, row) {

      if(err) {
        console.log('ERROR', err);
        // Technical issue
        let content = viewLogin({message: err});
        res.send(content);
      } else if (!row) {
        // User not found
        let content = viewLogin({message: 'unauthorized'});
        res.send(content);
      } else {
        // User found
        session.username = username;
        res.redirect("/account");
      }
      
    });
    
  }
  
});

// Order endpoint
app.get('/order', (req, res) => {
   
  // Get current session
  let session = req.session;
  
  if(session.username){
    // User already log in
    let content = viewOrder();
    res.send(content);
  }else{
    res.redirect("/login");
  }

});

// Order endpoint
app.post('/order', (req, res) => {
   
  // Get current session
  let session = req.session;
  
  if(session.username){
    // User already log in
    let content = viewOrderConfirm({user: session.username, recipient: req.body.recipient, amount: req.body.amount});
    res.send(content);
  }else{
    res.redirect("/login");
  }

});

// Start Application
app.listen(PORT, '0.0.0.0', () => console.log('app listening on 3000'));
