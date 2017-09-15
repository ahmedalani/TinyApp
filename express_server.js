var express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
   { id:  'uWhWIl' ,
     email:  'ahmed@alani' ,
     password:  'alani'  },
  nlQUFi:
   { id:  'nlQUFi' ,
     email:  'shosho@shosho' ,
     password: 'shosho'  }
};

//middleware: object passed to all templets through this function
app.use(function (req, res, next) {
   // res.locals = {
   //   username: req.cookies["username"]
   // };
   res.locals.user = users[req.cookies["user_id"]]
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
console.log(urlForUser("uWhWIl"));
//passes the urlDatabase to urls_index and render the page
app.get("/urls", (req, res) => {
  let userid = req.cookies["user_id"];
  let templateVars = { urls: urlForUser(userid) };
  res.render("urls_index", templateVars);
});

//for to submit new urls to database
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]){
  res.render("urls_new");
  } else {
    res.redirect("../urls");
  }
});

//redirect to the new URL created and assign a short URL to the long URL created.
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    "id": randomString,
    "userID": req.cookies["user_id"],
    "longURL": req.body.longURL
  }
  // console.log(urlDatabase);
  res.redirect(`/urls`);
});
//404 needed
//passing data to urls_show templet and rendering the templet
app.get("/urls/:id", (req, res) => {
  let userid = req.cookies["user_id"];
  if (!userid) {
    res.redirect("/urls");
    return;
  }

  let urlobject = urlDatabase[req.params.id]
  if (!urlobject) {
    res.sendStatus(404);
    return;
  }
  let templateVars = {
    shortURL : req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  }
    // shortURL: req.params.id,
    // longURL: urlobject.longURL
  res.render("urls_show", templateVars);
});
//404 needed
//when client enters a short URL he get redirected to the long URL assigned.
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Delete Item
app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  let user_id = req.cookies["user_id"];
  if (!id || !user_id) {
    res.sendStatus(401);
    return;
  }
  if ((req.cookies["user_id"]) === (urlDatabase[id]["user_id"])) {
    delete urlDatabase[id];
    res.redirect('/urls');
  } else {
    res.status(403).send("sorry you're only allowed to edit your ownd URLs :-/ ");
  }
});
//404 needed
//Edit the long URL
app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  let userID = urlDatabase[id]["userID"];
  if (userID === req.cookies["user_id"]) {
    urlDatabase[id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
      res.status(403).send("sorry you're only allowed to edit your ownd URLs :-/ ");
  }
});

// login endpoint
app.get('/login', (req, res) => {
  res.render('login')
});




//login handler & set the cookie then redirect back to urls
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  function findUser (email, password) {
    for (let key in users) {
      if (users[key].email === email && users[key].password === password) {
        return users[key];
      }
    }
  }
  const userObj = findUser(email, password);
  if (!userObj) {
    res.status(403).send("error: username or password are invalid")
  }
  res.cookie('user_id', userObj.id);
  res.redirect("/urls");
});
  // const values = Object.keys(users).map(key => users[key]);

  // let usernameValue = req.body.username;
  // let passwordValue = req.body.password;
  // res.cookie("username", usernameValue);
  // res.cookie("password", passwordValue);
  // res.redirect("/urls");


//Logout and remove cookie history
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//register endpoint
app.get('/register', (req, res) => {
  res.render('register');
});

//looping through the users database to find a matching email
function doesEmailExist(email) {
  const values = Object.keys(users).map(key => users[key]);
  for (let i = 0; i < values.length; i++) {
    if (values[i].email === email) {
      return true;
    } else {
        return false;
      }
  }
}

//register handler
app.post('/register', (req, res) => {
  let randomString = generateRandomString();

  //check if email or password is empty strings, if so return error
  if (!req.body.email || !req.body.password) {
    res.send('error: please enter a valid username and password');
  }
  //check if email already exist, if so return error
  if (doesEmailExist(req.body.email)) {
    res.send('error: sorry username is used :-/ ');
  }
  users[randomString] = {
    id: randomString,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", users[randomString].id);
  res.redirect('/urls');
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});