const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// const urlDatabase = {
//   b2xVn2: "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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
  console.log(req.cookies.user_id);

  // console.log("user", users[req.cookies["user_id"]]);
  // let templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };

  let user;
  if (req.cookies.user_id) {
    user = req.cookies.user_id;
  } else {
    res.redirect("/login");
    return;
  }

  let templateVars = {
    urls: urlsForUser(req.cookies.user_id),
    user: users[user]
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };

  if (!req.cookies.user_id) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
  return;
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
  return;
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: undefined //I need to make sure no logged in user can see this
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
  if (urlDatabase[req.params.shortURL].userID === req.cookies.user_id)
    delete urlDatabase[req.params.shortURL];
  else {
    res.statusCode = 403;
    res.send();
    return;
  }
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.cookies.user_id) {
    urlDatabase[req.params.shortURL] = req.body.longURL;
  } else {
    res.statusCode = 403;
    res.send();
  }
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  // res.cookie("user_id", req.body.username);
  const { email, password } = req.body;

  console.log("request", req.body);
  if (email === "" || password === "") {
    res.statusCode = 403;
    res.end("The email or password is empty. Status code: 403");
  } else {
    const user = emailLookup(users, email);
    if (!user) {
      res.statusCode = 403;
      res.end(
        "This username is not recognized. User is not found! Please try again!"
      );
    } else {
      if (password === user.password) {
        res.cookie("user_id", user.id);
        res.redirect("/urls");
      } else {
        res.statusCode = 403;
        res.end(
          "Invalid password, please try again. The password is case sensitive."
        );
      }
    }
  }
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
  } else if (emailCheck(users, req.body.email)) {
    res.statusCode = 400;
    res.end("The email is already being used. Status code: 400");
  }

  let randomID = generateRandomString();

  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", randomID);

  console.log(users[randomID]);
  res.redirect("/urls");
});

// app.post("/urls/:shortURL", (req, res) => {
//   let longURL = req.params.longURL;
//   urlDatabase[req.params.shortURL] = longURL;

//   res.redirect("/urls");
// });

app.post("/urls", (req, res) => {
  // let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  // urlDatabase[shortURL] = longURL;

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  };

  // console.log(shortURL);
  // console.log(req.body); // Log the POST request body to the console
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
  for (const check of Object.keys(users)) {
    if (email === users[check].email) {
      return true;
    }
  }
  return false;
};

const emailLookup = function(users, email) {
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
