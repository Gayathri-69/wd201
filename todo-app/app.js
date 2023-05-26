/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
// eslint-disable-next-line no-unused-vars
var csrf = require("tiny-csrf");
const app = express();
const bodypaser = require("body-parser");
var cookieParser = require("cookie-parser");

const flash = require("connect-flash");
const path = require("path");
const passport = require('passport');
const connectEnsurelogin = require('connect-ensure-login');
const session = require('express-session');
const localStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const saltRounds = 10;
 
app.use(bodypaser.json());
app.use(express.urlencoded({ extented: false }));
app.use(cookieParser("shh! secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());
app.set("views", path.join(__dirname, "views"));


app.use(session({
  secret:"my-super-secret-key-8886142389",
  cookie:{
    maxAge:24*60*60*100
  },
 resave: true,
    saveUninitialized: true,
})
);


app.use(passport.initialize());
app.use(passport.session());
app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

passport.use(new localStrategy({
  usernameField: 'email',
  passwordField: 'password'
},(username,password,done)=>{
  User.findOne({ where: { email: username } })
  .then(async function (user) {
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      return done(null, user);
    } else {
      return done(null, false, { message: "Invalid password" });
    }
  })
  .catch((error) => {
    console.log(error);
    return done(null, false,{ message: "Invalid e-mail"});
  });
}));


passport.serializeUser((user, done)=>{
  console.log("Serializing user in session", user.id);
  done(null,user.id);
});

passport.deserializeUser((id,  done)=>{
  User.findByPk(id)
  .then(user=>{
    done(null, user)
  })
  .catch(error=>{
    done(error, null)
  })
  
});





module.exports = {
  "**/*.js": ["eslint --fix", "prettier --write"],
};
//set EJS as view engine
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

const { Todo ,User, sequelize, Sequelize} = require("./models");

app.get("/", async (request, response) => {
 
    response.render("index", {
      title:"Todo application",
      csrfToken: request.csrfToken(),
    });
});


app.get("/todos", connectEnsurelogin.ensureLoggedIn(), async (request, response) => {
  const loggedInUser = request.user.id;
  const allTodos = await Todo.getTodos(loggedInUser);
  const overdueTodos = await Todo.getoverdueTodos(loggedInUser);
  const dueTodayTodos = await Todo.getdueTodayTodos(loggedInUser);
  const dueLaterTodos = await Todo.getdueLaterTodos(loggedInUser);
  const CompletedTodos = await Todo.getCompleted(loggedInUser);
  if (request.accepts("html")) {
    response.render("todos", {
     loggedInUser: request.user,
      title:"Todo application",
      allTodos,
      overdueTodos,
      dueTodayTodos,
      dueLaterTodos,
      CompletedTodos,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
       userId: loggedInUser,
      allTodos, overdueTodos, dueTodayTodos, dueLaterTodos, CompletedTodos,
        csrfToken: request.csrfToken(),
    });
  }
});



app.get("/signup", async (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  response.render("signup", {
    title: "signup",
    csrfToken: request.csrfToken(),
  });
});
app.post("/users",async (request,response)=>{
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  console.log(hashedPwd);
  if (request.body.firstName.length == 0) {
    request.flash("error", "First name can't be empty!");
    return response.redirect("/signup");
  } else if (request.body.email.length == 0) {
    request.flash("error", "E-mail can't be empty!");
    return response.redirect("/signup");
  } else if (request.body.password.trim().length == 0) {
    request.flash("error", "Password required!");
    return response.redirect("/signup");
  }
  try {
    const user=await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    });
    request.login(user, (err)=>{
      if(err){
        console.log(err)
      }
      response.redirect("/todos");
    })
  } catch (error){
    console.log(error);
    request.flash("error", "Error! Email Already in use");
    response.redirect("/signup");
  }
})


app.get("/login", (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});


app.get("/signout",(request,response, next)=>{
  request.logout((err)=>{ 
    if (err){ return next(err);}
    response.redirect("/");
  })
});
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
   (request, response) => {
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

app.post("/todos",connectEnsurelogin.ensureLoggedIn(), async (request, response) => {
  console.log("creating a todo", request.body);
  console.log(request.user);
  if (!request.body.title) {
    request.flash("error", "ADD TITLE TO YOUR TODO!");
    return response.redirect("/todos");
  }
  if (!request.body.dueDate) {
    request.flash("error", "TODO ITEM MUST CONTAIN DATE!");
    return response.redirect("/todos");
  }
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId: request.user.id,
      completed: request.body.completed,

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

app.put("/todos/:id", connectEnsurelogin.ensureLoggedIn(), async (request, response) => {
  console.log("we have to update a todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const todo = await Todo.findByPk(request.params.id);
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
// eslint-disable-line no-unused-vars
app.delete(
  "/todos/:id",
  connectEnsurelogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Delete a todo by ID: ", request.params.id);
    const loggedInUser = request.user.id;
    try {
      await Todo.remove(request.params.id, loggedInUser);
      // response.send(deleted > 0);
      // return response.json(deleted);
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
