/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
// eslint-disable-next-line no-unused-vars
var csrf = require("tiny-csrf");
const app = express();
const { Todo } = require("./models");
const bodypaser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodypaser.json());
const path = require("path");
app.use(express.urlencoded({ extented: false }));
app.use(cookieParser("shh! secret string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));



module.exports = {
  "**/*.js": ["eslint --fix", "prettier --write"],
};
//set EJS as view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (request, response) => {
  const allTodos = await Todo.getTodos();
  const overdueTodos = await Todo.getoverdueTodos();
  const dueTodayTodos = await Todo.getdueTodayTodos();
  const dueLaterTodos = await Todo.getdueLaterTodos();
  const CompletedTodos = await Todo.getCompleted();
  if (request.accepts("html")) {
    response.render("index", {
      allTodos,
      overdueTodos,
      dueTodayTodos,
      dueLaterTodos,
      CompletedTodos,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      allTodos, overdueTodos, dueTodayTodos, dueLaterTodos, CompletedTodos
    });
  }
});

app.get("/todos", async (request, response) => {
  console.log("Todo items", response.body);
  try {
    const todo = await Todo.findAll();
    return response.send(todo);
    // return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async (request, response) => {
  console.log("creating a todo", request.body);
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,

    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async (request, response) => {
  console.log("we have to update a todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
// eslint-disable-line no-unused-vars
app.delete("/todos/:id", async (request, response) => {
  console.log("Delete a todo by ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  }
  catch (error) {
    return response.status(422).json(error);
  }
});

module.exports = app;
