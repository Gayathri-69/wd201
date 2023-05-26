/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");


let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) =>{
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email:username,
    password:password,
    _csrf:csrfToken,
  });
};
describe("Todo test suite", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => { });
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName:"domain",
      lastName:"",
      email: "pqr@gmail.com",
      password: "123456",
      _csrf: csrfToken,

    });
    expect(res.statusCode).toBe(302);
  });

    test("Sign out",async () =>{
      let res = await agent.get("/todos");
      expect(res.statusCode).toBe(200);
      res = await agent.get("/signout");
      expect(res.statusCode).toBe(302);
      res = await agent.get("/todos");
      expect(res.statusCode).toBe(302);
    });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent,"pqr@gmail.com","123456");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    });
    expect(response.statusCode).toBe(302);

  });
   test("Marks a todo with the given ID as complete", async () => {
    const agent = request.agent(server);
    await login(agent,"pqr@gmail.com","123456");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayTodos.length;
    const latestTodo = parsedGroupedResponse.dueTodayTodos[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompletedResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });

    const parsedUpdateResponse = JSON.parse(markCompletedResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);


  });

  

  test("Marks a todo with the given ID as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent,"pqr@gmail.com","123456");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayTodos.length;
    const latestTodo = parsedGroupedResponse.dueTodayTodos[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);


    console.log(latestTodo.completed);
    const markIncompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: false,
      });
    const parsedUpdateResponse = JSON.parse(markIncompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });
  

test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent,"pqr@gmail.com","123456");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent.get("/todos")
      .set("Accept", "application/json");
    const ParsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodaycount = ParsedGroupedResponse.dueTodayTodos.length;
    const latestTodo = ParsedGroupedResponse.dueTodayTodos[dueTodaycount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const deleteTodo = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });

    expect(deleteTodo.statusCode).toBe(200);
  });


 
   test("User A cannot delete User B Todos", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "user1",
      lastName: "a",
      email: "xyz@gmail.com",
      password: "789456",
      _csrf: csrfToken,
    });

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/todos").send({
      title: "Test todo",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const userA = res.id;

    await agent.get("/signout");

    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "user2",
      lastName: "b",
      email: "pqr@gmail.com",
      password: "123456",
      _csrf: csrfToken,
    });

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const parsedResponse = await agent.delete(`/todos/${userA}`).send({
      _csrf: csrfToken,
    });
    expect(parsedResponse.statusCode).toBe(422);
  });
  
});
