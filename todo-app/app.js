const express = require("express");
const app = express();
const csrf = require("tiny-csrf");
const { Todo, User } = require("./models");
const bodyPaser = require("body-parser");
var cookieParser = require("cookie-parser");
const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const flash = require("connect-flash");
const path = require("path");
app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.use(flash());

module.exports = {
  "*/.js": ["eslint --fix", "prettier --write"],
};

app.use(bodyPaser.json());
app.use(cookieParser("Somthing Went Wrong!!!"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
//set EJS as view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "my secret key 010903245678987654321",
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordfield: 'password'
}, (username, password, done) => {
  User.findOne({
    where: {
      email: username
    }
  })
    .then(async (user) => {
      const result = await bcrypt.compare(password, user.Password)
      if (result) {
        return done(null, user);
      } else {
        return done(null, false, { message: "INVALID PASSWORD" });
      }
    })
    .catch((error) => {
      console.log(error);
      return done(null, false, { message: "INVALID E-MAIL" });
    });
}));

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user)
    })
    .catch(error => {
      done(error, null)
    })
});

app.get("/", async (request, response) => {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedInUser = request.user.id;
  const overdueTodos = await Todo.getoverdueTodos(loggedInUser);
  const dueTodayTodos = await Todo.getdueTodayTodos(loggedInUser);
  const dueLaterTodos = await Todo.getdueLaterTodos(loggedInUser);
  const CompletedTodos = await Todo.getCompleted(loggedInUser);
  if (request.accepts("html")) {
    response.render("todos", {
      loggedInUser: request.user,
      overdueTodos,
      dueTodayTodos,
      dueLaterTodos,
      CompletedTodos,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      userId: loggedInUser,
      overdueTodos,
      dueTodayTodos,
      dueLaterTodos,
      CompletedTodos
    });
  }
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken()
  });
});

app.post("/users", async (request, response) => {
  //Hashing the password using bcrypt
  if (request.body.FirstName.length == 0) {
    request.flash("error", "FIRST NAME CAN'T BE EMPTY!");
    return response.redirect("/signup");
  } else if (request.body.Email.length == 0) {
    request.flash("error", "EMAIL CAN'T BE EMPTY!");
    return response.redirect("/signup");
  } else if (request.body.Password.trim().length == 0) {
    request.flash("error", "PASSWORD IS MANDATORY!");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect("/todos");
    })
  }
  catch (error) {
    console.log(error);
    request.flash("error", "EMAIL ALREADY IN USE!");
    response.redirect("/signup");
  }
});

app.get("/login", (request, response) => {
  response.render("login", {
    title: "login",
    csrfToken: request.csrfToken()
  });
});

app.post("/session", passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true,
}),
  (request, response) => {
    console.log(request.user);
    response.redirect("/todos");
  }
);

app.get("/signout", (request, response, next) => {
  //Signout
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  })
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("creating a todo", request.body);
  if (!request.body.title) {
    request.flash("error", "ADD A TITLE TO YOUR TODO!");
    return response.redirect("/todos");
  }
  if (!request.body.dueDate) {
    request.flash("error", "A TODO ITEM MUST CONTAIN DATE!");
    return response.redirect("/todos");
  }
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId: request.user.id
    });
    return response.redirect("/todos");
  }
  catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {

  try {
    const todo = await Todo.findByPk(request.params.id);
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  }
  catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
// eslint-disable-line no-unused-vars
app.delete("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("Delete a todo by ID: ", request.params.id);
  try {
    const st = await Todo.remove(request.params.id, request.user.id);
    return response.json(st > 0);
  }
  catch (error) {
    return response.status(422).json(error);
  }
});

module.exports = app;
