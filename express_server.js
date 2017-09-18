var express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["secretKey"],
}));

var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

//urls data object
const urlDatabase = {
  "b2xvn2": {
    "id": "b2xvn2",
    "userID": "uWhWIl",
    "longURL": "http://www.lighthouselabs.ca"
  },
  "9sm5xk": {
    "id": "9sm5xk",
    "userID": "nlQUFi",
    "longURL": "http://www.google.com"
  }
};

//users data obj
const users =
{ uWhWIl:
   { id:  "uWhWIl",
     email:  "ahmed@alani",
     password:  "alani" },
  nlQUFi:
   { id:  "nlQUFi",
     email:  "shosho@shosho",
     password: "shosho" }
};

//middleware: object passed to all templets through this function
app.use(function (req, res, next) {
   res.locals.user = users[req.session.user_id]
   next();
});

function generateRandomString() {
 var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

//Home page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

//check for requirment, this might not be needed
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//check for requirment, this might not be needed
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//function finds a user's urls
function urlForUser (id) {
  let userUrls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id ) {
      userUrls[key] = urlDatabase[key];
    }
  }
  return userUrls;
}

//passes the urlDatabase to urls_index and render the page
app.get("/urls", (req, res) => {
  // let userid = req.cookies["user_id"];
  let userid = req.session.user_id;
  let templateVars = { urls: urlForUser(userid) };
  res.render("urls_index", templateVars);
});

//for to submit new urls to database
app.get("/urls/new", (req, res) => {
  if (req.session.user_id){
  res.render("urls_new");
  } else {
    res.redirect("/login");
  }
});

//redirect to the new URL created and assign a short URL to the long URL created.
app.post("/urls", (req, res) => {
  let userid = req.session.user_id;
  if (!userid) {
    res.status(403).send("You are not logged in, please do in order to use this service");
    return;
  }
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    "id": randomString,
    "userID": req.session.user_id,
    "longURL": req.body.longURL
  }
  res.redirect(`/urls/${randomString}`);
});

//passing data to urls_show templet and rendering the templet
app.get("/urls/:id", (req, res) => {
  let userid = req.session.user_id;
  if (!userid) {
    res.redirect("/urls");
    return;
  }
  let urlobject = urlDatabase[req.params.id]
  if (!urlobject) {
    res.status(404).send("Does Not exist");
    return;
  }
  //just added..if user is logged it but does not own the URL with the given ID
  if (userid !== urlDatabase[req.params.id].userID){
    res.status(403).send("you don't have access to this url");
    return;
  }
    let templateVars = {
    shortURL : req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  }
  res.render("urls_show", templateVars);
});

//when client enters a short URL he get redirected to the long URL assigned.
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("the requested url has not been generated");
    return;
  }
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Delete Item
app.post("/urls/:id/delete", (req, res) => {
  let userid = req.session.user_id;
  if (!userid) {
    res.redirect("/urls");
    return;
  }
  let id = req.params.id;
  if (!id) {
    res.status(403).send("url is not recognized");
    return;
  }
  if ((userid) === (urlDatabase[id]["userID"])) {
    delete urlDatabase[id];
    res.redirect('/urls');
    return;
  } else {
    res.status(403).send("sorry you're only allowed to edit your ownd URLs :-/ ");
  }
});

//Edit the long URL
app.post("/urls/:id", (req, res) => {
  let userid = req.session.user_id;
  if (!userid) {
    res.redirect("/urls");
    return;
  }
  let id = req.params.id;
  let userID = urlDatabase[id]["userID"];
  if (userID === req.session.user_id) {
    urlDatabase[id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
      res.status(403).send("sorry you're only allowed to edit your ownd URLs :-/ ");
  }
});

// login endpoint
app.get("/login", (req, res) => {
  //just added.. if user is logged in:
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("login")
});

//login handler & set the cookie then redirect back to urls
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let userIdFromDatabase;
  function findUser (email) {
    for (let key in users) {
      if (users[key].email === email) {
        userIdFromDatabase = users[key].id;
        return users[key].password;
      }
    }
  }
  //userHashedPasswordFromDatabase
  let uHPFD = findUser(email);
  if (!userIdFromDatabase) {
    res.status(403).send("error: username invalid");
    return;
  }
  if (!bcrypt.compareSync(password, uHPFD)) {
    res.status(403).send("error: username or password are invalid");
    return;
  }
  req.session.user_id = userIdFromDatabase;
  res.redirect("/urls");
});

//Logout and remove cookie history
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

//register endpoint
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("register");
});

//looping through the users database to find a matching email
function doesEmailExist(email) {
  const values = Object.keys(users).map(key => users[key]);
    let emailstatus;
  values.forEach((userObj) => {
    if (userObj.email === email){
      return emailstatus = true;
    } else {
      return emailstatus = false;
    }
  });
  return emailstatus;
}

//register handler
app.post("/register", (req, res) => {
  let randomString = generateRandomString();

  //check if email or password is empty strings, if so return error
  if (!req.body.email || !req.body.password) {
    res.status(401).send("error: please enter a valid username and password");
    return;
  }

  //check if email already exist, if so return error
  if (doesEmailExist(req.body.email)) {
    res.status(401).send('error: sorry username is used :-/ ');
    return;
  }
  const enteredPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(enteredPassword, 10);

  users[randomString] = {
    id: randomString,
    email: req.body.email,
    password: hashedPassword
  };
  req.session.user_id = users[randomString].id;
  res.redirect('/urls');
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});