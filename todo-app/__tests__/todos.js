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
test("Update a todo with given ID as complete /incomplete ", async () => {
    const agent = request.agent(server);
    await login(agent, "Allen2023@gmail.com", "12345678");
    let r = await agent.get("/todos");
    let csrfToken = extractCsrfToken(r);
    await agent.post("/todos").send({
      title: "Buy movietickets",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos") // list of todos
      .set("Accept", "application/json");

    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text); //
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latesttd = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    //console.log("todoid",latesttd)
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${latesttd.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });

    const UpdateResponse = JSON.parse(markCompleteResponse.text); //
    expect(UpdateResponse.completed).toBe(true);

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse1 = await agent
      .put(`/todos/${latesttd.id}`)
      .send({
        _csrf: csrfToken,
        completed: false,
      });

    const UpdateResponse1 = JSON.parse(markCompleteResponse1.text);
    expect(UpdateResponse1.completed).toBe(false);
  });
  

 test("Deletes a todo ", async () => {
    const agent = request.agent(server);
    await login(agent, "usera@gmail.com", "123456789");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy fruits",
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
    const todoID = latestTodo.id;
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const deleteTodo = await agent.delete(`/todos/${todoID}`).send({
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
