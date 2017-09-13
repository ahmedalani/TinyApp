var express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//object passed to all templets through this function
app.use(function (req, res, next) {
   res.locals = {
     username: req.cookies["username"]
   };
   next();
});

function generateRandomString() {
 var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

//Home page
app.get("/", (req, res) => {
  res.end("Hello!");
});

//check for requirment, this might not be needed
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//check for requirment, this might not be needed
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//passes the urlDatabase to urls_index and render the page
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//for to submit new urls to database
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//redirect to the new URL created and assign a short URL to the long URL created.
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});
//404 needed
//passing data to urls_show templet and rendering the templet
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});
//404 needed
//when client enters a short URL he get redirected to the long URL assigned.
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// Delete Item
app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});
//404 needed
//modifying the long URL
app.post("/urls/:id/edit", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect('/urls');
});

//Cookieee
app.post("/login", (req, res) => {
  let usernameValue = req.body.username;
  res.cookie("username", usernameValue);
  res.redirect("/urls");
});

//Logout and remove cookie history
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});