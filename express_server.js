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

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  // let id = urlDatabase[req.params.id];
  // let test = [templateVars, id]
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  // if (req.params.id )
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  console.log(shortURL)
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);

});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(301, `/urls/${randomString}`);
});

// Delete Item
app.post("/urls/:id/delete", (req, res) => {
  //finding the item
  let id = req.params.id;
  delete urlDatabase[id];

  res.redirect('/urls');
});

//modifying the long URL
app.post("/urls/:id/edit", (req, res) => {
  //finding the item
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