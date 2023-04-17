/* eslint-disable space-before-function-paren */
"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static async addTask(params) {
      return Todo.create(params);
    }

    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      const overdueTodos = await Todo.overdue();
      const formattedOverdueTodos = overdueTodos
        .map((todo) => todo.displayableString())
        .join("\n")
        .trim();
      console.log(formattedOverdueTodos);
      console.log("\n");

      console.log("Due Today");
      const dueTodayTodos = await Todo.dueToday();
      const formattedDueTodayTodos = dueTodayTodos
        .map((todo) => todo.displayableString())
        .join("\n")
        .trim();
      console.log(formattedDueTodayTodos);
      console.log("\n");

      console.log("Due Later");
      const dueLaterTodos = await Todo.dueLater();
      const formattedDueLaterTodos = dueLaterTodos
        .map((todo) => todo.displayableString())
        .join("\n")
        .trim();
      console.log(formattedDueLaterTodos);
    }

    static async overdue() {
      const overdueTodos = await Todo.findAll({
        where: {
          dueDate: { [Op.lt]: new Date() },
        },
      });

      return overdueTodos;
    }

    static async dueToday() {
      const dueTodayTodos = await Todo.findAll({
        where: {
          dueDate: { [Op.eq]: new Date() },
        },
      });

      return dueTodayTodos;
    }

    static async dueLater() {
      const dueLaterTodos = await Todo.findAll({
        where: {
          dueDate: { [Op.gt]: new Date() },
        },
      });

      return dueLaterTodos;
    }

    static async markAsComplete(id) {
      await Todo.update(
        {
          completed: true,
        },
        {
          // eslint-disable-next-line object-shorthand
          where: { id: id },
        }
      );
    }

    displayableString() {
      const checkbox = this.completed ? "[x]" : "[ ]";
      return `${this.id}. ${checkbox} ${this.title}${
        String(this.dueDate) === new Date().toISOString().slice(0, 10)
          ? ""
          : " " + this.dueDate
      }`;
    }
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};