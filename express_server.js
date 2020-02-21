const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const { getUserByEmail } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({ name: "user_id", secret: "asdfg" }));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  userRandomID: {
    id: "user_id",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  console.log("users", users);

  let user;
  if (req.session.user_id) {
    user = req.session.user_id;
  } else {
    res.redirect("/login");
    return;
  }

  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[user]
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };

  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  console.log(req.session.user_id);
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.session.user_id]
  };
  console.log("templateVarsString", templateVars);
  console.log("urlsDatabase", urlDatabase);
  res.render("urls_show", templateVars);
  return;
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
  return;
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: undefined //Need to make sure no logged in user can see this
  };

  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: undefined
  };

  res.render("urls_login", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id)
    delete urlDatabase[req.params.shortURL];
  else {
    res.statusCode = 403;
    res.send();
    return;
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  } else {
    res.statusCode = 403;
    res.send();
  }
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.statusCode = 403;
    res.end("The email or password is empty. Status code: 403"); // In browser if username or password is empty, the message, "The email or password is empty. Status code: 403", is displayed.
  } else {
    const user = emailLookup(users, email);
    if (!user) {
      res.statusCode = 403;
      res.end(
        "This username is not recognized. User is not found! Please try again!"
      ); // In browser if user inputs a wrong username in the login page. When a account is registered the message, "This username is not recognized. User is not found! Please try again!", is displayed.
    } else {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        req.session.user_id = user.id;
        res.redirect("/urls");
      } else {
        res.statusCode = 403;
        res.end(
          "Invalid password, please try again. The password is case sensitive."
        ); //In browser if user inputs a password that is wrong in the login page, the message ""Invalid password, please try again. The password is case sensitive." is displayed
      }
    }
  }
  getUserByEmail(req.body.email, users);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.statusCode = 400;
    res.end("The email or password is empty. Status code: 400");
    //This error message shows up if the user does not register email or password in the browser.
  } else if (emailCheck(users, req.body.email)) {
    res.statusCode = 400;
    res.end("The email is already being used. Status code: 400");
  } //This error message shows up when user registers the same username and password that has already been registered

  let randomID = generateRandomString();

  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  console.log("users:", users);

  req.session.user_id = randomID;

  getUserByEmail(req.body.email, users);

  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };

  res.redirect("/urls/" + shortURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let randString = Math.random()
    .toString(36)
    .substring(2, 8);
  return randString;
}

const emailCheck = function(users, email) {
  //The emailCheck function is used to compare the email in users object with email inputted by the user.
  for (const check of Object.keys(users)) {
    if (email === users[check].email) {
      return true;
    }
  }
  return false;
};

const emailLookup = function(users, email) {
  // The emailLookup function is used to compare the email in users object with email inputted into the browser and returns email stored in object

  for (const objectKey of Object.keys(users)) {
    if (email === users[objectKey].email) {
      console.log("true");
      return users[objectKey];
    }
  }
  return false;
};

function urlsForUser(id) {
  const result = {};
  for (const obj in urlDatabase) {
    if (urlDatabase[obj].userID === id) {
      result[obj] = urlDatabase[obj];
    }
  }
  console.log(result);
  return result;
}
