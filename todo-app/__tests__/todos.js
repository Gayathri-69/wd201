/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");


let server, agent;
function extractCsrfToken(res){
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
 

}
describe("Todo test suite", function () {
    beforeAll(async () => {
      await db.sequelize.sync({ force: true });
      server = app.listen(3000, () => {});
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
  
    test("Creates a todo and responds with json at /todos POST endpoint", async () => {
      const res = await agent.get("/");
      const csrfToken = extractCsrfToken(res);
      const response = await agent.post("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf:csrfToken
      });
      expect(response.statusCode).toBe(302);
      
    });


  
    test("Marks a todo with the given ID as complete", async () => {
      let res = await agent.get("/");
      let csrfToken = extractCsrfToken(res);
      await agent.post("/todos").send({
        title: "complete homework",
        dueDate: new Date().toISOString(),
        completed: true,
        _csrf: csrfToken,
      });
  
      const groupedTodosResponse = await agent
        .get("/")
        .set("Accept", "applicatioon/json");
      const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
      const dueTodayCount = parsedGroupedResponse.dueTodayTodos.length;
      const latestTodo = parsedGroupedResponse.dueTodayTodos[dueTodayCount - 1];
  
      res = await agent.get("/");
      csrfToken = extractCsrfToken(res);
  
      const markCompletedResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
      });
  
        const parsedUpdateResponse = JSON.parse(markCompletedResponse.text);
        expect(parsedUpdateResponse.completed).toBe(true);
  
  
    });

    test("Marks a todo with the given ID as complete", async () => {
      let res = await agent.get("/");
      let csrfToken = extractCsrfToken(res);
      await agent.post("/todos").send({
        title: "Buy Books",
        dueDate: new Date().toISOString(),
        completed: true,
        _csrf: csrfToken,
      });
  
      const groupedTodosResponse = await agent
        .get("/")
        .set("Accept", "applicatioon/json");
      const ParsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
      const dueTodaycount = ParsedGroupedResponse.todaytodos.length;
      const latestTodo = ParsedGroupedResponse.todaytodos[dueTodaycount - 1];
  
      res = await agent.get("/");
      csrfToken = extractCsrfToken(res);
  
      const markCompletedResponse = await agent
        .put(`/todos/${latestTodo.id}`)
        .send({
          _csrf: csrfToken,
        });
  
      const parsedUpdateResponse = JSON.parse(markCompletedResponse.text);
      expect(parsedUpdateResponse.completed).toBe(false);
  
  
    });
     test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
      let res = await agent.get("/");
      let csrfToken = extractCsrfToken(res);
      await agent.delete("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      });
      const groupedTodosResponse = await agent.get("/")
      .set("Accept", "applicatioon/json");
      const ParsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
      const dueTodaycount = ParsedGroupedResponse.dueTodayTodos.length;
      const latestTodo = ParsedGroupedResponse.dueTodayTodos[dueTodaycount - 1];
       
      res = await agent.get("/");
      csrfToken = extractCsrfToken(res);

    const DeletedResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });

    const parsedUpdateResponse = JSON.parse(DeletedResponse.text);
    expect(parsedUpdateResponse.success).toBe(true);
  });
});
