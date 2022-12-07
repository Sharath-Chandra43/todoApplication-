const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

let database;
const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is running on http://localhost:3001/");
    });
  } catch (error) {
    console.log(`DataBase error is ${error.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const Convert = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

app.get("/todos/", async (request, response) => {
  const { priority, status } = request.query;
  const getTODOQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
     status LIKE '%${status}%' or
     priority LIKE '%${priority}%';`;
  const todoArray = await database.all(getTODOQuery);
  response.send(todoArray);
});

app.get("/todos/", async (request, response) => {
  const { search_q } = request.query;
  const getTODOQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
     todo LIKE '%${search_q}%';`;
  const todoArray = await database.all(getTODOQuery);
  response.send(todoArray);
});

//api2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `select * from todo where id=${todoId};`;
  const responseResult = await database.get(getToDoQuery);
  response.send(Convert(responseResult));
});
//api3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addTodoQuery = `
    INSERT INTO
      todo (id,todo,priority,status)
    VALUES
      (
         ${id},
        '${todo}',
        '${priority}',
        '${status}'
      );`;

  const dbResponse = await database.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//api4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT 
      *
    FROM 
      todo
    WHERE
      id=${todoId};`;

  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
  UPDATE 
      todo
    SET 
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE 
      id=${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
