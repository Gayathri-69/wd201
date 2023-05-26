/* eslint-disable no-unused-vars */
const { request, response } = require("express");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
const flash = require("connect-flash");
//res.render(req.flash(type, message));

const passport = require("passport");
const connectionEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;
app.use(cookieParser("shh! some secret string"));

app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash({}));

app.use(
  session({
    secret: "my-super-secret-key-217281726152615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passportField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(null, false, { message: "Invalid E-mail" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const { Todo, User, sequelize, Sequelize } = require("./models");

// app.get("/", function (request, response) {
//   response.send("Hello World");
// });
app.set("view engine", "ejs");
app.get("/", async (request, response) => {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectionEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const todaytodos = await Todo.getToday(loggedInUser);
    const overduetodos = await Todo.getOverdue(loggedInUser);
    const duelatertodos = await Todo.getdueLater(loggedInUser);
    const CompletedTodos = await Todo.getcompleted(loggedInUser);
    console.log(loggedInUser);

    if (request.accepts("html")) {
      response.render("todos", {
        loggedInUser: request.user,
        todaytodos,
        overduetodos,
        duelatertodos,
        CompletedTodos,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        userId: loggedInUser,
        todaytodos,
        overduetodos,
        duelatertodos,
        CompletedTodos,
        csrfToken: request.csrfToken(),
      });
    }
  }
);

app.get("/signup", async (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  response.render("signup", {
    title: "signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  if (request.body.firstName.length == 0) {
    request.flash("error", "First Name cant be empty");
    return response.redirect("/signup");
  } else if (request.body.email.length == 0) {
    request.flash("error", "Email cant be empty");
    return response.redirect("/signup");
  } else if (request.body.password.length == 0) {
    request.flash("error", "password cannot be empty");
    return response.redirect("/signup");
  }
  //console.log("FirstName",request.body.firstName0)
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "Error! Email Already in use");
    response.redirect("/signup");
    //return response.status(422).json(error);
  }
});

app.get("/login", (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/todos");
  }
);

app.get("/todo", async function (request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll();
    return response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/todos",
  connectionEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Creating a todo", request.body);
    //Todo
    console.log(request.user);
    if (request.body.title.length == 0) {
      request.flash("error", "Todo title cannot be empty");
      return response.redirect("/todos");
    }
    if (request.body.dueDate.length == 0) {
      request.flash("error", "Todo duedate cannot be empty");
      return response.redirect("/todos");
    }

    try {
      const todo = await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        completed: request.body.completed,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      if (error instanceof Sequelize.ValidationError) {
        const error_messsage = error.errors.map((err) => err.message);
        console.log(error_messsage);
        error_messsage.forEach((seq_error) => {
          if (seq_error == "Validition len on title failed") {
            request.flash("error", "Todo cannot be empty!");
          }
          if (seq_error == "Validation isDate on dueDate failed") {
            request.flash("error", "Date cannot be empty!");
          }
        });
        response.redirect("/todos");
      } else {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  }
);

app.put(
  "/todos/:id",
  connectionEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("We have to update a todo with ID:", request.params.id);

    try {
      const todo = await Todo.findByPk(request.params.id);
      const updatedTodo = await todo.setCompletionStatus(todo.completed);
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectionEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    const loggedInUser = request.user.id;
    try {
      await Todo.remove(request.params.id, loggedInUser);
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
